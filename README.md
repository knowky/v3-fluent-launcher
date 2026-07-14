# Victoria 3 Fluent Launcher (V3FL)

> 一款以「场景化游戏管理」为核心的现代化 Victoria 3 第三方启动器

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tauri 2.0](https://img.shields.io/badge/Tauri-2.0-blue)](https://tauri.app/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB)](https://react.dev/)

## 🎯 核心特性

- **📦 Mod 工作室** — 可视化 Mod 管理，支持网格/列表/依赖图三种视图，拖拽排序加载顺序
- **💾 存档指挥中心** — 存档时间线 + 健康度检测 + 场景自动绑定
- **🎮 场景系统** — 存档 + Mod Playset + 游戏配置绑定，一键切换
- **⚠️ 冲突解决中心** — 三级冲突处理：自动 → AI 建议 → 可视化三栏合并
- **🚀 智能启动** — 性能优化、启动加速、进程管理
- **🛠️ 工具箱** — 日志分析器、截图管理、经济计算器、创意工坊浏览器
- **🌐 中文原生体验** — 原生中文界面，Mod 元数据汉化社区

## 🏗️ 技术架构

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Tailwind CSS + Framer Motion |
| 壳层 | Tauri 2.0 (Rust) + WebView2 |
| 核心引擎 | Rust (tokio 异步) |
| 数据层 | SQLite (rusqlite) |
| 设计语言 | Fluent Design System 2.0 |

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/) >= 1.70
- [Visual Studio 2022 Build Tools](https://visualstudio.microsoft.com/downloads/) (Windows)

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装 Tauri CLI
cargo install tauri-cli --version "^2.0"
```

### 开发模式

```bash
npm run tauri dev
```

### 构建发布

```bash
npm run tauri build
```

## 📁 项目结构

```
v3-fluent-launcher/
├── src/                          # 前端源代码
│   ├── components/               # 通用组件
│   │   ├── Sidebar.tsx           # 侧边导航
│   │   └── TitleBar.tsx          # 顶部标题栏
│   ├── pages/                    # 页面组件
│   │   ├── Dashboard.tsx         # 仪表盘
│   │   ├── ModStudio.tsx         # Mod 工作室
│   │   ├── SaveCommand.tsx       # 存档中心
│   │   ├── Configuration.tsx     # 配置中心
│   │   ├── LaunchPad.tsx         # 启动面板
│   │   ├── ConflictCenter.tsx    # 冲突解决中心
│   │   ├── Toolbox.tsx           # 工具箱
│   │   ├── Settings.tsx          # 设置
│   │   └── SetupWizard.tsx       # 首次设置向导
│   ├── stores/                   # 状态管理 (Zustand)
│   ├── types/                    # TypeScript 类型定义
│   ├── utils/                    # 工具函数
│   ├── styles/                   # 全局样式
│   ├── App.tsx                   # 应用根组件
│   └── main.tsx                  # 入口文件
├── src-tauri/                    # Rust 后端
│   └── src/
│       ├── lib.rs                # Tauri 应用入口
│       ├── main.rs               # Rust 入口
│       ├── steam.rs              # Steam 路径检测
│       ├── mod_manager.rs        # Mod 解析与管理
│       ├── save_parser.rs        # 存档解析
│       ├── conflict_resolver.rs  # 冲突检测引擎
│       ├── scene_manager.rs      # 场景管理
│       ├── game_launcher.rs      # 游戏启动
│       └── database.rs           # SQLite 数据库
├── index.html                    # HTML 入口
├── package.json                  # 前端依赖
├── tailwind.config.js            # Tailwind 配置
├── vite.config.ts                # Vite 配置
└── tsconfig.json                 # TypeScript 配置
```

## 🎨 与 Irony Mod Manager 的对比

| 功能 | Irony Mod Manager | V3FL |
|------|-------------------|------|
| 界面风格 | 传统 WinForms | Fluent Design 2.0 |
| Mod 冲突 | 文本 Diff | 三级体系 + 可视化合并 |
| 存档管理 | 需 Pdx-Unlimiter | 原生时间线 + 健康度 |
| 场景系统 | 无 | 存档+Mod+配置绑定 |
| 性能优化 | 无 | 启动加速 + 存档瘦身 |
| 中文体验 | 翻译 | 原生中文语境 |
| 技术栈 | C#/.NET | Tauri + Rust + React |
| 包体积 | ~200MB | < 5MB |

## 🗺️ Roadmap

- [x] **Phase 1**: 核心骨架 — Tauri 项目搭建、Fluent UI、Mod 扫描、Playset
- [x] **Phase 2**: 场景化 — 存档解析、场景系统、时间线
- [x] **Phase 3**: 智能化 — 冲突检测、可视化合并、规则库
- [x] **Phase 4**: 生态 — Workshop 浏览器、日志分析、性能中心
- [ ] **Phase 5**: 发布 — 自动更新、社区建设、用户反馈

## 📄 License

MIT License — 核心启动器开源，社区共建

---

**Victoria 3 Fluent Launcher** — 让玩家忘记启动器的存在
