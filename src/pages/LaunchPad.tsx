import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../stores/appStore";

export default function LaunchPad() {
  const { gameInfo, scenes, mods, launchGame, isScanning, loadScenes, detectConflicts } = useAppStore();
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [extraArgs, setExtraArgs] = useState("");
  const [launching, setLaunching] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<"success" | "error" | null>(null);

  useEffect(() => { loadScenes(); }, []);

  const enabledMods = mods.filter((m) => m.enabled);
  const conflictMods = mods.filter((m) => m.conflict_count > 0 && m.enabled);
  const allGood = conflictMods.length === 0;

  const handleLaunch = async () => {
    setLaunching(true);
    setLastMessage(null);
    try {
      const args = extraArgs.split(" ").filter((s) => s.trim().length > 0);
      const msg = await launchGame(selectedScene ?? undefined, args);
      setLastMessage(msg);
      setLastStatus("success");
    } catch (e: any) {
      setLastMessage(`启动失败: ${e}`);
      setLastStatus("error");
    }
    setLaunching(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-aurora-green/20 to-aurora-cyan/10 border border-aurora-green/10 flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl">🚀</span>
        </div>
        <h2 className="text-2xl font-display font-light text-white/90">启动游戏</h2>
        <p className="text-sm text-white/35 mt-1">
          {gameInfo?.installed ? `Victoria 3 v${gameInfo.version}` : "未检测到游戏"}
        </p>
      </div>

      {/* Scene Selection */}
      {scenes.length > 0 && (
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>
            选择场景
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setSelectedScene(null)}
              className={`card p-3.5 text-left transition-all ${!selectedScene ? "border-aurora-green/40 bg-aurora-green/5" : ""}`}>
              <p className="text-sm text-white/80">默认启动</p>
              <p className="text-xs text-white/25 mt-0.5">使用当前 Mod 和配置</p>
            </button>
            {scenes.map((scene) => (
              <button key={scene.id} onClick={() => setSelectedScene(scene.id)}
                className={`card p-3.5 text-left transition-all ${selectedScene === scene.id ? "border-aurora-green/40 bg-aurora-green/5" : ""}`}>
                <p className="text-sm text-white/80 truncate">{scene.name}</p>
                <p className="text-xs text-white/25 mt-0.5 truncate">{scene.playset_id ? "含 Mod 组合" : "纯净配置"}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pre-launch Check */}
      <div className="card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/></svg>
          启动前检查
        </h3>
        <CheckRow label="已启用 Mod" value={`${enabledMods.length} 个`} ok={true} />
        <CheckRow label="Mod 冲突" value={conflictMods.length > 0 ? `${conflictMods.length} 个待解决` : "无冲突"} ok={allGood} warn={conflictMods.length > 0} />
        <CheckRow label="游戏版本" value={gameInfo?.version || "未知"} ok={!!gameInfo?.installed} />
        <CheckRow label="游戏路径" value={gameInfo?.installed ? "已检测" : "未配置"} ok={!!gameInfo?.installed} />
      </div>

      {/* Extra Args */}
      <div>
        <label className="text-xs text-white/35 block mb-1.5">额外启动参数</label>
        <input type="text" value={extraArgs} onChange={(e) => setExtraArgs(e.target.value)}
          placeholder="如: -debug_mode -windowed -no_workshop" className="w-full font-mono text-xs" />
        <p className="text-[10px] text-white/20 mt-1">参数将传递给 victoria3.exe</p>
      </div>

      {/* Launch Button */}
      <button onClick={handleLaunch} disabled={launching || !gameInfo?.installed || isScanning}
        className="btn-primary w-full py-4 text-lg font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed">
        {launching ? (
          <><span className="animate-spin">⟳</span> 正在启动 Victoria 3...</>
        ) : (
          <><span>🚀</span> 启动 Victoria 3</>
        )}
      </button>

      {/* Result Message */}
      {lastMessage && (
        <div className={`toast ${lastStatus === "success" ? "toast-success" : "toast-error"}`}>
          <div className="flex items-center gap-2">
            <span>{lastStatus === "success" ? "✅" : "❌"}</span>
            <span>{lastMessage}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function CheckRow({ label, value, ok, warn }: { label: string; value: string; ok: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-white/45">{label}</span>
      <div className="flex items-center gap-2">
        <span className={warn ? "text-warning" : ok ? "text-aurora-green" : "text-error"}>{value}</span>
        <span className={warn ? "text-warning" : ok ? "text-aurora-green" : "text-error"}>
          {warn ? "⚠" : ok ? "✓" : "✗"}
        </span>
      </div>
    </div>
  );
}
