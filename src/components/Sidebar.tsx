import { useAppStore } from "../stores/appStore";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { id: "dashboard", label: "仪表盘", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="12" width="7" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="16" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>
  ), path: "/dashboard" },
  { id: "mods", label: "Mod 工作室", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="1.5"/></svg>
  ), path: "/mods" },
  { id: "saves", label: "存档中心", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5"/></svg>
  ), path: "/saves" },
  { id: "config", label: "配置中心", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.5"/></svg>
  ), path: "/config" },
  { id: "launch", label: "启动游戏", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
  ), path: "/launch" },
  { id: "conflicts", label: "冲突中心", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5"/></svg>
  ), path: "/conflicts" },
  { id: "tools", label: "工具箱", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3a1 1 0 000-1.4l-1.4-1.4a1 1 0 00-1.4 0L9.5 5.9a1 1 0 000 1.4l1.4 1.4a1 1 0 001.4 0l2.4-2.4z" stroke="currentColor" strokeWidth="1.5"/><path d="M6.5 17.5L4 20M9.5 14.5l-2-2M17.5 6.5L20 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/></svg>
  ), path: "/tools" },
  { id: "settings", label: "设置", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  ), path: "/settings" },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, gameInfo, mods, saves } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname === "/" ? "/dashboard" : location.pathname;
  const enabledMods = mods.filter((m) => m.enabled).length;

  return (
    <aside className={`acrylic-bg border-r border-white/5 flex flex-col transition-all duration-300 relative ${
      sidebarCollapsed ? "w-16" : "w-60"
    }`}>
      {/* Toggle */}
      <button onClick={toggleSidebar}
        className="self-end m-2 p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => navigate(item.path)}
            className={`nav-item w-full text-left ${currentPath === item.path ? "active" : ""} ${sidebarCollapsed ? "justify-center px-2" : ""}`}
            title={sidebarCollapsed ? item.label : undefined}>
            <span className="flex-shrink-0">{item.icon}</span>
            {!sidebarCollapsed && <span>{item.label}</span>}
            {/* Badges */}
            {!sidebarCollapsed && item.id === "mods" && mods.length > 0 && (
              <span className="ml-auto text-[10px] bg-aurora-green/10 text-aurora-green px-1.5 py-0.5 rounded-full">{mods.length}</span>
            )}
            {!sidebarCollapsed && item.id === "saves" && saves.length > 0 && (
              <span className="ml-auto text-[10px] bg-aurora-blue/10 text-aurora-blue px-1.5 py-0.5 rounded-full">{saves.length}</span>
            )}
            {!sidebarCollapsed && item.id === "conflicts" && mods.filter(m => m.conflict_count > 0).length > 0 && (
              <span className="ml-auto text-[10px] bg-error/10 text-error px-1.5 py-0.5 rounded-full">{mods.filter(m => m.conflict_count > 0).length}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="p-3 border-t border-white/5 space-y-1">
          <div className="flex items-center justify-between text-xs text-white/25">
            <span>{gameInfo?.version || "v—"}</span>
            <span>{enabledMods} Mod</span>
          </div>
          <div className="text-[10px] text-white/15">V3FL v1.0 · Aurora</div>
        </div>
      )}
    </aside>
  );
}
