use rusqlite::{Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

pub struct Database {
    pub conn: Connection,
}

impl Database {
    pub fn new() -> SqlResult<Self> {
        let db_path = get_db_path();
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).ok();
        }

        let conn = Connection::open(&db_path)?;
        let db = Self { conn };
        db.initialize_tables()?;
        Ok(db)
    }

    fn initialize_tables(&self) -> SqlResult<()> {
        self.conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS mods (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                display_name TEXT,
                version TEXT,
                source TEXT,
                path TEXT,
                enabled INTEGER DEFAULT 0,
                load_order INTEGER DEFAULT 0,
                dependencies TEXT,
                thumbnail TEXT,
                description TEXT,
                tags TEXT,
                size INTEGER DEFAULT 0,
                last_updated TEXT,
                has_update INTEGER DEFAULT 0,
                conflict_count INTEGER DEFAULT 0,
                game_version TEXT,
                chinese_name TEXT,
                chinese_description TEXT,
                steam_id TEXT,
                archive_path TEXT,
                picture TEXT
            );

            CREATE TABLE IF NOT EXISTS playsets (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                mod_order TEXT,
                created_at TEXT,
                last_used TEXT,
                description TEXT DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS saves (
                id TEXT PRIMARY KEY,
                file_name TEXT,
                file_path TEXT,
                game_date TEXT,
                country_name TEXT,
                country_tag TEXT,
                is_ironman INTEGER DEFAULT 0,
                is_autosave INTEGER DEFAULT 0,
                file_size INTEGER DEFAULT 0,
                created_at TEXT,
                play_time TEXT,
                scene_id TEXT,
                health TEXT DEFAULT 'Unknown',
                thumbnail TEXT,
                gdp TEXT,
                prestige INTEGER,
                rank INTEGER,
                population TEXT,
                notes TEXT
            );

            CREATE TABLE IF NOT EXISTS scenes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                playset_id TEXT,
                save_id TEXT,
                config_json TEXT,
                launch_args TEXT,
                created_at TEXT,
                last_used TEXT,
                icon TEXT,
                description TEXT DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS conflicts (
                id TEXT PRIMARY KEY,
                mod_a TEXT,
                mod_b TEXT,
                file_path TEXT,
                conflict_type TEXT,
                severity TEXT,
                description TEXT,
                auto_resolvable INTEGER DEFAULT 0,
                suggestion TEXT,
                resolved INTEGER DEFAULT 0,
                resolution TEXT
            );

            CREATE TABLE IF NOT EXISTS conflict_rules (
                id TEXT PRIMARY KEY,
                pattern_a TEXT,
                pattern_b TEXT,
                action TEXT,
                priority INTEGER DEFAULT 0,
                description TEXT
            );

            CREATE TABLE IF NOT EXISTS launch_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                scene_id TEXT,
                launched_at TEXT,
                duration_secs INTEGER,
                crash INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            );

            CREATE TABLE IF NOT EXISTS activity_feed (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT,
                title TEXT,
                description TEXT,
                timestamp TEXT,
                read INTEGER DEFAULT 0
            );
            ",
        )?;

        Ok(())
    }

    // ========== Mod 操作 ==========

    pub fn upsert_mod(&self, mod_info: &super::mod_manager::ModInfo) -> SqlResult<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO mods (id, name, display_name, version, source, path, enabled,
             load_order, dependencies, thumbnail, description, tags, size, last_updated,
             has_update, conflict_count, game_version, chinese_name, chinese_description,
             steam_id, archive_path, picture)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22)",
            rusqlite::params![
                mod_info.id,
                mod_info.name,
                mod_info.display_name,
                mod_info.version,
                format!("{:?}", mod_info.source),
                mod_info.path,
                mod_info.enabled as i32,
                mod_info.load_order,
                mod_info.dependencies.join(","),
                mod_info.thumbnail,
                mod_info.description,
                mod_info.tags.join(","),
                mod_info.size as i64,
                mod_info.last_updated,
                mod_info.has_update as i32,
                mod_info.conflict_count,
                mod_info.game_version,
                mod_info.chinese_name,
                mod_info.chinese_description,
                mod_info.steam_id,
                mod_info.archive_path,
                mod_info.picture,
            ],
        )?;
        Ok(())
    }

    pub fn get_all_mods(&self) -> SqlResult<Vec<super::mod_manager::ModInfo>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, display_name, version, source, path, enabled, load_order,
             dependencies, thumbnail, description, tags, size, last_updated, has_update,
             conflict_count, game_version, chinese_name, chinese_description,
             steam_id, archive_path, picture FROM mods",
        )?;

        let mods = stmt
            .query_map([], |row| {
                let deps_str: String = row.get(8)?;
                let tags_str: String = row.get(11)?;
                let source_str: String = row.get(4)?;
                let source = match source_str.as_str() {
                    "Local" => super::mod_manager::ModSource::Local,
                    "GitHub" => super::mod_manager::ModSource::GitHub,
                    _ => super::mod_manager::ModSource::Steam,
                };

                Ok(super::mod_manager::ModInfo {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    display_name: row.get(2)?,
                    version: row.get(3)?,
                    source,
                    path: row.get(5)?,
                    enabled: row.get::<_, i32>(6)? != 0,
                    load_order: row.get(7)?,
                    dependencies: deps_str.split(',').filter(|s| !s.is_empty()).map(String::from).collect(),
                    thumbnail: row.get(9)?,
                    description: row.get(10)?,
                    tags: tags_str.split(',').filter(|s| !s.is_empty()).map(String::from).collect(),
                    size: row.get::<_, i64>(12)? as u64,
                    last_updated: row.get(13)?,
                    has_update: row.get::<_, i32>(14)? != 0,
                    conflict_count: row.get(15)?,
                    game_version: row.get(16)?,
                    chinese_name: row.get(17)?,
                    chinese_description: row.get(18)?,
                    steam_id: row.get(19)?,
                    archive_path: row.get(20)?,
                    picture: row.get(21)?,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(mods)
    }

    pub fn set_mod_enabled(&self, mod_id: &str, enabled: bool) -> SqlResult<()> {
        self.conn.execute(
            "UPDATE mods SET enabled = ?1 WHERE id = ?2",
            rusqlite::params![enabled as i32, mod_id],
        )?;
        Ok(())
    }

    pub fn get_mod_dependencies(
        &self,
        mod_id: &str,
    ) -> SqlResult<Vec<super::mod_manager::ModInfo>> {
        let mut stmt = self
            .conn
            .prepare("SELECT dependencies FROM mods WHERE id = ?1")?;
        let deps: String = stmt.query_row([mod_id], |row| row.get(0))?;
        let dep_names: Vec<&str> = deps.split(',').filter(|s| !s.is_empty()).collect();

        let mut result = Vec::new();
        for name in dep_names {
            let mut stmt = self.conn.prepare(
                "SELECT id, name, display_name, version, source, path, enabled, steam_id, archive_path, picture FROM mods WHERE name = ?1",
            )?;
            if let Ok(row) = stmt.query_row([name], |row| {
                let s: String = row.get(4)?;
                Ok(super::mod_manager::ModInfo {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    display_name: row.get(2)?,
                    version: row.get(3)?,
                    source: match s.as_str() { "Local"=>super::mod_manager::ModSource::Local, "GitHub"=>super::mod_manager::ModSource::GitHub, _=>super::mod_manager::ModSource::Steam },
                    path: row.get(5)?,
                    enabled: row.get::<_, i32>(6)? != 0,
                    load_order: 0,
                    dependencies: vec![],
                    thumbnail: None,
                    description: String::new(),
                    tags: vec![],
                    size: 0,
                    last_updated: String::new(),
                    has_update: false,
                    conflict_count: 0,
                    game_version: String::new(),
                    chinese_name: None,
                    chinese_description: None,
                    steam_id: row.get(7)?,
                    archive_path: row.get(8)?,
                    picture: row.get(9)?,
                })
            }) {
                result.push(row);
            }
        }
        Ok(result)
    }

    /// 根据 load_order 更新 mod 顺序
    pub fn batch_update_mod_order(&self, mod_order: &[(String, i32)]) -> SqlResult<()> {
        for (id, order) in mod_order {
            self.conn.execute(
                "UPDATE mods SET load_order = ?1 WHERE id = ?2",
                rusqlite::params![order, id],
            )?;
        }
        Ok(())
    }

    // ========== Playset 操作 ==========

    pub fn create_playset(&self, playset: &super::mod_manager::Playset) -> SqlResult<()> {
        self.conn.execute(
            "INSERT INTO playsets (id, name, mod_order, created_at, last_used, description)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![
                playset.id,
                playset.name,
                playset.mod_order.join(","),
                playset.created_at,
                playset.last_used,
                playset.description,
            ],
        )?;
        Ok(())
    }

    pub fn delete_playset(&self, playset_id: &str) -> SqlResult<()> {
        self.conn
            .execute("DELETE FROM playsets WHERE id = ?1", [playset_id])?;
        Ok(())
    }

    pub fn get_all_playsets(&self) -> SqlResult<Vec<super::mod_manager::Playset>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, mod_order, created_at, last_used, description FROM playsets",
        )?;

        let playsets = stmt
            .query_map([], |row| {
                let order: String = row.get(2)?;
                Ok(super::mod_manager::Playset {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    mod_order: order
                        .split(',')
                        .filter(|s| !s.is_empty())
                        .map(String::from)
                        .collect(),
                    created_at: row.get(3)?,
                    last_used: row.get(4)?,
                    description: row.get(5)?,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(playsets)
    }

    pub fn update_playset_order(
        &self,
        playset_id: &str,
        mod_order: &[String],
    ) -> SqlResult<()> {
        self.conn.execute(
            "UPDATE playsets SET mod_order = ?1, last_used = ?2 WHERE id = ?3",
            rusqlite::params![mod_order.join(","), chrono::Utc::now().to_rfc3339(), playset_id],
        )?;
        Ok(())
    }

    // ========== 存档操作 ==========

    pub fn upsert_save(&self, save: &super::save_parser::SaveInfo) -> SqlResult<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO saves (id, file_name, file_path, game_date, country_name,
             country_tag, is_ironman, is_autosave, file_size, created_at, play_time, scene_id,
             health, thumbnail, gdp, prestige, rank, population, notes)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)",
            rusqlite::params![
                save.id,
                save.file_name,
                save.file_path,
                save.game_date,
                save.country_name,
                save.country_tag,
                save.is_ironman as i32,
                save.is_autosave as i32,
                save.file_size as i64,
                save.created_at,
                save.play_time,
                save.scene_id,
                format!("{:?}", save.health),
                save.thumbnail,
                save.gdp,
                save.prestige,
                save.rank,
                save.population,
                save.notes,
            ],
        )?;
        Ok(())
    }

    pub fn get_all_saves(&self) -> SqlResult<Vec<super::save_parser::SaveInfo>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, file_name, file_path, game_date, country_name, country_tag,
             is_ironman, is_autosave, file_size, created_at, play_time, scene_id, health,
             thumbnail, gdp, prestige, rank, population, notes FROM saves ORDER BY created_at DESC",
        )?;

        let saves = stmt
            .query_map([], |row| {
                let health_str: String = row.get(12)?;
                let health = match health_str.as_str() {
                    "Healthy" => super::save_parser::SaveHealth::Healthy,
                    "Warning" => super::save_parser::SaveHealth::Warning,
                    "Danger" => super::save_parser::SaveHealth::Danger,
                    _ => super::save_parser::SaveHealth::Unknown,
                };

                Ok(super::save_parser::SaveInfo {
                    id: row.get(0)?,
                    file_name: row.get(1)?,
                    file_path: row.get(2)?,
                    game_date: row.get(3)?,
                    country_name: row.get(4)?,
                    country_tag: row.get(5)?,
                    is_ironman: row.get::<_, i32>(6)? != 0,
                    is_autosave: row.get::<_, i32>(7)? != 0,
                    file_size: row.get::<_, i64>(8)? as u64,
                    created_at: row.get(9)?,
                    play_time: row.get(10)?,
                    scene_id: row.get(11)?,
                    health,
                    thumbnail: row.get(13)?,
                    gdp: row.get(14)?,
                    prestige: row.get(15)?,
                    rank: row.get(16)?,
                    population: row.get(17)?,
                    notes: row.get(18)?,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(saves)
    }

    pub fn delete_save(&self, save_id: &str) -> SqlResult<()> {
        self.conn
            .execute("DELETE FROM saves WHERE id = ?1", [save_id])?;
        Ok(())
    }

    // ========== 场景操作 ==========

    pub fn create_scene(
        &self,
        scene: &super::scene_manager::Scene,
    ) -> SqlResult<()> {
        self.conn.execute(
            "INSERT INTO scenes (id, name, playset_id, save_id, config_json, launch_args,
             created_at, last_used, icon, description)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            rusqlite::params![
                scene.id,
                scene.name,
                scene.playset_id,
                scene.save_id,
                scene.config_json,
                scene.launch_args.join(" "),
                scene.created_at,
                scene.last_used,
                scene.icon,
                scene.description,
            ],
        )?;
        Ok(())
    }

    pub fn get_all_scenes(&self) -> SqlResult<Vec<super::scene_manager::Scene>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, playset_id, save_id, config_json, launch_args, created_at,
             last_used, icon, description FROM scenes ORDER BY last_used DESC",
        )?;

        let scenes = stmt
            .query_map([], |row| {
                let args: String = row.get(5)?;
                Ok(super::scene_manager::Scene {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    playset_id: row.get(2)?,
                    save_id: row.get(3)?,
                    config_json: row.get(4)?,
                    launch_args: args
                        .split(' ')
                        .filter(|s| !s.is_empty())
                        .map(String::from)
                        .collect(),
                    created_at: row.get(6)?,
                    last_used: row.get(7)?,
                    icon: row.get(8)?,
                    description: row.get(9)?,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(scenes)
    }

    pub fn update_scene(&self, scene: &super::scene_manager::Scene) -> SqlResult<()> {
        self.conn.execute(
            "UPDATE scenes SET name=?1, playset_id=?2, save_id=?3, config_json=?4,
             launch_args=?5, last_used=?6, icon=?7, description=?8 WHERE id=?9",
            rusqlite::params![
                scene.name,
                scene.playset_id,
                scene.save_id,
                scene.config_json,
                scene.launch_args.join(" "),
                chrono::Utc::now().to_rfc3339(),
                scene.icon,
                scene.description,
                scene.id,
            ],
        )?;
        Ok(())
    }

    pub fn delete_scene(&self, scene_id: &str) -> SqlResult<()> {
        self.conn
            .execute("DELETE FROM scenes WHERE id = ?1", [scene_id])?;
        Ok(())
    }

    // ========== 冲突操作 ==========

    pub fn insert_conflicts(&self, conflicts: &[super::conflict_resolver::ConflictInfo]) -> SqlResult<()> {
        for c in conflicts {
            self.conn.execute(
                "INSERT OR REPLACE INTO conflicts (id, mod_a, mod_b, file_path, conflict_type,
                 severity, description, auto_resolvable, suggestion, resolved)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 0)",
                rusqlite::params![
                    c.id,
                    c.mod_a,
                    c.mod_b,
                    c.file_path,
                    format!("{:?}", c.conflict_type),
                    format!("{:?}", c.severity),
                    c.description,
                    c.auto_resolvable as i32,
                    c.suggestion,
                ],
            )?;
        }
        Ok(())
    }

    pub fn get_all_conflicts(&self) -> SqlResult<Vec<super::conflict_resolver::ConflictInfo>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, mod_a, mod_b, file_path, conflict_type, severity,
             description, auto_resolvable, suggestion, resolved
             FROM conflicts WHERE resolved = 0",
        )?;

        let conflicts = stmt
            .query_map([], |row| {
                Ok(super::conflict_resolver::ConflictInfo {
                    id: row.get(0)?,
                    mod_a: row.get(1)?,
                    mod_b: row.get(2)?,
                    file_path: row.get(3)?,
                    conflict_type: match row.get::<_, String>(4)?.as_str() {
                        "SameFile" => super::conflict_resolver::ConflictType::SameFile,
                        "Dependency" => super::conflict_resolver::ConflictType::Dependency,
                        "LoadOrder" => super::conflict_resolver::ConflictType::LoadOrder,
                        "GameVersion" => super::conflict_resolver::ConflictType::GameVersion,
                        _ => super::conflict_resolver::ConflictType::Overwrite,
                    },
                    severity: match row.get::<_, String>(5)?.as_str() {
                        "Critical" => super::conflict_resolver::ConflictSeverity::Critical,
                        "Major" => super::conflict_resolver::ConflictSeverity::Major,
                        "Minor" => super::conflict_resolver::ConflictSeverity::Minor,
                        _ => super::conflict_resolver::ConflictSeverity::Info,
                    },
                    description: row.get(6)?,
                    auto_resolvable: row.get::<_, i32>(7)? != 0,
                    suggestion: row.get(8)?,
                    resolved: row.get::<_, i32>(9)? != 0,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(conflicts)
    }

    pub fn mark_conflict_resolved(
        &self,
        conflict_id: &str,
        resolution: &str,
    ) -> SqlResult<()> {
        self.conn.execute(
            "UPDATE conflicts SET resolved = 1, resolution = ?1 WHERE id = ?2",
            rusqlite::params![resolution, conflict_id],
        )?;
        Ok(())
    }

    // ========== 设置操作 ==========

    pub fn get_setting(&self, key: &str) -> SqlResult<Option<String>> {
        let mut stmt = self
            .conn
            .prepare("SELECT value FROM settings WHERE key = ?1")?;
        let result = stmt.query_row([key], |row| row.get(0));
        match result {
            Ok(val) => Ok(Some(val)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn set_setting(&self, key: &str, value: &str) -> SqlResult<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            rusqlite::params![key, value],
        )?;
        Ok(())
    }

    pub fn get_all_settings(&self) -> SqlResult<Vec<(String, String)>> {
        let mut stmt = self.conn.prepare("SELECT key, value FROM settings")?;
        let settings = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
            .filter_map(|r| r.ok())
            .collect();
        Ok(settings)
    }

    // ========== 活动记录 ==========

    pub fn add_activity(&self, event_type: &str, title: &str, description: &str) -> SqlResult<()> {
        self.conn.execute(
            "INSERT INTO activity_feed (event_type, title, description, timestamp, read) VALUES (?1, ?2, ?3, ?4, 0)",
            rusqlite::params![event_type, title, description, chrono::Utc::now().to_rfc3339()],
        )?;
        Ok(())
    }

    // ========== 统计 ==========

    pub fn get_dashboard_stats(&self) -> SqlResult<DashboardStats> {
        let mod_count: i32 = self
            .conn
            .query_row("SELECT COUNT(*) FROM mods", [], |row| row.get(0))?;
        let enabled_mods: i32 = self
            .conn
            .query_row("SELECT COUNT(*) FROM mods WHERE enabled = 1", [], |row| {
                row.get(0)
            })?;
        let save_count: i32 = self
            .conn
            .query_row("SELECT COUNT(*) FROM saves", [], |row| row.get(0))?;
        let scene_count: i32 = self
            .conn
            .query_row("SELECT COUNT(*) FROM scenes", [], |row| row.get(0))?;
        let conflict_count: i32 = self.conn.query_row(
            "SELECT COUNT(*) FROM conflicts WHERE resolved = 0",
            [],
            |row| row.get(0),
        )?;

        // 本周游戏时长
        let week_ago = chrono::Utc::now() - chrono::Duration::days(7);
        let weekly_playtime: i32 = self.conn.query_row(
            "SELECT COALESCE(SUM(duration_secs), 0) FROM launch_history WHERE launched_at > ?1",
            [week_ago.to_rfc3339()],
            |row| row.get(0),
        )?;

        Ok(DashboardStats {
            total_mods: mod_count,
            enabled_mods,
            total_saves: save_count,
            total_scenes: scene_count,
            unresolved_conflicts: conflict_count,
            weekly_playtime_secs: weekly_playtime,
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardStats {
    pub total_mods: i32,
    pub enabled_mods: i32,
    pub total_saves: i32,
    pub total_scenes: i32,
    pub unresolved_conflicts: i32,
    pub weekly_playtime_secs: i32,
}

fn get_db_path() -> PathBuf {
    let app_data = dirs::data_local_dir().unwrap_or_default();
    app_data.join("v3-fluent-launcher").join("v3fl.db")
}

pub mod commands {
    use super::*;
    use crate::AppState;
    use tauri::State;

    #[tauri::command]
    pub async fn get_dashboard_stats(state: State<'_, AppState>) -> Result<DashboardStats, String> {
        let db = state.db.lock().unwrap();
        db.get_dashboard_stats().map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn get_activity_feed(
        state: State<'_, AppState>,
    ) -> Result<Vec<serde_json::Value>, String> {
        let db = state.db.lock().unwrap();
        let mut stmt = db
            .conn
            .prepare("SELECT event_type, title, description, timestamp FROM activity_feed ORDER BY timestamp DESC LIMIT 20")
            .map_err(|e| e.to_string())?;

        let feed = stmt
            .query_map([], |row| {
                Ok(serde_json::json!({
                    "type": row.get::<_, String>(0)?,
                    "title": row.get::<_, String>(1)?,
                    "description": row.get::<_, String>(2)?,
                    "timestamp": row.get::<_, String>(3)?,
                }))
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        Ok(feed)
    }

    #[tauri::command]
    pub async fn get_app_settings(state: State<'_, AppState>) -> Result<Vec<(String, String)>, String> {
        let db = state.db.lock().unwrap();
        db.get_all_settings().map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn save_app_setting(
        state: State<'_, AppState>,
        key: String,
        value: String,
    ) -> Result<(), String> {
        let db = state.db.lock().unwrap();
        db.set_setting(&key, &value).map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn get_app_setting(
        state: State<'_, AppState>,
        key: String,
    ) -> Result<Option<String>, String> {
        let db = state.db.lock().unwrap();
        db.get_setting(&key).map_err(|e| e.to_string())
    }
}
