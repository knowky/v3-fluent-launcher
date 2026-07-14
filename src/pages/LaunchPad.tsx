import { useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../stores/appStore";

export default function LaunchPad() {
  const { gameInfo, scenes, mods, launchGame, isScanning } = useAppStore();
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [extraArgs, setExtraArgs] = useState("");
  const [launching, setLaunching] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const enabledMods = mods.filter((m) => m.enabled);
  const conflictMods = mods.filter((m) => m.conflict_count > 0 && m.enabled);

  const handleLaunch = async () => {
    setLaunching(true);
    setLastMessage(null);
    try {
      const args = extraArgs
        .split(" ")
        .filter((s) => s.trim().length > 0);
      const msg = await launchGame(selectedScene ?? undefined, args);
      setLastMessage(msg);
    } catch (e: any) {
      setLastMessage(`启动失败: ${e}`);
    }
    setLaunching(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="page-enter space-y-6 max-w-2xl mx-auto"
    >
      <div className="text-center">
        <h2 className="text-2xl font-display font-light text-white/90">启动游戏</h2>
        <p className="text-sm text-white/40 mt-1">
          {gameInfo?.installed
            ? `Victoria 3 v${gameInfo.version}`
            : "未检测到游戏"}
        </p>
      </div>

      {/* 场景选择 */}
      {scenes.length > 0 && (
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white/80">选择场景</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedScene(null)}
              className={`card p-3 text-left ${
                !selectedScene ? "border-v3-gold/50" : ""
              }`}
            >
              <p className="text-sm text-white/80">默认启动</p>
              <p className="text-xs text-white/30">使用当前 Mod 和配置</p>
            </button>
            {scenes.map((scene) => (
              <button
                key={scene.id}
                onClick={() => setSelectedScene(scene.id)}
                className={`card p-3 text-left ${
                  selectedScene === scene.id ? "border-v3-gold/50" : ""
                }`}
              >
                <p className="text-sm text-white/80">{scene.name}</p>
                <p className="text-xs text-white/30 truncate">
                  {scene.playset_id ? "含 Mod 组合" : "纯净配置"}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mod 状态摘要 */}
      <div className="card p-4 space-y-2">
        <h3 className="text-sm font-semibold text-white/80">启动前检查</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/50">已启用 Mod</span>
          <span className={`${enabledMods.length > 0 ? "text-white/80" : "text-white/30"}`}>
            {enabledMods.length} 个
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/50">Mod 冲突</span>
          <span className={conflictMods.length > 0 ? "text-error" : "text-green-400"}>
            {conflictMods.length > 0 ? `${conflictMods.length} 个待解决` : "✅ 无冲突"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/50">游戏版本</span>
          <span className="text-white/80">{gameInfo?.version || "未知"}</span>
        </div>
      </div>

      {/* 额外参数 */}
      <div>
        <label className="text-xs text-white/40 block mb-1">额外启动参数</label>
        <input
          type="text"
          value={extraArgs}
          onChange={(e) => setExtraArgs(e.target.value)}
          placeholder="如: -debug_mode -windowed"
          className="w-full"
        />
      </div>

      {/* 启动按钮 */}
      <button
        onClick={handleLaunch}
        disabled={launching || !gameInfo?.installed || isScanning}
        className="btn-primary w-full py-4 text-lg font-semibold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {launching ? (
          <>
            <span className="animate-spin">⏳</span>
            正在启动...
          </>
        ) : (
          <>
            <span>🚀</span>
            启动 Victoria 3
          </>
        )}
      </button>

      {lastMessage && (
        <div
          className={`card p-3 text-sm text-center ${
            lastMessage.includes("失败")
              ? "bg-error/10 border-error/30 text-error"
              : "bg-green-500/10 border-green-500/30 text-green-400"
          }`}
        >
          {lastMessage}
        </div>
      )}
    </motion.div>
  );
}
