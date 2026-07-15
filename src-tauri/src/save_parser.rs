use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use flate2::read::ZlibDecoder;
use std::io::Read;
use sha2::{Sha256, Digest};

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

            if path.extension().map_or(false, |e| e == "v3") {
                if let Ok(metadata) = path.metadata() {
                    // 快速解析
                    let quick = quick_parse_save(&path).ok();

                    // 评估健康度
                    let health = if let Some(ref q) = quick {
                        evaluate_health(q)
                    } else {
                        SaveHealth::Unknown
                    };

                    let mut save_info = SaveInfo {
                        id: generate_save_id(&file_name, metadata.len()),
                        file_name: file_name.to_string(),
                        file_path: path.to_string_lossy().to_string(),
                        game_date: quick.as_ref().map(|q| q.game_date.clone()).unwrap_or_default(),
                        country_name: quick.as_ref().map(|q| resolve_country_name(&q.country_tag)).unwrap_or_else(|| "未知国家".to_string()),
                        country_tag: quick.as_ref().map(|q| q.country_tag.clone()).unwrap_or_else(|| "---".to_string()),
                        is_ironman: file_name.to_lowercase().contains("ironman"),
                        is_autosave: file_name.to_lowercase().contains("autosave") || file_name.to_lowercase().contains("auto"),
                        file_size: metadata.len(),
                        created_at: format_system_time(metadata.created().ok()),
                        play_time: String::new(),
                        scene_id: None,
                        health,
                        thumbnail: None,
                        gdp: quick.as_ref().and_then(|q| q.gdp.clone()),
                        prestige: quick.as_ref().and_then(|q| q.prestige),
                        rank: quick.as_ref().and_then(|q| q.rank),
                        population: quick.as_ref().and_then(|q| q.population.clone()),
                        notes: None,
                    };

                    saves.push(save_info);
                }
            }
        }
    }

    saves.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    saves
}

fn generate_save_id(file_name: &str, size: u64) -> String {
    let hash = Sha256::digest(format!("{}_{}", file_name, size).as_bytes());
    hash.iter()
        .take(8)
        .map(|b| format!("{:02x}", b))
        .collect()
}

fn format_system_time(time: Option<std::time::SystemTime>) -> String {
    time.map(|t| {
        let datetime: chrono::DateTime<chrono::Utc> = t.into();
        datetime.format("%Y-%m-%d %H:%M:%S").to_string()
    })
    .unwrap_or_else(|| "未知".to_string())
}

#[derive(Debug, Clone)]
struct QuickSaveInfo {
    game_date: String,
    country_tag: String,
    gdp: Option<String>,
    prestige: Option<i32>,
    rank: Option<i32>,
    population: Option<String>,
    play_time: Option<String>,
}

/// 快速解析存档（提取元数据）
fn quick_parse_save(file_path: &PathBuf) -> Result<QuickSaveInfo, String> {
    let mut file = std::fs::File::open(file_path).map_err(|e| e.to_string())?;
    let mut all_data = Vec::new();
    file.read_to_end(&mut all_data).map_err(|e| e.to_string())?;

    // Victoria 3 存档格式：可能是 zlib 压缩或纯文本
    let decompressed = if !all_data.is_empty() && all_data[0] == 0x78 {
        // zlib 压缩 -> 跳过 4 字节头
        let mut decoder = ZlibDecoder::new(&all_data[4..]);
        let mut out = String::new();
        decoder.read_to_string(&mut out).map_err(|_| "zlib 解压失败".to_string())?;
        out
    } else if !all_data.is_empty() {
        // 可能是 zip 压缩或纯文本
        String::from_utf8(all_data).unwrap_or_default()
    } else {
        return Err("存档文件为空".to_string());
    };

    let mut info = QuickSaveInfo {
        game_date: "未知日期".to_string(),
        country_tag: "---".to_string(),
        gdp: None,
        prestige: None,
        rank: None,
        population: None,
        play_time: None,
    };

    for line in decompressed.lines() {
        let line = line.trim();

        if line.starts_with("date=") {
            info.game_date = line.strip_prefix("date=").unwrap_or("").trim().to_string();
        } else if line.starts_with("player=") {
            info.country_tag = line.strip_prefix("player=").unwrap_or("").trim().to_string();
        } else if line.starts_with("ironman=") {
            // 检测 Ironman 额外信息
        } else if line.starts_with("game_speed=") {
            // 游戏速度信息
        }
    }

    // 评估健康度
    evaluate_save_data(&decompressed, &mut info);

    Ok(info)
}

