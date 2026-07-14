import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../stores/appStore";
import type { ConflictInfo, ConflictRule } from "../types";

export default function ConflictCenter() {
  const { conflicts, detectConflicts, mods } = useAppStore();
  const [selectedConflict, setSelectedConflict] = useState<ConflictInfo | null>(null);
  const [rules, setRules] = useState<ConflictRule[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    detectConflicts();
  }, []);

  const severityColors: Record<string, string> = {
    Critical: "bg-red-500",
    Major: "bg-orange-500",
    Minor: "bg-yellow-500",
    Info: "bg-blue-500",
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
    autoResolvable: conflicts.filter((c) => c.auto_resolvable).length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="page-enter space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-light text-white/90">冲突解决中心</h2>
        <button onClick={detectConflicts} className="btn-secondary text-xs">
          🔄 重新检测
        </button>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "总冲突", value: stats.total, color: "text-white/80" },
          { label: "未解决", value: stats.unresolved, color: "text-error" },
          { label: "严重", value: stats.critical, color: "text-red-500" },
          { label: "可自动解决", value: stats.autoResolvable, color: "text-green-400" },
        ].map((stat) => (
          <div key={stat.label} className="card p-3 text-center">
            <div className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-white/30 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 筛选 */}
      <div className="flex gap-2">
        {[
          { id: "all", label: "全部" },
          { id: "unresolved", label: "未解决" },
          { id: "Critical", label: "严重" },
          { id: "Major", label: "重要" },
          { id: "auto", label: "可自动" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1 rounded-full text-xs transition-all ${
              filter === f.id
                ? "bg-v3-gold/20 text-v3-gold border border-v3-gold/30"
                : "bg-white/5 text-white/40 hover:text-white/70"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 冲突列表 + 详情 */}
      <div className="flex gap-6">
        <div className="flex-1 space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
          {filteredConflicts.length === 0 ? (
            <div className="card p-12 text-center text-white/20">
              <div className="text-4xl mb-3">✅</div>
              <p>没有检测到冲突</p>
              <p className="text-xs mt-1">所有 Mod 和谐共处</p>
            </div>
          ) : (
            filteredConflicts.map((conflict) => (
              <div
                key={conflict.id}
                onClick={() => setSelectedConflict(conflict)}
                className={`card p-3 cursor-pointer transition-all ${
                  selectedConflict?.id === conflict.id ? "border-v3-gold/50" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      severityColors[conflict.severity] || "bg-gray-500"
                    }`}
                  />
                  <span className="text-sm text-white/80 flex-1 truncate">
                    {conflict.mod_a} ↔ {conflict.mod_b}
                  </span>
                  {conflict.auto_resolvable && (
                    <span className="status-badge status-enabled text-[10px]">自动</span>
                  )}
                  {conflict.resolved && (
                    <span className="status-badge status-disabled text-[10px]">已解决</span>
                  )}
                </div>
                <p className="text-xs text-white/30 mt-1 truncate">{conflict.description}</p>
              </div>
            ))
          )}
        </div>

        {/* 详情面板 */}
        <div className="w-96 flex-shrink-0">
          {selectedConflict ? (
            <div className="card p-4 space-y-4 sticky top-0">
              <h3 className="text-lg font-semibold text-white/90">冲突详情</h3>

              <div className="space-y-2">
                <DetailRow label="Mod A" value={selectedConflict.mod_a} />
                <DetailRow label="Mod B" value={selectedConflict.mod_b} />
                <DetailRow label="类型" value={selectedConflict.conflict_type} />
                <DetailRow
                  label="严重程度"
                  value={
                    <span
                      className={`status-badge ${
                        selectedConflict.severity === "Critical"
                          ? "status-conflict"
                          : selectedConflict.severity === "Major"
                          ? "status-warning"
                          : "status-disabled"
                      }`}
                    >
                      {selectedConflict.severity}
                    </span>
                  }
                />
                {selectedConflict.file_path && (
                  <DetailRow label="冲突文件" value={selectedConflict.file_path} />
                )}
              </div>

              <div className="card bg-surface/50 p-3">
                <p className="text-xs text-white/40 mb-1">说明</p>
                <p className="text-sm text-white/80">{selectedConflict.description}</p>
              </div>

              {selectedConflict.suggestion && (
                <div className="card bg-v3-gold/5 border border-v3-gold/20 p-3">
                  <p className="text-xs text-v3-gold mb-1">💡 建议</p>
                  <p className="text-sm text-white/80">{selectedConflict.suggestion}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {selectedConflict.auto_resolvable && (
                  <button className="btn-primary text-sm flex-1">自动解决</button>
                )}
                <button className="btn-secondary text-sm flex-1">手动合并</button>
                <button className="btn-secondary text-sm">忽略</button>
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center text-white/20">
              <p className="text-sm">选择一个冲突查看详情</p>
              <p className="text-xs mt-1">
                V3FL 提供三级冲突处理：自动 → 建议 → 手动合并
              </p>
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
      <span className="text-xs text-white/40">{label}</span>
      <span className="text-xs text-white/70 max-w-[60%] truncate">{value}</span>
    </div>
  );
}
