import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../stores/appStore";
import type { ConflictInfo, ConflictRule } from "../types";

export default function ConflictCenter() {
  const { conflicts, detectConflicts, mods } = useAppStore();
  const [selectedConflict, setSelectedConflict] = useState<ConflictInfo | null>(null);
  const [filter, setFilter] = useState("all");
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => { detectConflicts(); }, []);

  const severityColors: Record<string, string> = {
    Critical: "bg-error", Major: "bg-orange-500", Minor: "bg-warning", Info: "bg-aurora-blue",
  };

  const filteredConflicts = conflicts.filter((c) => {
    if (filter === "all") return true;
    if (filter === "unresolved") return !c.resolved;
    if (filter === "auto") return c.auto_resolvable;
    return c.severity === filter;
  });

  const stats = {
    total: conflicts.length,
    unresolved: conflicts.filter((c) => !c.resolved).length,
    critical: conflicts.filter((c) => c.severity === "Critical").length,
    autoResolvable: conflicts.filter((c) => c.auto_resolvable && !c.resolved).length,
  };

  const handleResolve = async (conflict: ConflictInfo) => {
    setResolving(conflict.id);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("resolve_conflict", { conflictId: conflict.id, resolution: "auto" });
      await detectConflicts();
      setSelectedConflict(null);
    } catch (e: any) {
      console.error("Resolve failed:", e);
    }
    setResolving(null);
  };

  const handleIgnore = (conflict: ConflictInfo) => {
    setSelectedConflict(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-light text-white/90">冲突解决中心</h2>
          <p className="text-xs text-white/30 mt-0.5">三级处理：自动 → 建议 → 手动合并</p>
        </div>
        <button onClick={detectConflicts} className="btn-primary text-xs">🔄 重新检测</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "总冲突", value: stats.total, color: "text-white/80" },
          { label: "未解决", value: stats.unresolved, color: "text-error" },
          { label: "严重", value: stats.critical, color: "text-red-400" },
          { label: "可自动", value: stats.autoResolvable, color: "text-aurora-green" },
        ].map((stat) => (
          <div key={stat.label} className="card p-3.5 text-center">
            <div className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-white/25 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { id: "all", label: "全部" }, { id: "unresolved", label: "未解决" },
          { id: "Critical", label: "严重" }, { id: "Major", label: "重要" }, { id: "auto", label: "可自动" },
        ].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs transition-all ${
              filter === f.id ? "bg-aurora-green/15 text-aurora-green border border-aurora-green/25" : "bg-white/5 text-white/35 hover:text-white/60"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Conflict List + Detail */}
      <div className="flex gap-6">
        <div className="flex-1 space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
          {filteredConflicts.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="text-5xl mb-4 opacity-30">✅</div>
              <p className="text-white/25">没有检测到冲突</p>
              <p className="text-xs text-white/15 mt-1">所有 Mod 和谐共处</p>
            </div>
          ) : (
            filteredConflicts.map((conflict) => (
              <div key={conflict.id} onClick={() => setSelectedConflict(conflict)}
                className={`card p-3.5 cursor-pointer transition-all ${
                  selectedConflict?.id === conflict.id ? "border-aurora-green/40 bg-aurora-green/5" : ""}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${severityColors[conflict.severity] || "bg-gray-500"}`} />
                  <span className="text-sm text-white/80 flex-1 truncate">{conflict.mod_a} ↔ {conflict.mod_b}</span>
                  {conflict.auto_resolvable && <span className="status-badge status-enabled text-[10px]">可自动</span>}
                  {conflict.resolved && <span className="status-badge status-disabled text-[10px]">已解决</span>}
                </div>
                <p className="text-xs text-white/25 mt-1.5 ml-4.5 truncate">{conflict.description}</p>
              </div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div className="w-96 flex-shrink-0">
          {selectedConflict ? (
            <div className="card p-4 space-y-4 sticky top-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white/90">冲突详情</h3>
                <span className={`status-badge ${
                  selectedConflict.severity === "Critical" ? "status-conflict" :
                  selectedConflict.severity === "Major" ? "status-warning" : "status-info"
                }`}>{selectedConflict.severity}</span>
              </div>
              <div className="space-y-2">
                <DetailRow label="Mod A" value={selectedConflict.mod_a} />
                <DetailRow label="Mod B" value={selectedConflict.mod_b} />
                <DetailRow label="类型" value={selectedConflict.conflict_type} />
                {selectedConflict.file_path && <DetailRow label="冲突文件" value={selectedConflict.file_path} />}
              </div>
              <div className="card bg-base-700/50 p-3 rounded-lg">
                <p className="text-xs text-white/35 mb-1">说明</p>
                <p className="text-sm text-white/75">{selectedConflict.description}</p>
              </div>
              {selectedConflict.suggestion && (
                <div className="card bg-aurora-green/5 border border-aurora-green/15 p-3 rounded-lg">
                  <p className="text-xs text-aurora-green mb-1">💡 建议</p>
                  <p className="text-sm text-white/75">{selectedConflict.suggestion}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {selectedConflict.auto_resolvable && !selectedConflict.resolved && (
                  <button onClick={() => handleResolve(selectedConflict)} disabled={resolving === selectedConflict.id}
                    className="btn-primary text-sm flex-1">
                    {resolving === selectedConflict.id ? "解决中..." : "自动解决"}
                  </button>
                )}
                <button className="btn-secondary text-sm flex-1">手动合并</button>
                <button onClick={() => handleIgnore(selectedConflict)} className="btn-secondary text-sm">忽略</button>
              </div>
            </div>
          ) : (
            <div className="card p-10 text-center">
              <div className="text-4xl mb-3 opacity-30">🔍</div>
              <p className="text-sm text-white/25">选择一个冲突查看详情</p>
              <p className="text-xs text-white/15 mt-1">包含解决建议和自动处理方案</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/35">{label}</span>
      <span className="text-xs text-white/65 max-w-[60%] truncate text-right">{value}</span>
    </div>
  );
}
