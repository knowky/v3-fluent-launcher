use serde::Serialize;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize)]
pub struct ScreenshotInfo {
    pub name: String,
    pub file_path: String,
    pub date: String,
    pub size: u64,
}

/// 获取截图目录
fn get_screenshot_dir(user_data_path: &str) -> PathBuf {
    PathBuf::from(user_data_path).join("screenshots")
}

/// 扫描截图目录
pub fn scan_screenshots(user_data_path: &str) -> Vec<ScreenshotInfo> {
    let mut screenshots = Vec::new();
    let dir = get_screenshot_dir(user_data_path);

    if !dir.exists() {
        return screenshots;
    }

    if let Ok(entries) = std::fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                let ext = path
                    .extension()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_lowercase();
                if ["png", "jpg", "jpeg", "bmp"].contains(&ext.as_str()) {
                    if let Ok(meta) = path.metadata() {
                        let date = meta
                            .modified()
                            .ok()
                            .and_then(|t| {
                                chrono::DateTime::from_timestamp(
                                    t.duration_since(std::time::UNIX_EPOCH)
                                        .unwrap_or_default()
                                        .as_secs() as i64,
                                    0,
                                )
                            })
                            .map(|dt| dt.format("%Y-%m-%d %H:%M:%S").to_string())
                            .unwrap_or_else(|| "未知".to_string());

                        screenshots.push(ScreenshotInfo {
                            name: path.file_name().unwrap_or_default().to_string_lossy().to_string(),
                            file_path: path.to_string_lossy().to_string(),
                            date,
                            size: meta.len(),
                        });
                    }
                }
            }
        }
    }

    screenshots.sort_by(|a, b| b.date.cmp(&a.date));
    screenshots
}

/// 清理缓存目录
pub fn clean_game_cache(user_data_path: &str) -> Result<Vec<String>, String> {
    let mut cleaned = Vec::new();
    let base = PathBuf::from(user_data_path);

    // 需要清理的目录和描述
    let targets = [
        ("shadercache", "Shader 缓存"),
        ("crashes", "崩溃转储"),
        ("temp", "临时文件"),
    ];

    for (dir_name, desc) in &targets {
        let dir = base.join(dir_name);
        if dir.exists() && dir.is_dir() {
            // 删除目录中的所有文件，保留目录
            if let Ok(entries) = std::fs::read_dir(&dir) {
                let mut count = 0u64;
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_file() {
                        count += path.metadata().map(|m| m.len()).unwrap_or(0);
                        std::fs::remove_file(&path).ok();
                    } else if path.is_dir() {
                        std::fs::remove_dir_all(&path).ok();
                    }
                }
                cleaned.push(format!("{} (约 {}MB)", desc, count / 1_048_576));
            }
        }
    }

    if cleaned.is_empty() {
        cleaned.push("没有需要清理的缓存".to_string());
    }

    Ok(cleaned)
}

/// 读取游戏日志文件
pub fn read_game_log(user_data_path: &str) -> Result<String, String> {
    let log_path = PathBuf::from(user_data_path)
        .join("logs")
        .join("error.log");

    if !log_path.exists() {
        // 尝试 game.log
        let game_log = PathBuf::from(user_data_path).join("logs").join("game.log");
        if game_log.exists() {
            return std::fs::read_to_string(&game_log)
                .map_err(|e| format!("读取日志失败: {}", e));
        }
        return Err("未找到日志文件 (error.log / game.log)".to_string());
    }

    // 只读取最后 500KB 以避免过大
    let size = std::fs::metadata(&log_path)
        .map(|m| m.len())
        .unwrap_or(0);
    let content = if size > 500_000 {
        let bytes = std::fs::read(&log_path).map_err(|e| format!("读取失败: {}", e))?;
        let start = bytes.len().saturating_sub(500_000);
        // 找到最近的换行符作为起始点
        let start = bytes[..start]
            .iter()
            .rposition(|&b| b == b'\n')
            .map_or(start, |p| p + 1);
        String::from_utf8_lossy(&bytes[start..]).to_string()
    } else {
        std::fs::read_to_string(&log_path).map_err(|e| format!("读取失败: {}", e))?
    };

    Ok(content)
}

pub mod commands {
    use super::*;
    use crate::AppState;
    use tauri::State;

    #[tauri::command]
    pub async fn list_screenshots(
        state: State<'_, AppState>,
    ) -> Result<Vec<ScreenshotInfo>, String> {
        let paths = state.game_paths.lock().unwrap();
        let user_data = paths
            .as_ref()
            .map(|p| p.user_data_path.clone())
            .ok_or_else(|| "游戏路径未检测到".to_string())?;
        Ok(scan_screenshots(&user_data))
    }

    #[tauri::command]
    pub async fn clean_cache(
        state: State<'_, AppState>,
    ) -> Result<Vec<String>, String> {
        let paths = state.game_paths.lock().unwrap();
        let user_data = paths
            .as_ref()
            .map(|p| p.user_data_path.clone())
            .ok_or_else(|| "游戏路径未检测到".to_string())?;

        clean_game_cache(&user_data)
    }

    #[tauri::command]
    pub async fn read_game_log(
        state: State<'_, AppState>,
    ) -> Result<String, String> {
        let paths = state.game_paths.lock().unwrap();
        let user_data = paths
            .as_ref()
            .map(|p| p.user_data_path.clone())
            .ok_or_else(|| "游戏路径未检测到".to_string())?;

        super::read_game_log(&user_data)
    }
}
