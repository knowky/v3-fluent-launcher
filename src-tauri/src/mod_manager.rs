use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::collections::HashMap;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModInfo {
    pub id: String,
    pub name: String,
    pub display_name: String,
    pub version: String,
    pub source: ModSource,
    pub path: String,
    pub enabled: bool,
    pub load_order: i32,
    pub dependencies: Vec<String>,
    pub thumbnail: Option<String>,
    pub description: String,
    pub tags: Vec<String>,
    pub size: u64,
    pub last_updated: String,
    pub has_update: bool,
    pub conflict_count: i32,
    pub game_version: String,
    pub chinese_name: Option<String>,
    pub chinese_description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ModSource {
    Steam,
    Local,
    GitHub,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Playset {
    pub id: String,
    pub name: String,
    pub mod_order: Vec<String>,
    pub created_at: String,
    pub last_used: Option<String>,
    pub description: String,
}

/// 扫描 Steam Workshop Mod 目录
fn scan_workshop_mods(workshop_path: &str) -> Vec<ModInfo> {
    let mut mods = Vec::new();
    let path = PathBuf::from(workshop_path);

    if !path.exists() {
        return mods;
    }

    for entry in std::fs::read_dir(&path).unwrap_or_else(|_| std::fs::read_dir(".").unwrap()) {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };

        let mod_path = entry.path();
        if !mod_path.is_dir() {
            continue;
        }

        let descriptor_path = mod_path.join("descriptor.mod");
        if !descriptor_path.exists() {
            continue;
        }

        if let Ok(mod_info) = parse_mod_descriptor(&descriptor_path, &mod_path, ModSource::Steam) {
            mods.push(mod_info);
        }
    }

    mods
}

/// 扫描本地 Mod 目录
fn scan_local_mods(user_data_path: &str) -> Vec<ModInfo> {
    let mut mods = Vec::new();
    let mod_path = PathBuf::from(user_data_path).join("mod");

    if !mod_path.exists() {
        return mods;
    }

    for entry in std::fs::read_dir(&mod_path).unwrap_or_else(|_| std::fs::read_dir(".").unwrap()) {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };

        let file_path = entry.path();

        // 本地 Mod 的 .mod 文件
        if file_path.extension().map_or(false, |e| e == "mod") {
            if let Ok(content) = std::fs::read_to_string(&file_path) {
                if let Ok(mod_info) = parse_mod_content(&content, &file_path, ModSource::Local) {
                    mods.push(mod_info);
                }
            }
        }
    }

    mods
}

/// 解析 .mod 描述符文件
fn parse_mod_descriptor(
    descriptor_path: &PathBuf,
    mod_path: &PathBuf,
    source: ModSource,
) -> Result<ModInfo, String> {
    let content =
        std::fs::read_to_string(descriptor_path).map_err(|e| format!("读取失败: {}", e))?;
    parse_mod_content(&content, mod_path, source)
}

fn parse_mod_content(
    content: &str,
    mod_path: &PathBuf,
    source: ModSource,
) -> Result<ModInfo, String> {
    let mut name = String::new();
    let mut version = "1.0".to_string();
    let mut dependencies = Vec::new();
    let mut tags = Vec::new();
    let mut game_version = String::new();

    for line in content.lines() {
        let line = line.trim();
        if let Some(value) = extract_value(line, "name") {
            name = value;
        } else if let Some(value) = extract_value(line, "version") {
            version = value;
        } else if let Some(value) = extract_value(line, "dependencies") {
            dependencies = value
                .trim_matches('{')
                .trim_matches('}')
                .split(' ')
                .filter(|s| !s.is_empty())
                .map(|s| s.trim_matches('"').to_string())
                .collect();
        } else if let Some(value) = extract_value(line, "tags") {
            tags = value
                .trim_matches('{')
                .trim_matches('}')
                .split(' ')
                .filter(|s| !s.is_empty())
                .map(|s| s.trim_matches('"').to_string())
                .collect();
        } else if let Some(value) = extract_value(line, "supported_version") {
            game_version = value;
        }
    }

    let id = mod_path
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    // 计算 Mod 大小
    let size = calculate_dir_size(mod_path);

    Ok(ModInfo {
        id: id.clone(),
        name: name.clone(),
        display_name: name,
        version,
        source,
        path: mod_path.to_string_lossy().to_string(),
        enabled: false,
        load_order: 0,
        dependencies,
        thumbnail: find_thumbnail(mod_path),
        description: String::new(),
        tags,
        size,
        last_updated: String::new(),
        has_update: false,
        conflict_count: 0,
        game_version,
        chinese_name: None,
        chinese_description: None,
    })
}

