import { useAppStore } from "../stores/appStore";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { id: "dashboard", label: "仪表盘", icon: "🏠", path: "/dashboard" },
  { id: "mods", label: "Mod 工作室", icon: "📦", path: "/mods" },
  { id: "saves", label: "存档中心", icon: "💾", path: "/saves" },
  { id: "config", label: "配置", icon: "⚙️", path: "/config" },
  { id: "launch", label: "启动", icon: "🚀", path: "/launch" },
  { id: "conflicts", label: "冲突中心", icon: "⚠️", path: "/conflicts" },
  { id: "tools", label: "工具箱", icon: "🛠️", path: "/tools" },
  { id: "settings", label: "设置", icon: "⚙️", path: "/settings" },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, gameInfo } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname === "/" ? "/dashboard" : location.pathname;

  return (
    <aside
      className={`acrylic-bg border-r border-white/5 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? "w-16" : "w-60"
      }`}
    >
      {/* 折叠按钮 */}
      <button
        onClick={toggleSidebar}
        className="self-end m-2 p-1.5 rounded-md text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 5h14M3 10h14M3 15h10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* 导航项 */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`nav-item w-full text-left ${
              currentPath === item.path ? "active" : ""
            } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <span className="text-lg flex-shrink-0">{item.icon}</span>
            {!sidebarCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* 底部信息 */}
      {!sidebarCollapsed && (
        <div className="p-3 border-t border-white/5 text-xs text-white/30">
          <div className="truncate">
            {gameInfo?.version || "未检测到游戏"}
          </div>
          {gameInfo?.installed && (
            <div className="text-white/20 text-[10px] mt-0.5">
              V3 Fluent Launcher v1.0
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
