import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../stores/appStore";
import type { SaveInfo } from "../types";

export default function SaveCommand() {
  const { saves, scanSaves, deleteSave } = useAppStore();
  const [selectedSave, setSelectedSave] = useState<SaveInfo | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    scanSaves();
  }, []);

  const filteredSaves = saves.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      s.file_name.toLowerCase().includes(q) ||
      s.country_name.toLowerCase().includes(q) ||
      s.country_tag.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (save: SaveInfo) => {
    if (confirm(`确定删除存档 "${save.file_name}"？此操作不可恢复。`)) {
      await deleteSave(save.id, save.file_path);
    }
  };

  const healthColor = (health: string) => {
    switch (health) {
      case "Healthy": return "bg-green-500";
      case "Warning": return "bg-yellow-500";
      case "Danger": return "bg-red-500";
      default: return "bg-white/20";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="page-enter space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-light text-white/90">存档指挥中心</h2>
        <button onClick={scanSaves} className="btn-secondary text-xs">
          🔄 刷新存档
        </button>
      </div>

      <input
        type="search"
        placeholder="搜索存档..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-64"
      />

      <div className="flex gap-6">
        {/* 存档时间线 */}
        <div className="flex-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
          {filteredSaves.length === 0 ? (
            <div className="card p-12 text-center text-white/20">
              <div className="text-4xl mb-3">💾</div>
              <p>暂无存档</p>
              <p className="text-xs mt-1">启动游戏并保存后，存档将在此显示</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSaves.map((save) => (
                <div
                  key={save.id}
                  onClick={() => setSelectedSave(save)}
                  className={`card p-3 cursor-pointer transition-all flex items-center gap-3 ${
                    selectedSave?.id === save.id ? "border-v3-gold/50" : ""
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${healthColor(save.health)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/80 truncate">
                        {save.country_name || save.file_name.replace(".v3", "")}
                      </span>
                      {save.is_ironman && (
                        <span className="text-[10px] bg-v3-gold/20 text-v3-gold px-1.5 rounded">
                          铁人
                        </span>
                      )}
                      {save.is_autosave && (
                        <span className="text-[10px] bg-white/10 text-white/40 px-1.5 rounded">
                          自动
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-white/30">{save.game_date}</span>
                      <span className="text-xs text-white/20">{save.country_tag}</span>
                      <span className="text-xs text-white/20">{formatSize(save.file_size)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(save);
                    }}
                    className="text-white/20 hover:text-error transition-colors text-xs"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 存档详情面板 */}
        <div className="w-80 flex-shrink-0">
          {selectedSave ? (
            <div className="card p-4 space-y-4 sticky top-0">
              <h3 className="text-lg font-semibold text-white/90">
                {selectedSave.country_name || "存档详情"}
              </h3>

              <div className="space-y-2">
                <DetailRow label="文件名" value={selectedSave.file_name} />
                <DetailRow label="游戏日期" value={selectedSave.game_date} />
                <DetailRow label="国家标识" value={selectedSave.country_tag} />
                <DetailRow label="创建时间" value={selectedSave.created_at} />
                <DetailRow label="文件大小" value={formatSize(selectedSave.file_size)} />
                <DetailRow label="类型" value={
                  [selectedSave.is_ironman && "铁人模式", selectedSave.is_autosave && "自动保存"]
                    .filter(Boolean)
                    .join(", ") || "手动保存"
                } />
                <DetailRow
                  label="健康状态"
                  value={
                    <span className={`status-badge ${
                      selectedSave.health === "Healthy" ? "status-enabled" :
                      selectedSave.health === "Warning" ? "status-warning" :
                      selectedSave.health === "Danger" ? "status-conflict" : "status-disabled"
                    }`}>
                      {selectedSave.health === "Healthy" ? "🟢 健康" :
                       selectedSave.health === "Warning" ? "🟡 警告" :
                       selectedSave.health === "Danger" ? "🔴 危险" : "⚪ 未知"}
                    </span>
                  }
                />
                {selectedSave.gdp && <DetailRow label="GDP" value={selectedSave.gdp} />}
                {selectedSave.rank && <DetailRow label="列强排名" value={`#${selectedSave.rank}`} />}
                {selectedSave.population && <DetailRow label="人口" value={selectedSave.population} />}
              </div>

              <div className="flex gap-2 pt-2 border-t border-white/5">
                <button className="btn-secondary text-xs flex-1">📝 备注</button>
                <button className="btn-secondary text-xs flex-1">📤 导出</button>
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center text-white/20">
              <p className="text-sm">选择一个存档查看详情</p>
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
      <span className="text-xs text-white/70">{value}</span>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