fn extract_value(line: &str, key: &str) -> Option<String> {
    let pattern = format!("{}", key);
    if line.contains(&format!("{}=", pattern)) || line.contains(&format!("{} =", pattern)) {
        let parts: Vec<&str> = line.splitn(2, '=').collect();
        if parts.len() == 2 {
            let value = parts[1].trim().trim_matches('"').to_string();
            if !value.is_empty() {
                return Some(value);
            }
        }
    }
    None
}

fn find_thumbnail(mod_path: &PathBuf) -> Option<String> {
    for ext in &["png", "jpg", "jpeg"] {
        let thumb = mod_path.join(format!("thumbnail.{}", ext));
        if thumb.exists() {
            return Some(thumb.to_string_lossy().to_string());
        }
    }
    None
}

fn calculate_dir_size(path: &PathBuf) -> u64 {
    WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .map(|e| e.metadata().map(|m| m.len()).unwrap_or(0))
        .sum()
}

pub mod commands {
    use super::*;
    use crate::AppState;
    use tauri::State;

    #[tauri::command]
    pub async fn scan_mods(state: State<'_, AppState>) -> Result<Vec<ModInfo>, String> {
        let paths_guard = state.game_paths.lock().unwrap();
        let mut all_mods = Vec::new();

        if let Some(ref paths) = *paths_guard {
            // 扫描 Steam Workshop
            let workshop_mods = scan_workshop_mods(&paths.workshop_path);
            // 扫描本地 Mod
            let local_mods = scan_local_mods(&paths.user_data_path);

            all_mods.extend(workshop_mods);
            all_mods.extend(local_mods);

            // 保存到数据库
            let db = state.db.lock().unwrap();
            for m in &all_mods {
                db.upsert_mod(m).ok();
            }
        }

        Ok(all_mods)
    }

    #[tauri::command]
    pub async fn get_mods(state: State<'_, AppState>) -> Result<Vec<ModInfo>, String> {
        let db = state.db.lock().unwrap();
        db.get_all_mods().map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn toggle_mod(
        state: State<'_, AppState>,
        mod_id: String,
        enabled: bool,
    ) -> Result<(), String> {
        let db = state.db.lock().unwrap();
        db.set_mod_enabled(&mod_id, enabled)
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn create_playset(
        state: State<'_, AppState>,
        name: String,
        description: String,
        mod_order: Vec<String>,
    ) -> Result<Playset, String> {
        let db = state.db.lock().unwrap();
        let playset = Playset {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            mod_order,
            created_at: chrono::Utc::now().to_rfc3339(),
            last_used: None,
            description,
        };
        db.create_playset(&playset).map_err(|e| e.to_string())?;
        Ok(playset)
    }

    #[tauri::command]
    pub async fn delete_playset(
        state: State<'_, AppState>,
        playset_id: String,
    ) -> Result<(), String> {
        let db = state.db.lock().unwrap();
        db.delete_playset(&playset_id).map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn get_playsets(state: State<'_, AppState>) -> Result<Vec<Playset>, String> {
        let db = state.db.lock().unwrap();
        db.get_all_playsets().map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn update_playset_order(
        state: State<'_, AppState>,
        playset_id: String,
        mod_order: Vec<String>,
    ) -> Result<(), String> {
        let db = state.db.lock().unwrap();
        db.update_playset_order(&playset_id, &mod_order)
            .map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn get_mod_dependencies(
        state: State<'_, AppState>,
        mod_id: String,
    ) -> Result<Vec<ModInfo>, String> {
        let db = state.db.lock().unwrap();
        db.get_mod_dependencies(&mod_id)
            .map_err(|e| e.to_string())
    }
}
