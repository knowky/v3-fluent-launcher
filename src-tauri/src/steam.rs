use serde::{Deserialize, Serialize};
use std::path::PathBuf;

pub const VICTORIA3_APP_ID: u32 = 529340;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GamePaths {
    pub game_path: String,
    pub user_data_path: String,
    pub workshop_path: String,
    pub exe_path: String,
    pub version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameInfo {
    pub paths: Option<GamePaths>,
    pub installed: bool,
    pub version: String,
    pub dlc_count: usize,
    pub mod_count: usize,
}

/// 统计已安装的 DLC 数量
fn count_dlcs(game_path: &str) -> usize {
    let dlc_dir = PathBuf::from(game_path).join("game").join("dlc");
    if !dlc_dir.exists() {
        // 也尝试直接在 game 目录下查找 dlc 子目录
        let alt_dlc = PathBuf::from(game_path).join("dlc");
        if alt_dlc.exists() {
            return std::fs::read_dir(&alt_dlc)
                .map(|r| r.filter_map(|e| e.ok()).filter(|e| e.path().is_dir()).count())
                .unwrap_or(0);
        }
        return 0;
    }
    std::fs::read_dir(&dlc_dir)
        .map(|r| r.filter_map(|e| e.ok()).filter(|e| e.path().is_dir()).count())
        .unwrap_or(0)
}

/// 自动检测 Steam 和 Victoria 3 路径
pub fn detect_game_paths() -> Result<GamePaths, String> {
    // Windows 注册表检测 Steam 安装路径
    let steam_path = detect_steam_install()?;

    // 读取 libraryfolders.vdf 找到 Victoria 3 所在库
    let library_folders = steam_path.join("steamapps").join("libraryfolders.vdf");
    let game_lib = find_game_library(&library_folders)?;

    // 构建路径
    let game_path = game_lib
        .join("steamapps")
        .join("common")
        .join("Victoria 3");
    let workshop_path = game_lib
        .join("steamapps")
        .join("workshop")
        .join("content")
        .join(VICTORIA3_APP_ID.to_string());

    // 用户数据路径
    let user_data_path = dirs::document_dir()
        .unwrap_or_default()
        .join("Paradox Interactive")
        .join("Victoria 3");

    let exe_path = game_path.join("binaries").join("victoria3.exe");

    // 读取游戏版本
    let version = read_game_version(&game_path).unwrap_or_else(|_| "未知".to_string());

    Ok(GamePaths {
        game_path: game_path.to_string_lossy().to_string(),
        user_data_path: user_data_path.to_string_lossy().to_string(),
        workshop_path: workshop_path.to_string_lossy().to_string(),
        exe_path: exe_path.to_string_lossy().to_string(),
        version,
    })
}

fn detect_steam_install() -> Result<PathBuf, String> {
    // 方法 1: 注册表 (Windows)
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let output = Command::new("reg")
            .args([
                "query",
                r"HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Valve\Steam",
                "/v",
                "InstallPath",
            ])
            .output()
            .map_err(|e| format!("无法读取注册表: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        if let Some(line) = stdout.lines().find(|l| l.contains("InstallPath")) {
            let path_str = line
                .split("REG_SZ")
                .nth(1)
                .unwrap_or("")
                .trim()
                .to_string();
            if !path_str.is_empty() {
                return Ok(PathBuf::from(&path_str));
            }
        }
    }

    // 方法 2: 默认安装路径
    let default_paths = vec![
        PathBuf::from(r"C:\Program Files (x86)\Steam"),
        PathBuf::from(r"D:\Steam"),
        PathBuf::from(r"E:\Steam"),
    ];

    for path in default_paths {
        if path.join("steam.exe").exists() {
            return Ok(path);
        }
    }

    Err("未找到 Steam 安装".to_string())
}

fn find_game_library(library_folders_path: &PathBuf) -> Result<PathBuf, String> {
    let content = std::fs::read_to_string(library_folders_path)
        .map_err(|e| format!("无法读取 libraryfolders.vdf: {}", e))?;

    // 简单 VDF 解析
    for line in content.lines() {
        let line = line.trim();
        if line.starts_with("\"path\"") {
            if let Some(path_str) = line.split('"').nth(3) {
                let lib_path = PathBuf::from(path_str.replace("\\\\", "\\"));
                let manifest = lib_path
                    .join("steamapps")
                    .join(format!("appmanifest_{}.acf", VICTORIA3_APP_ID));
                if manifest.exists() {
                    return Ok(lib_path);
                }
            }
        }
    }

    // 回退：使用 Steam 安装目录本身
    let steam_path = library_folders_path.parent().unwrap().parent().unwrap();
    Ok(steam_path.to_path_buf())
}

fn read_game_version(game_path: &PathBuf) -> Result<String, String> {
    let launcher_settings = game_path.join("launcher").join("launcher-settings.json");
    if launcher_settings.exists() {
        let content = std::fs::read_to_string(&launcher_settings)
            .map_err(|e| format!("无法读取版本文件: {}", e))?;
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(version) = json.get("version").and_then(|v| v.as_str()) {
                return Ok(version.to_string());
            }
        }
    }
    Ok("未知版本".to_string())
}

pub mod commands {
    use super::*;
    use crate::AppState;
    use tauri::State;

    #[tauri::command]
    pub async fn detect_steam_paths(state: State<'_, AppState>) -> Result<GamePaths, String> {
        let paths = detect_game_paths()?;
        *state.game_paths.lock().unwrap() = Some(paths.clone());
        Ok(paths)
    }

    #[tauri::command]
    pub async fn get_game_info(state: State<'_, AppState>) -> Result<GameInfo, String> {
        let paths_guard = state.game_paths.lock().unwrap();
        let info = if let Some(ref paths) = *paths_guard {
            let mod_count = if PathBuf::from(&paths.workshop_path).exists() {
                std::fs::read_dir(&paths.workshop_path)
                    .map(|r| r.count())
                    .unwrap_or(0)
            } else {
                0
            };

            // 检测 DLC 数量
            let dlc_count = count_dlcs(&paths.game_path);

            GameInfo {
                paths: Some(paths.clone()),
                installed: true,
                version: paths.version.clone(),
                dlc_count,
                mod_count,
            }
        } else {
            GameInfo {
                paths: None,
                installed: false,
                version: "未安装".to_string(),
                dlc_count: 0,
                mod_count: 0,
            }
        };
        Ok(info)
    }
}
