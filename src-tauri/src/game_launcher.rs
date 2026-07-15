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
    use crate::mod_manager::write_dlc_load_json;
    use tauri::State;

    #[tauri::command]
    pub async fn launch_game(
        state: State<'_, AppState>,
        scene_id: Option<String>,
        extra_args: Vec<String>,
        mod_ids: Vec<String>,
    ) -> Result<LaunchResult, String> {
        let paths_guard = state.game_paths.lock().unwrap();

        if let Some(ref paths) = *paths_guard {
            let exe_path = &paths.exe_path;

            if !std::path::Path::new(exe_path).exists() {
                return Err(format!("游戏可执行文件不存在: {}", exe_path));
            }

            // 写入 dlc_load.json 设置 mod 加载顺序
            if !mod_ids.is_empty() {
                write_dlc_load_json(&paths.user_data_path, &mod_ids)?;
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

            // 额外参数（去重）
            for arg in &extra_args {
                if !args.contains(arg) {
                    args.push(arg.clone());
                }
            }

            // 启动游戏
            match Command::new(exe_path)
                .args(&args)
                .spawn()
            {
                Ok(child) => {
                    let pid = child.id();

                    // 记录启动历史和活动
                    let db = state.db.lock().unwrap();
                    db.conn.execute(
                        "INSERT INTO launch_history (scene_id, launched_at, crash) VALUES (?1, ?2, 0)",
                        rusqlite::params![scene_id, chrono::Utc::now().to_rfc3339()],
                    ).ok();

                    let mod_info = if !mod_ids.is_empty() {
                        format!(" ({} 个 Mod)", mod_ids.len())
                    } else {
                        String::new()
                    };

                    db.add_activity(
                        "launch",
                        "游戏已启动",
                        &format!("Victoria 3 已启动{} | PID: {}", mod_info, pid),
                    ).ok();

                    // 更新场景最后使用时间
                    if let Some(ref sid) = scene_id {
                        db.conn.execute(
                            "UPDATE scenes SET last_used = ?1 WHERE id = ?2",
                            rusqlite::params![chrono::Utc::now().to_rfc3339(), sid],
                        ).ok();
                    }

                    Ok(LaunchResult {
                        success: true,
                        message: format!("游戏已启动 (PID: {})", pid),
                        pid: Some(pid),
                    })
                }
                Err(e) => {
                    let db = state.db.lock().unwrap();
                    db.add_activity("error", "启动失败", &format!("{}", e)).ok();

                    Err(format!("启动游戏失败: {}", e))
                }
            }
        } else {
            Err("未检测到游戏路径，请先检测 Steam 安装".to_string())
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
                (
                    "localization 目录",
                    std::path::Path::new(&paths.game_path)
                        .join("game")
                        .join("localization")
                        .exists(),
                ),
                (
                    "gui 目录",
                    std::path::Path::new(&paths.game_path)
                        .join("game")
                        .join("gui")
                        .exists(),
                ),
            ];

            let failures: Vec<_> = checks.iter().filter(|(_, ok)| !ok).collect();

            if failures.is_empty() {
                let db = state.db.lock().unwrap();
                db.add_activity("verify", "文件验证", "所有游戏文件验证通过").ok();
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
