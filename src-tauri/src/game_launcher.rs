use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct LaunchResult {
    pub success: bool,
    pub message: String,
    pub pid: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LaunchHistoryItem {
    pub id: i32,
    pub scene_id: Option<String>,
    pub launched_at: String,
    pub duration_secs: Option<i32>,
    pub crash: bool,
}

pub mod commands {
    use super::*;
    use crate::AppState;
    use tauri::State;

    #[tauri::command]
    pub async fn launch_game(
        state: State<'_, AppState>,
        scene_id: Option<String>,
        extra_args: Vec<String>,
    ) -> Result<LaunchResult, String> {
        let paths_guard = state.game_paths.lock().unwrap();

        if let Some(ref paths) = *paths_guard {
            let exe_path = &paths.exe_path;

            if !std::path::Path::new(exe_path).exists() {
                return Err(format!("游戏可执行文件不存在: {}", exe_path));
            }

            // 构建启动参数
            let mut args = Vec::new();

            // 从场景获取启动参数
            if let Some(ref scene_id) = scene_id {
                let db = state.db.lock().unwrap();
                if let Ok(scenes) = db.get_all_scenes() {
                    if let Some(scene) = scenes.iter().find(|s| &s.id == scene_id) {
                        args.extend(scene.launch_args.clone());
                    }
                }
            }

            // 额外参数
            args.extend(extra_args);

            // 启动游戏
            let child = Command::new(exe_path)
                .args(&args)
                .spawn()
                .map_err(|e| format!("启动游戏失败: {}", e))?;

            let pid = child.id();

            // 记录启动历史
            let db = state.db.lock().unwrap();
            db.conn.execute(
                "INSERT INTO launch_history (scene_id, launched_at, crash) VALUES (?1, ?2, 0)",
                rusqlite::params![scene_id, chrono::Utc::now().to_rfc3339()],
            )
            .ok();

            Ok(LaunchResult {
                success: true,
                message: format!("游戏已启动 (PID: {})", pid),
                pid: Some(pid),
            })
        } else {
            Err("未检测到游戏路径，请先配置".to_string())
        }
    }

    #[tauri::command]
    pub async fn get_launch_history(
        state: State<'_, AppState>,
    ) -> Result<Vec<LaunchHistoryItem>, String> {
        let db = state.db.lock().unwrap();
        let mut stmt = db
            .conn
            .prepare(
                "SELECT id, scene_id, launched_at, duration_secs, crash
                 FROM launch_history ORDER BY launched_at DESC LIMIT 50",
            )
            .map_err(|e| e.to_string())?;

        let history = stmt
            .query_map([], |row| {
                Ok(LaunchHistoryItem {
                    id: row.get(0)?,
                    scene_id: row.get(1)?,
                    launched_at: row.get(2)?,
                    duration_secs: row.get(3)?,
                    crash: row.get::<_, i32>(4)? != 0,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        Ok(history)
    }

    #[tauri::command]
    pub async fn validate_game_files(
        state: State<'_, AppState>,
    ) -> Result<String, String> {
        let paths_guard = state.game_paths.lock().unwrap();

        if let Some(ref paths) = *paths_guard {
            let exe = std::path::Path::new(&paths.exe_path);
            if !exe.exists() {
                return Err("游戏可执行文件缺失，请通过 Steam 验证游戏文件完整性".to_string());
            }

            // 检查关键目录
            let checks = vec![
                ("游戏主程序", exe.exists()),
                (
                    "common 目录",
                    std::path::Path::new(&paths.game_path)
                        .join("game")
                        .join("common")
                        .exists(),
                ),
                (
                    "events 目录",
                    std::path::Path::new(&paths.game_path)
                        .join("game")
                        .join("events")
                        .exists(),
                ),
            ];

            let failures: Vec<_> = checks.iter().filter(|(_, ok)| !ok).collect();

            if failures.is_empty() {
                Ok("所有游戏文件验证通过".to_string())
            } else {
                let names: Vec<_> = failures.iter().map(|(name, _)| *name).collect();
                Err(format!("以下组件缺失: {}", names.join(", ")))
            }
        } else {
            Err("未检测到游戏路径".to_string())
        }
    }
}
