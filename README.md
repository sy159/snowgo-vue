# snowgo-vue

> SnowGo 管理后台前端项目

基于 Vue 3 + TypeScript + Element Plus + Vite 构建的企业管理后台前端。

## 技术栈

| 模块 | 技术 | 描述 |
|------|------|------|
| 框架 | Vue 3 | Composition API + `<script setup>` |
| UI 库 | Element Plus | 企业级组件库 |
| 构建工具 | Vite | 快速开发体验 |
| 状态管理 | Pinia | Vue 官方推荐状态管理 |
| 路由 | Vue Router | 动态路由 + 路由守卫 |
| HTTP 客户端 | Axios | 统一拦截器处理 |
| 语言 | TypeScript | 类型安全 |

## 项目结构

```
snowgo-vue/
├── src/
│   ├── api/                      # API 请求层（按后端模块分组）
│   │   ├── auth.ts               # 登录、刷新 token、登出
│   │   ├── account/
│   │   │   ├── user.ts           # 用户 CRUD
│   │   │   ├── role.ts           # 角色 CRUD
│   │   │   └── menu.ts           # 菜单 CRUD
│   │   └── system/
│   │       ├── dict.ts           # 字典 CRUD
│   │       └── log.ts            # 操作日志、登录日志
│   ├── components/               # 公共组件
│   │   └── Layout/               # 主布局（Sidebar + Header + Tabs + Content）
│   ├── router/                   # 路由配置
│   ├── store/                    # Pinia 状态管理
│   │   ├── user.ts               # 用户信息、token
│   │   ├── tabs.ts               # Tab 页签
│   │   └── permission.ts         # 权限菜单
│   ├── utils/                    # 工具函数
│   │   ├── request.ts            # Axios 封装
│   │   └── storage.ts            # localStorage 封装
│   └── views/                    # 页面
│       ├── login/                # 登录页
│       ├── dashboard/            # 首页
│       ├── account/              # 账号管理
│       │   ├── user/
│       │   ├── role/
│       │   └── menu/
│       └── system/               # 系统管理
│           ├── dict/
│           └── log/
├── .env.development              # 开发环境配置
├── .env.production               # 生产环境配置
├── vite.config.ts
└── tsconfig.json
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```shell
npm install
```

### 开发

```shell
npm run dev
```

访问 http://localhost:5173

测试账号：`admin / 123456`

### 构建

```shell
npm run build
```

### 预览生产构建

```shell
npm run preview
```

## 功能模块

| 模块 | 页面 | 功能 |
|------|------|------|
| 认证 | 登录页 | 用户名密码登录、记住我、失败限流提示、token 刷新 |
| 布局 | 主布局 | 左侧可折叠菜单、顶部用户信息/退出、Tab 页签导航 |
| 用户管理 | account/user | 列表表格、搜索筛选、新增/编辑/删除、重置密码 |
| 角色管理 | account/role | 列表表格、新增/编辑/删除、角色权限分配（树形菜单勾选） |
| 菜单管理 | account/menu | 树形展示目录/页面/按钮、新增/编辑/删除 |
| 字典管理 | system/dict | 左侧字典列表、右侧字典项表格、双栏联动 CRUD |
| 操作日志 | system/log/operation | 查询条件筛选、表格分页、展开查看前后数据快照 |
| 登录日志 | system/log/login | 查询条件筛选、表格分页 |

## 后端接口

后端 API 服务地址：`http://localhost:8000`

开发环境通过 Vite proxy 代理请求到后端。

生产环境通过 `.env.production` 配置 `VITE_API_BASE_URL` 指向后端地址。

## 认证流程

1. 登录成功 → 存储 access_token + refresh_token + 过期时间到 localStorage
2. Axios 请求拦截器 → 自动注入 `Authorization: Bearer {access_token}`
3. 401 响应 → 清除 token 并跳转登录页
4. 路由守卫 → 未登录跳转登录页，已登录放行

## Tab 页签

- 点击菜单自动打开 Tab
- 支持关闭（首页不可关闭）
- 右键菜单：关闭其他 / 关闭右侧
- Tab 状态持久化到 sessionStorage
