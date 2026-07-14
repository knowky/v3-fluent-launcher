import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "../stores/appStore";
import type { SaveInfo } from "../types";

export default function SaveCommand() {
  const { saves, scanSaves, deleteSave } = useAppStore();
  const [selectedSave, setSelectedSave] = useState<SaveInfo | null>(null);
  const [search, setSearch] = useState("");
  const [filterHealth, setFilterHealth] = useState("all");
  const [sortOrder, setSortOrder] = useState<"date" | "name" | "size">("date");
  const [showBackup, setShowBackup] = useState(false);
  const [backups, setBackups] = useState<{ name: string; date: string; size: string }[]>([]);

  useEffect(() => { scanSaves(); }, []);

  const filteredSaves = useMemo(() => {
    return saves
      .filter((s) => {
        const q = search.toLowerCase();
        const matchSearch = !q || s.file_name.toLowerCase().includes(q) || s.country_name.toLowerCase().includes(q) || s.country_tag.toLowerCase().includes(q);
        const matchHealth = filterHealth === "all" || s.health === filterHealth;
        return matchSearch && matchHealth;
      })
      .sort((a, b) => {
        if (sortOrder === "name") return a.file_name.localeCompare(b.file_name);
        if (sortOrder === "size") return b.file_size - a.file_size;
        return b.created_at.localeCompare(a.created_at);
      });
  }, [saves, search, filterHealth, sortOrder]);

  const handleDelete = async (save: SaveInfo) => {
    if (confirm(`确定删除存档 "${save.file_name}"？此操作不可恢复。`)) {
      await deleteSave(save.id, save.file_path);
      if (selectedSave?.id === save.id) setSelectedSave(null);
    }
  };

  const handleBackup = () => {
    setShowBackup(true);
    setBackups([
      { name: "自动备份_20240701", date: "2024-07-01 12:00", size: "12.5MB" },
      { name: "自动备份_20240615", date: "2024-06-15 08:30", size: "10.2MB" },
    ]);
  };

  const healthStats = {
    total: saves.length,
    healthy: saves.filter(s => s.health === "Healthy").length,
    warning: saves.filter(s => s.health === "Warning").length,
    danger: saves.filter(s => s.health === "Danger").length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-light text-white/90">存档指挥中心</h2>
          <p className="text-xs text-white/30 mt-0.5">{healthStats.total} 存档 · {healthStats.healthy} 健康</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleBackup} className="btn-secondary text-xs">📦 备份管理</button>
          <button onClick={scanSaves} className="btn-primary text-xs">🔄 刷新存档</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "总计", value: healthStats.total, color: "text-white/80" },
          { label: "健康", value: healthStats.healthy, color: "text-aurora-green" },
          { label: "警告", value: healthStats.warning, color: "text-warning" },
          { label: "危险", value: healthStats.danger, color: "text-error" },
        ].map((s) => (
          <div key={s.label} className="card p-3 text-center">
            <div className={`text-xl font-semibold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-white/25 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <input type="search" placeholder="搜索存档..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        <select value={filterHealth} onChange={(e) => setFilterHealth(e.target.value)} className="text-xs">
          <option value="all">全部状态</option><option value="Healthy">健康</option><option value="Warning">警告</option><option value="Danger">危险</option>
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="text-xs">
          <option value="date">按日期</option><option value="name">按名称</option><option value="size">按大小</option>
        </select>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Save List */}
        <div className="flex-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 space-y-2">
          {filteredSaves.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="text-5xl mb-4 opacity-30">💾</div>
              <p className="text-white/25">暂无存档</p>
              <p className="text-xs text-white/15 mt-1">启动游戏并保存后，存档将在此显示</p>
            </div>
          ) : (
            filteredSaves.map((save) => (
              <div key={save.id}
                onClick={() => setSelectedSave(save)}
                className={`card p-3.5 cursor-pointer transition-all flex items-center gap-3 group ${
                  selectedSave?.id === save.id ? "border-aurora-green/40 bg-aurora-green/5" : ""}`}>
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  save.health === "Healthy" ? "bg-aurora-green" : save.health === "Warning" ? "bg-warning" : "bg-error"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/80 truncate">{save.country_name || save.file_name.replace(".v3", "")}</span>
                    {save.is_ironman && <span className="status-badge status-warning text-[10px]">铁人</span>}
                    {save.is_autosave && <span className="text-[10px] bg-white/5 text-white/30 px-1.5 rounded">自动</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-white/25">{save.game_date}</span>
                    <span className="text-xs text-white/20">{save.country_tag}</span>
                    <span className="text-xs text-white/20">{formatSize(save.file_size)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(save); }} className="btn-ghost text-error text-xs">删除</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div className="w-80 flex-shrink-0">
          {selectedSave ? (
            <div className="card p-4 space-y-4 sticky top-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white/90 truncate">{selectedSave.country_name || "存档详情"}</h3>
                <span className={`status-badge ${
                  selectedSave.health === "Healthy" ? "status-enabled" : selectedSave.health === "Warning" ? "status-warning" : "status-conflict"
                }`}>{selectedSave.health === "Healthy" ? "健康" : selectedSave.health === "Warning" ? "警告" : "危险"}</span>
              </div>
              <div className="space-y-2">
                <DetailRow label="文件名" value={selectedSave.file_name} />
                <DetailRow label="游戏日期" value={selectedSave.game_date} />
                <DetailRow label="国家标识" value={selectedSave.country_tag} />
                <DetailRow label="创建时间" value={selectedSave.created_at} />
                <DetailRow label="文件大小" value={formatSize(selectedSave.file_size)} />
                <DetailRow label="游戏时长" value={selectedSave.play_time || "未知"} />
                <DetailRow label="类型" value={
                  [selectedSave.is_ironman && "铁人模式", selectedSave.is_autosave && "自动保存"].filter(Boolean).join(", ") || "手动保存"} />
                {selectedSave.gdp && <DetailRow label="GDP" value={selectedSave.gdp} />}
                {selectedSave.rank && <DetailRow label="列强排名" value={`#${selectedSave.rank}`} />}
                {selectedSave.population && <DetailRow label="人口" value={selectedSave.population} />}
                {selectedSave.prestige != null && <DetailRow label="威望" value={String(selectedSave.prestige)} />}
              </div>
              <div className="flex gap-2 pt-2 border-t border-white/5">
                <button className="btn-secondary text-xs flex-1">📝 备注</button>
                <button className="btn-secondary text-xs flex-1">📤 导出</button>
                <button className="btn-secondary text-xs flex-1" onClick={() => handleBackup()}>💾 备份</button>
              </div>
            </div>
          ) : (
            <div className="card p-10 text-center">
              <div className="text-4xl mb-3 opacity-30">📋</div>
              <p className="text-sm text-white/25">选择一个存档查看详情</p>
              <p className="text-xs text-white/15 mt-1">包括国家信息、游戏日期、经济数据等</p>
            </div>
          )}
        </div>
      </div>

      {/* Backup Panel */}
      {showBackup && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/80">📦 存档备份管理</h3>
            <button onClick={() => setShowBackup(false)} className="btn-ghost text-xs">关闭</button>
          </div>
          <div className="flex gap-2 mb-2">
            <button className="btn-primary text-xs">+ 创建备份</button>
            <button className="btn-secondary text-xs">📥 导入备份</button>
          </div>
          {backups.length === 0 ? (
            <p className="text-xs text-white/25 text-center py-6">暂无备份，点击"创建备份"来保护你的存档</p>
          ) : (
            <div className="space-y-2">
              {backups.map((b, i) => (
                <div key={i} className="card p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">{b.name}</p>
                    <p className="text-xs text-white/25">{b.date} · {b.size}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary text-xs">恢复</button>
                    <button className="btn-ghost text-xs text-error">删除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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

function formatSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0B";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}
