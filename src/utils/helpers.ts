import type { ModInfo, SaveInfo, ConflictInfo } from "../types";

/** 格式化文件大小 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
}

/** 格式化时间 */
export function formatTime(seconds: number): string {
  if (seconds === 0) return "0 小时";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${mins} 分钟`;
  return `${hours} 小时 ${mins} 分钟`;
}

/** 格式化日期 */
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

/** 检测冲突严重程度颜色 */
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "Critical":
      return "bg-red-500";
    case "Major":
      return "bg-orange-500";
    case "Minor":
      return "bg-yellow-500";
    default:
      return "bg-blue-500";
  }
}

/** 检测存档健康状态颜色 */
export function getHealthColor(health: string): string {
  switch (health) {
    case "Healthy":
      return "text-green-400";
    case "Warning":
      return "text-yellow-400";
    case "Danger":
      return "text-red-400";
    default:
      return "text-white/30";
  }
}

/** 获取 Mod 来源图标 */
export function getSourceIcon(source: string): string {
  switch (source) {
    case "Steam":
      return "🔷";
    case "Local":
      return "📁";
    case "GitHub":
      return "🐙";
    default:
      return "📦";
  }
}

/** Mod 冲突摘要 */
export function getModConflictSummary(mods: ModInfo[]): string {
  const total = mods.reduce((sum, m) => sum + m.conflict_count, 0);
  if (total === 0) return "✅ 无冲突";
  return `⚠️ ${total} 个冲突`;
}

/** 存档统计 */
export function getSaveStats(saves: SaveInfo[]) {
  return {
    total: saves.length,
    ironman: saves.filter((s) => s.is_ironman).length,
    autosave: saves.filter((s) => s.is_autosave).length,
    healthy: saves.filter((s) => s.health === "Healthy").length,
    warning: saves.filter((s) => s.health === "Warning").length,
    danger: saves.filter((s) => s.health === "Danger").length,
  };
}

/** 冲突统计 */
export function getConflictStats(conflicts: ConflictInfo[]) {
  return {
    total: conflicts.length,
    unresolved: conflicts.filter((c) => !c.resolved).length,
    critical: conflicts.filter((c) => c.severity === "Critical").length,
    major: conflicts.filter((c) => c.severity === "Major").length,
    autoResolvable: conflicts.filter((c) => c.auto_resolvable).length,
  };
}

/** 截断文本 */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

/** 解析场景配置 JSON */
export function parseSceneConfig(configJson: string): Record<string, any> {
  try {
    return JSON.parse(configJson || "{}");
  } catch {
    return {};
  }
}

/** 构建启动参数字符串 */
export function buildLaunchArgs(args: string[]): string {
  return args.filter((a) => a.trim().length > 0).join(" ");
}

/** 检测是否为维多利亚3存档文件 */
export function isVictoria3Save(filename: string): boolean {
  return filename.endsWith(".v3");
}

/** 从存档文件名提取信息 */
export function parseSaveFileName(filename: string) {
  const name = filename.replace(".v3", "");
  const isIronman = name.toLowerCase().includes("ironman");
  const isAutosave = name.toLowerCase().includes("autosave") || name.startsWith("autosave");
  return { name, isIronman, isAutosave };
}
