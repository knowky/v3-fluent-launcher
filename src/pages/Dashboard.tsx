import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../stores/appStore";
import { useNavigate } from "react-router-dom";
import type { Scene, DashboardStats, ActivityFeedItem } from "../types";

export default function Dashboard() {
  const {
    gameInfo,
    scenes,
    stats,
    mods,
    saves,
    loadStats,
    loadScenes,
    scanMods,
    scanSaves,
    isScanning,
  } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
    loadScenes();
  }, []);

  const enabledMods = mods.filter((m) => m.enabled).length;
  const conflictMods = mods.filter((m) => m.conflict_count > 0).length;

  const statCards = [
    { label: "已安装 Mod", value: stats?.total_mods || mods.length, icon: "📦", color: "from-blue-500/20 to-blue-600/10" },
    { label: "已启用 Mod", value: stats?.enabled_mods || enabledMods, icon: "✅", color: "from-green-500/20 to-green-600/10" },
    { label: "存档数量", value: stats?.total_saves || saves.length, icon: "💾", color: "from-yellow-500/20 to-yellow-600/10" },
    { label: "游戏场景", value: stats?.total_scenes || scenes.length, icon: "🎮", color: "from-purple-500/20 to-purple-600/10" },
    { label: "待解决冲突", value: stats?.unresolved_conflicts || conflictMods, icon: "⚠️", color: "from-red-500/20 to-red-600/10" },
    { label: "本周时长", value: formatTime(stats?.weekly_playtime_secs || 0), icon: "⏱️", color: "from-cyan-500/20 to-cyan-600/10" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 page-enter"
    >
      {/* 欢迎横幅 */}
      <div className="card p-6 bg-gradient-to-r from-v3-navy/40 to-v3-gold/10 border border-v3-gold/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-light text-white/95">
              {gameInfo?.installed
                ? "准备征服 19 世纪？"
                : "欢迎使用 Victoria 3 Fluent Launcher"}
            </h2>
            <p className="text-white/50 mt-1 text-sm">
              {gameInfo?.installed
                ? `Victoria 3 v${gameInfo.version} · ${gameInfo.mod_count} 个 Mod 可用`
                : "请先配置游戏路径以开始使用"}
            </p>
          </div>
          {gameInfo?.installed && (
            <button
              onClick={() => navigate("/launch")}
              className="btn-primary flex items-center gap-2 text-base px-6 py-3"
            >
              <span>🚀</span>
              <span>启动游戏</span>
            </button>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`card p-4 bg-gradient-to-br ${card.color}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-xs">{card.label}</span>
              <span className="text-lg">{card.icon}</span>
            </div>
            <div className="text-2xl font-semibold text-white mt-2">
              {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 场景快速启动 + 快速操作 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 场景卡片 */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white/80">游戏场景</h3>
            <button
              onClick={() => navigate("/config")}
              className="text-xs text-v3-gold hover:text-v3-gold/80 transition-colors"
            >
              + 新建场景
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {scenes.length === 0 ? (
              <div className="card p-8 text-center text-white/30 flex-shrink-0 w-full">
                <div className="text-3xl mb-2">🎮</div>
                <p className="text-sm">还没有游戏场景</p>
                <p className="text-xs mt-1">
                  创建场景将存档、Mod 和配置绑定在一起，一键切换
                </p>
              </div>
            ) : (
              scenes.map((scene) => (
                <SceneCard key={scene.id} scene={scene} />
              ))
            )}
            <div
              className="card p-4 flex-shrink-0 w-44 flex flex-col items-center justify-center cursor-pointer hover:border-v3-gold/30"
              onClick={() => navigate("/config")}
            >
              <span className="text-2xl text-white/20">+</span>
              <span className="text-xs text-white/30 mt-1">新建场景</span>
            </div>
          </div>
        </div>

        {/* 快速操作 */}
        <div>
          <h3 className="text-sm font-semibold text-white/80 mb-3">快速操作</h3>
          <div className="space-y-2">
            <QuickAction
              icon="🔍"
              label="扫描 Mod"
              desc={`${mods.length} 个 Mod 已索引`}
              onClick={scanMods}
              loading={isScanning}
            />
            <QuickAction
              icon="📂"
              label="扫描存档"
              desc={`${saves.length} 个存档`}
              onClick={scanSaves}
            />
            <QuickAction
              icon="🔧"
              label="验证文件"
              desc="检查游戏文件完整性"
              onClick={() => navigate("/tools")}
            />
            <QuickAction
              icon="⚠️"
              label="冲突检测"
              desc={`${conflictMods} 个 Mod 存在冲突`}
              onClick={() => navigate("/conflicts")}
              highlight={conflictMods > 0}
            />
          </div>
        </div>
      </div>

      {/* 最近活动 */}
      <div>
        <h3 className="text-sm font-semibold text-white/80 mb-3">最近活动</h3>
        <div className="card p-4 space-y-2">
          {saves.slice(0, 5).map((save, i) => (
            <div
              key={save.id}
              className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"
            >
              <span className="text-lg">{save.country_tag === "---" ? "🌍" : "🏴"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">
                  {save.country_name || save.file_name}
                </p>
                <p className="text-xs text-white/30">{save.game_date}</p>
              </div>
              <span
                className={`status-badge ${
                  save.health === "Healthy"
                    ? "status-enabled"
                    : save.health === "Warning"
                    ? "status-warning"
                    : "status-disabled"
                }`}
              >
                {save.health === "Healthy" ? "健康" : save.health === "Warning" ? "注意" : "未知"}
              </span>
            </div>
          ))}
          {saves.length === 0 && (
            <p className="text-center text-white/20 py-6 text-sm">暂无存档，启动游戏后将自动显示</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SceneCard({ scene }: { scene: Scene }) {
  const { saves } = useAppStore();
  const navigate = useNavigate();

  const boundSave = saves.find((s) => s.id === scene.save_id);
  const config = (() => {
    try {
      return JSON.parse(scene.config_json || "{}");
    } catch {
      return {};
    }
  })();

  return (
    <div
      className="card p-4 flex-shrink-0 w-44 cursor-pointer hover:border-v3-gold/30 transition-all"
      onClick={() => navigate("/launch")}
    >
      <div className="w-full h-20 rounded-md bg-gradient-to-br from-v3-navy/60 to-v3-gold/30 flex items-center justify-center mb-2">
        <span className="text-2xl opacity-50">🏴</span>
      </div>
      <p className="text-sm font-medium text-white/90 truncate">{scene.name}</p>
      <p className="text-xs text-white/30 mt-0.5 truncate">
        {boundSave?.country_name || config.preset || "未绑定存档"}
      </p>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-white/20 bg-white/5 px-1.5 py-0.5 rounded">
          {scene.playset_id ? "含Mod" : "纯净"}
        </span>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  desc,
  onClick,
  loading,
  highlight,
}: {
  icon: string;
  label: string;
  desc: string;
  onClick?: () => void;
  loading?: boolean;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full card p-3 flex items-center gap-3 text-left transition-all hover:bg-white/5 ${
        highlight ? "border-error/20" : ""
      }`}
      disabled={loading}
    >
      <span className="text-lg">{loading ? "⏳" : icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/80">{label}</p>
        <p className="text-xs text-white/30 truncate">{desc}</p>
      </div>
      <span className="text-white/20">›</span>
    </button>
  );
}

function formatTime(seconds: number): string {
  if (seconds === 0) return "0h";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}
