mod steam;
mod mod_manager;
mod save_parser;
mod conflict_resolver;
mod database;
mod game_launcher;
mod scene_manager;

use tauri::Manager;
use std::sync::Mutex;

pub struct AppState {
    pub db: Mutex<database::Database>,
    pub game_paths: Mutex<Option<steam::GamePaths>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = database::Database::new().expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(AppState {
            db: Mutex::new(db),
            game_paths: Mutex::new(None),
        })
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Ok(paths) = steam::detect_game_paths() {
                    let state = handle.state::<AppState>();
                    *state.game_paths.lock().unwrap() = Some(paths);
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Steam / 游戏路径
            steam::commands::detect_steam_paths,
            steam::commands::get_game_info,

            // Mod 管理
            mod_manager::commands::scan_mods,
            mod_manager::commands::get_mods,
            mod_manager::commands::toggle_mod,
            mod_manager::commands::create_playset,
            mod_manager::commands::delete_playset,
            mod_manager::commands::get_playsets,
            mod_manager::commands::update_playset_order,
            mod_manager::commands::get_mod_dependencies,

            // 存档管理
            save_parser::commands::scan_saves,
            save_parser::commands::get_saves,
            save_parser::commands::parse_save_detail,
            save_parser::commands::delete_save,
            save_parser::commands::export_save,

            // 冲突解决
            conflict_resolver::commands::detect_conflicts,
            conflict_resolver::commands::resolve_conflict,
            conflict_resolver::commands::get_conflict_rules,
            conflict_resolver::commands::generate_patch_mod,

            // 场景管理
            scene_manager::commands::create_scene,
            scene_manager::commands::get_scenes,
            scene_manager::commands::update_scene,
            scene_manager::commands::delete_scene,
            scene_manager::commands::auto_bind_save_to_scene,

            // 游戏启动
            game_launcher::commands::launch_game,
            game_launcher::commands::get_launch_history,
            game_launcher::commands::validate_game_files,

            // 数据库
            database::commands::get_dashboard_stats,
            database::commands::get_activity_feed,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Victoria 3 Fluent Launcher");
}
