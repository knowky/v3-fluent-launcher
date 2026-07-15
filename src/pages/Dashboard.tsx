import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../stores/appStore";
import { useNavigate } from "react-router-dom";
import type { Scene } from "../types";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemAnim = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export default function Dashboard() {
  const {
    gameInfo, scenes, stats, mods, saves, conflicts, activityFeed,
    loadStats, loadScenes, scanMods, scanSaves, detectConflicts, loadActivityFeed,
    isScanning, launchGame,
  } = useAppStore();
  const navigate = useNavigate();
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    loadStats();
    loadScenes();
    loadActivityFeed();
  }, []);

  const enabledMods = mods.filter((m) => m.enabled).length;
  const conflictCount = conflicts.filter((c) => !c.resolved).length;
  const healthySaves = saves.filter((s) => s.health === "Healthy").length;

  const handleQuickLaunch = useCallback(async () => {
    setLaunching(true);
    try {
      await launchGame();
    } catch {}
    setLaunching(false);
  }, [launchGame]);

  const statCards = [
    { label: "Mod 库", value: stats?.total_mods || mods.length, sub: `${enabledMods} 已启用`, icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="1.5"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="1.5"/></svg>
    ), gradient: "from-emerald-500/10 to-cyan-500/5", accent: "text-aurora-green" },
    { label: "存档库", value: stats?.total_saves || saves.length, sub: `${healthySaves} 健康`, icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5"/></svg>
    ), gradient: "from-blue-500/10 to-indigo-500/5", accent: "text-aurora-blue" },
    { label: "场景", value: stats?.total_scenes || scenes.length, sub: "一键切换", icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>
    ), gradient: "from-purple-500/10 to-pink-500/5", accent: "text-aurora-purple" },
    { label: "冲突", value: conflictCount, sub: conflicts.length > 0 ? `${conflicts.filter(c => c.severity === "Critical").length} 严重` : "无冲突", icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5"/><path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    ), gradient: "from-red-500/10 to-orange-500/5", accent: conflictCount > 0 ? "text-error" : "text-aurora-green" },
    { label: "本周时长", value: formatTime(stats?.weekly_playtime_secs || 0), sub: "游戏时间", icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    ), gradient: "from-cyan-500/10 to-teal-500/5", accent: "text-aurora-cyan" },
    { label: "游戏版本", value: gameInfo?.version || "—", sub: gameInfo?.installed ? "已就绪" : "未安装", icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.5"/></svg>
    ), gradient: "from-amber-500/10 to-yellow-500/5", accent: "text-warning" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Hero Banner */}
      <motion.div variants={itemAnim} className="relative overflow-hidden rounded-xl border border-aurora-green/10 bg-gradient-to-r from-base-800 via-base-800 to-aurora-green/5 p-6">
        <div className="absolute inset-0 bg-aurora-gradient bg-aurora opacity-5 animate-aurora-shift" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-light text-white/95 flex items-center gap-2">
              <span className="aurora-glow-text">Victoria 3</span>
              <span className="text-white/30 font-thin">|</span>
              <span>Fluent Launcher</span>
            </h2>
            <p className="text-white/40 mt-1.5 text-sm">
              {gameInfo?.installed
                ? `v${gameInfo.version} · ${mods.length} Mod · ${saves.length} 存档`
                : "请在设置向导中配置游戏路径"}
            </p>
          </div>
          {gameInfo?.installed && (
            <button
              onClick={handleQuickLaunch}
              disabled={launching}
              className="btn-primary text-base px-8 py-3 rounded-xl font-semibold"
            >
              {launching ? (
                <><span className="animate-spin">⟳</span> 启动中...</>
              ) : (
                <><span>🚀</span> 启动游戏</>
              )}
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemAnim} className="grid grid-cols-3 gap-3">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            variants={itemAnim}
            className={`card p-4 bg-gradient-to-br ${card.gradient} group`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/40 text-xs font-medium">{card.label}</span>
              <span className={card.accent}>{card.icon}</span>
            </div>
            <div className={`text-2xl font-semibold text-white group-hover:${card.accent} transition-colors`}>
              {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
            </div>
            <div className="text-xs text-white/25 mt-1">{card.sub}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Bottom Grid: Scenes + Quick Actions */}
      <div className="grid grid-cols-3 gap-6">
        {/* Scenes */}
        <motion.div variants={itemAnim} className="col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>
              游戏场景
            </h3>
            <button onClick={() => navigate("/config")} className="btn-ghost text-xs">
              + 新建场景
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {scenes.length === 0 ? (
              <div className="card p-8 text-center flex-shrink-0 w-full">
                <div className="text-3xl mb-2 opacity-40">🎮</div>
                <p className="text-sm text-white/30">还没有游戏场景</p>
                <p className="text-xs text-white/20 mt-1">创建场景将存档、Mod 和配置绑定在一起</p>
              </div>
            ) : (
              scenes.map((scene) => <SceneCard key={scene.id} scene={scene} />)
            )}
            <div
              className="card p-4 flex-shrink-0 w-44 flex flex-col items-center justify-center cursor-pointer hover:border-aurora-green/30 transition-all"
              onClick={() => navigate("/config")}
            >
              <span className="text-2xl text-white/15">+</span>
              <span className="text-xs text-white/25 mt-1">新建场景</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemAnim}>
          <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke="currentColor" strokeWidth="1.5"/></svg>
            快速操作
          </h3>
          <div className="space-y-2">
            <QuickAction icon="📦" label="扫描 Mod" desc={`${mods.length} 个已索引`} onClick={scanMods} loading={isScanning} />
            <QuickAction icon="💾" label="扫描存档" desc={`${saves.length} 个存档`} onClick={scanSaves} />
            <QuickAction icon="⚠️" label="冲突检测" desc={conflictCount > 0 ? `${conflictCount} 个待解决` : "全部正常"} onClick={() => navigate("/conflicts")} highlight={conflictCount > 0} />
            <QuickAction icon="🔧" label="验证游戏" desc="检查文件完整性" onClick={() => navigate("/tools")} />
            <QuickAction icon="⚙️" label="配置中心" desc="图形/启动参数" onClick={() => navigate("/config")} />
          </div>
        </motion.div>
      </div>

      {/* Recent Saves */}
      <motion.div variants={itemAnim}>
        <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          最近存档
        </h3>
        <div className="card p-4 space-y-1">
          {saves.slice(0, 5).map((save) => (
            <div key={save.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] px-2 rounded-md -mx-2 transition-colors cursor-pointer"
              onClick={() => navigate("/saves")}>
              <div className={`w-2 h-2 rounded-full ${
                save.health === "Healthy" ? "bg-aurora-green" : save.health === "Warning" ? "bg-warning" : "bg-error"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/75 truncate">{save.country_name || save.file_name.replace(".v3", "")}</p>
                <p className="text-xs text-white/25">{save.game_date} · {save.country_tag}</p>
              </div>
              <div className="flex items-center gap-2">
                {save.is_ironman && <span className="status-badge status-warning text-[10px]">铁人</span>}
                <span className={`status-badge ${
                  save.health === "Healthy" ? "status-enabled" : save.health === "Warning" ? "status-warning" : "status-conflict"
                }`}>
                  {save.health === "Healthy" ? "健康" : save.health === "Warning" ? "注意" : "危险"}
                </span>
              </div>
            </div>
          ))}
          {saves.length === 0 && (
            <p className="text-center text-white/15 py-8 text-sm">暂无存档，启动游戏后将自动显示</p>
          )}
        </div>
      </motion.div>

      {/* Activity Feed */}
      <motion.div variants={itemAnim}>
        <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.5"/></svg>
          活动提要
        </h3>
        <div className="card p-4 space-y-1">
          {activityFeed.length === 0 ? (
            <p className="text-center text-white/15 py-6 text-sm">暂无活动记录</p>
          ) : (
            activityFeed.slice(0, 10).map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0">
                <span className="text-sm flex-shrink-0 mt-0.5">
                  {item.type === "scan" ? "🔍" : item.type === "launch" ? "🚀" :
                   item.type === "backup" ? "💾" : item.type === "restore" ? "📥" :
                   item.type === "delete" ? "🗑️" : "📌"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/75 truncate">{item.title}</p>
                  <p className="text-xs text-white/25">{item.description}</p>
                </div>
                <span className="text-[10px] text-white/20 flex-shrink-0">{formatActivityTime(item.timestamp)}</span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SceneCard({ scene }: { scene: Scene }) {
  const { saves } = useAppStore();
  const navigate = useNavigate();
  const boundSave = saves.find((s) => s.id === scene.save_id);

  return (
    <div
      className="card p-4 flex-shrink-0 w-44 cursor-pointer hover:border-aurora-green/30 transition-all group"
      onClick={() => navigate("/launch")}
    >
      <div className="w-full h-20 rounded-lg bg-gradient-to-br from-aurora-green/10 via-aurora-blue/5 to-aurora-purple/10 flex items-center justify-center mb-2.5 group-hover:from-aurora-green/15 group-hover:to-aurora-purple/15 transition-all">
        <span className="text-2xl opacity-40">{scene.icon || "🏴"}</span>
      </div>
      <p className="text-sm font-medium text-white/85 truncate">{scene.name}</p>
      <p className="text-xs text-white/30 mt-0.5 truncate">{boundSave?.country_name || "未绑定存档"}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${scene.playset_id ? "bg-aurora-green/10 text-aurora-green" : "bg-white/5 text-white/30"}`}>
          {scene.playset_id ? "含Mod" : "纯净"}
        </span>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, desc, onClick, loading, highlight }: {
  icon: string; label: string; desc: string; onClick?: () => void; loading?: boolean; highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full card p-3 flex items-center gap-3 text-left transition-all hover:bg-white/[0.04] ${
        highlight ? "border-error/20" : ""
      }`}
      disabled={loading}
    >
      <span className="text-lg">{loading ? "⏳" : icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/75">{label}</p>
        <p className="text-xs text-white/25 truncate">{desc}</p>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white/15">
        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

function formatTime(seconds: number): string {
  if (!seconds || seconds === 0) return "0h";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function formatActivityTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "刚刚";
    if (diffMin < 60) return `${diffMin}分钟前`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}小时前`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}天前`;
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}