fn evaluate_save_data(data: &str, info: &mut QuickSaveInfo) {
    // 在存档数据中搜索经济/国力相关数据
    for line in data.lines() {
        let line = line.trim();

        // GDP
        if line.starts_with("gdp=") {
            let val = line.strip_prefix("gdp=").unwrap_or("").trim();
            if let Ok(n) = val.parse::<f64>() {
                let gdp_str = if n >= 1_000_000_000.0 {
                    format!("{:.1}B", n / 1_000_000_000.0)
                } else if n >= 1_000_000.0 {
                    format!("{:.1}M", n / 1_000_000.0)
                } else {
                    format!("{:.0}", n)
                };
                info.gdp = Some(gdp_str);
            }
        }

        // Prestige
        if line.starts_with("prestige=") {
            if let Ok(n) = line.strip_prefix("prestige=").unwrap_or("").trim().parse::<f64>() {
                info.prestige = Some(n as i32);
            }
        }

        // Rank
        if line.starts_with("rank=") {
            if let Ok(n) = line.strip_prefix("rank=").unwrap_or("").trim().parse::<i32>() {
                info.rank = Some(n);
            }
        }

        // Population
        if line.starts_with("population=") {
            let val = line.strip_prefix("population=").unwrap_or("").trim();
            if let Ok(n) = val.parse::<f64>() {
                let pop_str = if n >= 1_000_000.0 {
                    format!("{:.1}M", n / 1_000_000.0)
                } else {
                    format!("{:.0}", n)
                };
                info.population = Some(pop_str);
            }
        }
    }
}

fn evaluate_health(quick: &QuickSaveInfo) -> SaveHealth {
    let mut score = 100;

    // 检查 GDP - 太低表示经济问题
    if quick.gdp.is_none() {
        score -= 10;
    }

    // 检查 Prestige - 负数表示外交困境
    if let Some(p) = quick.prestige {
        if p < 0 {
            score -= 30;
        } else if p < 50 {
            score -= 10;
        }
    } else {
        score -= 10;
    }

    // 检查 Rank - 大国排行靠前视为健康
    if let Some(r) = quick.rank {
        if r > 50 {
            score -= 20;
        } else if r <= 8 {
            score += 5;
        }
    }

    // 检查游戏日期 - 早期游戏默认健康状况好
    if quick.game_date.contains("1836") || quick.game_date.contains("184") {
        score = 100.min(score + 10);
    }

    if score >= 80 {
        SaveHealth::Healthy
    } else if score >= 50 {
        SaveHealth::Warning
    } else if score >= 0 {
        SaveHealth::Danger
    } else {
        SaveHealth::Unknown
    }
}

