// ==================== 游戏与路径 ====================

export interface GamePaths {
  game_path: string;
  user_data_path: string;
  workshop_path: string;
  exe_path: string;
  version: string;
}

export interface GameInfo {
  paths: GamePaths | null;
  installed: boolean;
  version: string;
  dlc_count: number;
  mod_count: number;
}

// ==================== Mod 相关 ====================

export type ModSource = "Steam" | "Local" | "GitHub";

export interface ModInfo {
  id: string;
  name: string;
  display_name: string;
  version: string;
  source: ModSource;
  path: string;
  enabled: boolean;
  load_order: number;
  dependencies: string[];
  thumbnail: string | null;
  description: string;
  tags: string[];
  size: number;
  last_updated: string;
  has_update: boolean;
  conflict_count: number;
  game_version: string;
  chinese_name: string | null;
  chinese_description: string | null;
  steam_id?: string | null;
  archive_path?: string | null;
  picture?: string | null;
}

export interface Playset {
  id: string;
  name: string;
  mod_order: string[];
  created_at: string;
  last_used: string | null;
  description: string;
}

// ==================== 存档相关 ====================

export type SaveHealth = "Healthy" | "Warning" | "Danger" | "Unknown";

export interface SaveInfo {
  id: string;
  file_name: string;
  file_path: string;
  game_date: string;
  country_name: string;
  country_tag: string;
  is_ironman: boolean;
  is_autosave: boolean;
  file_size: number;
  created_at: string;
  play_time: string;
  scene_id: string | null;
  health: SaveHealth;
  thumbnail: string | null;
  gdp: string | null;
  prestige: number | null;
  rank: number | null;
  population: string | null;
  notes: string | null;
}

// ==================== 场景相关 ====================

export interface Scene {
  id: string;
  name: string;
  playset_id: string | null;
  save_id: string | null;
  config_json: string;
  launch_args: string[];
  created_at: string;
  last_used: string | null;
  icon: string | null;
  description: string;
}

// ==================== 冲突相关 ====================

export type ConflictType = "Overwrite" | "SameFile" | "Dependency" | "LoadOrder" | "GameVersion";
export type ConflictSeverity = "Critical" | "Major" | "Minor" | "Info";

export interface ConflictInfo {
  id: string;
  mod_a: string;
  mod_b: string;
  file_path: string;
  conflict_type: ConflictType;
  severity: ConflictSeverity;
  description: string;
  auto_resolvable: boolean;
  suggestion: string | null;
  resolved: boolean;
}

export interface ConflictRule {
  id: string;
  pattern_a: string;
  pattern_b: string;
  action: string;
  priority: number;
  description: string;
}

// ==================== 仪表盘 ====================

export interface DashboardStats {
  total_mods: number;
  enabled_mods: number;
  total_saves: number;
  total_scenes: number;
  unresolved_conflicts: number;
  weekly_playtime_secs: number;
}

export interface ActivityFeedItem {
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

// ==================== 游戏启动 ====================

export interface LaunchResult {
  success: boolean;
  message: string;
  pid: number | null;
}

export interface LaunchHistoryItem {
  id: number;
  scene_id: string | null;
  launched_at: string;
  duration_secs: number | null;
  crash: boolean;
}
