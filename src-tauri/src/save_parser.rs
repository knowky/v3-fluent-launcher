use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use flate2::read::ZlibDecoder;
use std::io::Read;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveInfo {
    pub id: String,
    pub file_name: String,
    pub file_path: String,
    pub game_date: String,
    pub country_name: String,
    pub country_tag: String,
    pub is_ironman: bool,
    pub is_autosave: bool,
    pub file_size: u64,
    pub created_at: String,
    pub play_time: String,
    pub scene_id: Option<String>,
    pub health: SaveHealth,
    pub thumbnail: Option<String>,
    pub gdp: Option<String>,
    pub prestige: Option<i32>,
    pub rank: Option<i32>,
    pub population: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SaveHealth {
    Healthy,
    Warning,
    Danger,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveDetail {
    pub info: SaveInfo,
    pub raw_fields: Vec<(String, String)>,
}

/// 扫描存档目录
pub fn scan_save_directory(user_data_path: &str) -> Vec<SaveInfo> {
    let mut saves = Vec::new();
    let save_path = PathBuf::from(user_data_path).join("save games");

    if !save_path.exists() {
        return saves;
    }

    if let Ok(entries) = std::fs::read_dir(&save_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            let file_name = path.file_name().unwrap_or_default().to_string_lossy();

            // Victoria 3 存档是 .v3 格式
            if path.extension().map_or(false, |e| e == "v3") {
                if let Ok(metadata) = path.metadata() {
                    let mut save_info = SaveInfo {
                        id: sha2::Sha256::digest(
                            format!("{}_{}", file_name, metadata.len()).as_bytes(),
                        )
                        .iter()
                        .map(|b| format!("{:02x}", b))
                        .collect::<String>()[..16]
                            .to_string(),
                        file_name: file_name.to_string(),
                        file_path: path.to_string_lossy().to_string(),
                        game_date: String::new(),
                        country_name: String::new(),
                        country_tag: String::new(),
                        is_ironman: file_name.contains("ironman"),
                        is_autosave: file_name.contains("autosave"),
                        file_size: metadata.len(),
                        created_at: format_system_time(metadata.created().ok()),
                        play_time: String::new(),
                        scene_id: None,
                        health: SaveHealth::Unknown,
                        thumbnail: None,
                        gdp: None,
                        prestige: None,
                        rank: None,
                        population: None,
                        notes: None,
                    };

                    // 尝试快速解析存档元数据
                    if let Ok(detail) = quick_parse_save(&path) {
                        save_info.game_date = detail.game_date;
                        save_info.country_name = detail.country_name;
                        save_info.country_tag = detail.country_tag;
                    }

                    saves.push(save_info);
                }
            }
        }
    }

    // 按日期排序（最新的在前）
    saves.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    saves
}

fn format_system_time(time: Option<std::time::SystemTime>) -> String {
    time.map(|t| {
        let datetime: chrono::DateTime<chrono::Utc> = t.into();
        datetime.format("%Y-%m-%d %H:%M:%S").to_string()
    })
    .unwrap_or_else(|| "未知".to_string())
}

struct QuickSaveInfo {
    game_date: String,
    country_name: String,
    country_tag: String,
}

/// 快速解析存档（仅提取元数据，不解压完整文件）
fn quick_parse_save(file_path: &PathBuf) -> Result<QuickSaveInfo, String> {
    let mut file = std::fs::File::open(file_path).map_err(|e| e.to_string())?;

    // Victoria 3 存档格式：二进制头 + zlib 压缩数据
    let mut header = [0u8; 4];
    file.read_exact(&mut header).map_err(|e| e.to_string())?;

    // 检查是否是压缩格式（通常以 "V3" 或压缩魔数开头）
    let mut data = Vec::new();
    file.read_to_end(&mut data).map_err(|e| e.to_string())?;

    let decompressed = if header[0] == 0x78 {
        // zlib 压缩
        let mut decoder = ZlibDecoder::new(&data[..]);
        let mut out = String::new();
        decoder.read_to_string(&mut out).map_err(|e| e.to_string())?;
        out
    } else {
        // 尝试直接作为文本读取
        String::from_utf8(data).unwrap_or_default()
    };

    let mut info = QuickSaveInfo {
        game_date: "未知日期".to_string(),
        country_name: "未知国家".to_string(),
        country_tag: "---".to_string(),
    };

    // 从存档文本中提取关键信息
    for line in decompressed.lines() {
        let line = line.trim();
        if line.starts_with("date=") {
            info.game_date = line
                .strip_prefix("date=")
                .unwrap_or("")
                .trim()
                .to_string();
        } else if line.starts_with("player=") {
            info.country_tag = line
                .strip_prefix("player=")
                .unwrap_or("")
                .trim()
                .to_string();
        }
    }

    Ok(info)
}

/// 完整解析存档
pub fn full_parse_save(file_path: &str) -> Result<SaveDetail, String> {
    let path = PathBuf::from(file_path);
    let quick = quick_parse_save(&path)?;

    let mut fields = Vec::new();
    fields.push(("游戏日期".to_string(), quick.game_date.clone()));
    fields.push(("国家标识".to_string(), quick.country_tag.clone()));
    fields.push(("国家名称".to_string(), quick.country_name.clone()));

    let info = SaveInfo {
        id: String::new(),
        file_name: path.file_name().unwrap_or_default().to_string_lossy().to_string(),
        file_path: file_path.to_string(),
        game_date: quick.game_date,
        country_name: quick.country_name,
        country_tag: quick.country_tag,
        is_ironman: false,
        is_autosave: false,
        file_size: path.metadata().map(|m| m.len()).unwrap_or(0),
        created_at: String::new(),
        play_time: String::new(),
        scene_id: None,
        health: SaveHealth::Unknown,
        thumbnail: None,
        gdp: None,
        prestige: None,
        rank: None,
        population: None,
        notes: None,
    };

    Ok(SaveDetail {
        info,
        raw_fields: fields,
    })
}

pub mod commands {
    use super::*;
    use crate::AppState;
    use tauri::State;

    #[tauri::command]
    pub async fn scan_saves(state: State<'_, AppState>) -> Result<Vec<SaveInfo>, String> {
        let paths_guard = state.game_paths.lock().unwrap();
        let mut saves = Vec::new();

        if let Some(ref paths) = *paths_guard {
            saves = scan_save_directory(&paths.user_data_path);

            // 保存到数据库
            let db = state.db.lock().unwrap();
            for s in &saves {
                db.upsert_save(s).ok();
            }
        }

        Ok(saves)
    }

    #[tauri::command]
    pub async fn get_saves(state: State<'_, AppState>) -> Result<Vec<SaveInfo>, String> {
        let db = state.db.lock().unwrap();
        db.get_all_saves().map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn parse_save_detail(
        file_path: String,
    ) -> Result<SaveDetail, String> {
        full_parse_save(&file_path)
    }

    #[tauri::command]
    pub async fn delete_save(
        state: State<'_, AppState>,
        save_id: String,
        file_path: String,
    ) -> Result<(), String> {
        std::fs::remove_file(&file_path).map_err(|e| format!("删除失败: {}", e))?;
        let db = state.db.lock().unwrap();
        db.delete_save(&save_id).map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn export_save(
        file_path: String,
        export_path: String,
    ) -> Result<(), String> {
        std::fs::copy(&file_path, &export_path)
            .map_err(|e| format!("导出失败: {}", e))?;
        Ok(())
    }
}