/// 国家 TAG -> 名称映射表
fn resolve_country_name(tag: &str) -> String {
    match tag.to_uppercase().as_str() {
        // 列强
        "GBR" | "ENG" => "大不列颠".to_string(),
        "FRA" => "法兰西".to_string(),
        "RUS" => "俄罗斯".to_string(),
        "PRU" => "普鲁士".to_string(),
        "AUS" => "奥地利".to_string(),
        "USA" | "AME" => "美利坚合众国".to_string(),
        "TUR" | "OTT" => "奥斯曼帝国".to_string(),
        "SPA" => "西班牙".to_string(),
        "SWE" => "瑞典".to_string(),
        "NED" | "HOL" => "尼德兰".to_string(),
        "BEL" => "比利时".to_string(),
        "POR" => "葡萄牙".to_string(),
        "SAR" | "PIE" => "撒丁-皮埃蒙特".to_string(),
        "TUS" => "托斯卡纳".to_string(),
        "PAP" => "教皇国".to_string(),
        "SIC" | "NAP" | "TWO" => "两西西里".to_string(),

        // 德意志诸邦
        "BAV" => "巴伐利亚".to_string(),
        "HAN" => "汉诺威".to_string(),
        "SAX" => "萨克森".to_string(),
        "WUR" => "符腾堡".to_string(),
        "BAD" => "巴登".to_string(),
        "HES" => "黑森".to_string(),
        "GER" => "德意志".to_string(),
        "NGF" => "北德意志邦联".to_string(),

        // 亚洲
        "CHI" | "QNG" => "大清".to_string(),
        "JAP" | "NIP" => "日本".to_string(),
        "KOR" => "朝鲜".to_string(),
        "PER" | "IRN" => "波斯".to_string(),
        "SIK" => "锡克帝国".to_string(),
        "AFG" => "阿富汗".to_string(),
        "BUR" => "缅甸".to_string(),
        "SIA" | "THA" => "暹罗".to_string(),
        "VIE" | "DAI" => "大南".to_string(),
        "MUG" | "BHU" | "BHO" | "BHT" => "印度诸邦".to_string(),

        // 美洲
        "BRA" => "巴西".to_string(),
        "MEX" => "墨西哥".to_string(),
        "ARG" | "PLT" => "阿根廷".to_string(),
        "CAN" => "加拿大".to_string(),
        "COL" => "哥伦比亚".to_string(),
        "PER" | "PEU" => "秘鲁".to_string(),

        // 其他
        "GRE" => "希腊".to_string(),
        "SER" => "塞尔维亚".to_string(),
        "ROM" | "WAL" => "罗马尼亚".to_string(),
        "SWI" => "瑞士".to_string(),
        "DEN" => "丹麦".to_string(),
        "NOR" => "挪威".to_string(),
        "FIN" => "芬兰".to_string(),
        "BUL" => "保加利亚".to_string(),
        "EGY" => "埃及".to_string(),
        "ETH" => "埃塞俄比亚".to_string(),
        "SOU" | "SAF" => "南非".to_string(),
        "AUS" | "AST" => "澳大利亚".to_string(),
        "NZL" | "NEW" => "新西兰".to_string(),

        _ => {
            if !tag.is_empty() && tag != "---" {
                format!("国家({})", tag)
            } else {
                "未知国家".to_string()
            }
        }
    }
}

/// 完整解析存档
pub fn full_parse_save(file_path: &str) -> Result<SaveDetail, String> {
    let path = PathBuf::from(file_path);
    let quick = quick_parse_save(&path)?;
    let health = evaluate_health(&quick);

    let mut fields = Vec::new();
    fields.push(("游戏日期".to_string(), quick.game_date.clone()));
    fields.push(("国家标识".to_string(), quick.country_tag.clone()));
    fields.push(("国家名称".to_string(), resolve_country_name(&quick.country_tag)));

    if let Some(ref gdp) = quick.gdp {
        fields.push(("GDP".to_string(), gdp.clone()));
    }
    if let Some(prestige) = quick.prestige {
        fields.push(("威望".to_string(), prestige.to_string()));
    }
    if let Some(rank) = quick.rank {
        fields.push(("国际排名".to_string(), rank.to_string()));
    }
    if let Some(ref pop) = quick.population {
        fields.push(("人口".to_string(), pop.clone()));
    }
    fields.push(("健康度".to_string(), format!("{:?}", health)));

    let info = SaveInfo {
        id: String::new(),
        file_name: path.file_name().unwrap_or_default().to_string_lossy().to_string(),
        file_path: file_path.to_string(),
        game_date: quick.game_date,
        country_name: resolve_country_name(&quick.country_tag),
        country_tag: quick.country_tag,
        is_ironman: path.file_name().unwrap_or_default().to_string_lossy().contains("ironman"),
        is_autosave: false,
        file_size: path.metadata().map(|m| m.len()).unwrap_or(0),
        created_at: String::new(),
        play_time: quick.play_time.unwrap_or_default(),
        scene_id: None,
        health,
        thumbnail: None,
        gdp: quick.gdp,
        prestige: quick.prestige,
        rank: quick.rank,
        population: quick.population,
        notes: None,
    };

    Ok(SaveDetail { info, raw_fields: fields })
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

            let db = state.db.lock().unwrap();
            for s in &saves {
                db.upsert_save(s).ok();
            }
            db.add_activity("scan", "存档扫描", &format!("发现 {} 个存档", saves.len())).ok();
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
        db.delete_save(&save_id).map_err(|e| e.to_string())?;
        db.add_activity("delete", "存档删除", &format!("已删除存档")).ok();
        Ok(())
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
