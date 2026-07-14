import { invoke } from "@tauri-apps/api/core";
import type {
  GameInfo,
  ModInfo,
  Playset,
  SaveInfo,
  Scene,
  ConflictInfo,
  ConflictRule,
  DashboardStats,
  LaunchResult,
  LaunchHistoryItem,
} from "../types";

// ==================== 游戏检测 ====================

export async function detectGamePaths() {
  return invoke<{ game_path: string; user_data_path: string; workshop_path: string; exe_path: string; version: string }>("detect_steam_paths");
}

export async function getGameInfo() {
  return invoke<GameInfo>("get_game_info");
}

// ==================== Mod 管理 ====================

export async function scanMods() {
  return invoke<ModInfo[]>("scan_mods");
}

export async function getMods() {
  return invoke<ModInfo[]>("get_mods");
}

export async function toggleMod(modId: string, enabled: boolean) {
  return invoke<void>("toggle_mod", { modId, enabled });
}

export async function createPlayset(name: string, description: string, modOrder: string[]) {
  return invoke<Playset>("create_playset", { name, description, modOrder });
}

export async function deletePlayset(playsetId: string) {
  return invoke<void>("delete_playset", { playsetId });
}

export async function getPlaysets() {
  return invoke<Playset[]>("get_playsets");
}

export async function updatePlaysetOrder(playsetId: string, modOrder: string[]) {
  return invoke<void>("update_playset_order", { playsetId, modOrder });
}

// ==================== 存档管理 ====================

export async function scanSaves() {
  return invoke<SaveInfo[]>("scan_saves");
}

export async function getSaves() {
  return invoke<SaveInfo[]>("get_saves");
}

export async function parseSaveDetail(filePath: string) {
  return invoke<{ info: SaveInfo; raw_fields: [string, string][] }>("parse_save_detail", { filePath });
}

export async function deleteSave(saveId: string, filePath: string) {
  return invoke<void>("delete_save", { saveId, filePath });
}

// ==================== 冲突解决 ====================

export async function detectConflicts() {
  return invoke<ConflictInfo[]>("detect_conflicts");
}

export async function resolveConflict(conflictId: string, resolution: string) {
  return invoke<void>("resolve_conflict", { conflictId, resolution });
}

export async function getConflictRules() {
  return invoke<ConflictRule[]>("get_conflict_rules");
}

export async function generatePatchMod(
  modA: string,
  modB: string,
  conflictFile: string,
  mergedContent: string
) {
  return invoke<string>("generate_patch_mod", { modA, modB, conflictFile, mergedContent });
}

// ==================== 场景管理 ====================

export async function createScene(data: {
  name: string;
  description: string;
  playsetId: string | null;
  saveId: string | null;
  configJson: string;
  launchArgs: string[];
}) {
  return invoke<Scene>("create_scene", {
    name: data.name,
    description: data.description,
    playsetId: data.playsetId,
    saveId: data.saveId,
    configJson: data.configJson,
    launchArgs: data.launchArgs,
  });
}

export async function getScenes() {
  return invoke<Scene[]>("get_scenes");
}

export async function updateScene(scene: Scene) {
  return invoke<void>("update_scene", { scene });
}

export async function deleteScene(sceneId: string) {
  return invoke<void>("delete_scene", { sceneId });
}

// ==================== 游戏启动 ====================

export async function launchGame(sceneId?: string, extraArgs: string[] = []) {
  return invoke<LaunchResult>("launch_game", { sceneId: sceneId ?? null, extraArgs });
}

export async function getLaunchHistory() {
  return invoke<LaunchHistoryItem[]>("get_launch_history");
}

export async function validateGameFiles() {
  return invoke<string>("validate_game_files");
}

// ==================== 仪表盘 ====================

export async function getDashboardStats() {
  return invoke<DashboardStats>("get_dashboard_stats");
}

export async function getActivityFeed() {
  return invoke<{ type: string; title: string; description: string; timestamp: string }[]>("get_activity_feed");
}
