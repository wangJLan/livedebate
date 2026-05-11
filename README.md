# 直播辩论系统

一个完整的直播辩论平台，支持实时投票、AI 内容识别、弹幕互动、直播流管理等功能。

## 🚀 演示地址

| 项目 | 地址 |
|------|------|
| 前端首页 | [http://8.136.191.55:3001](http://8.136.191.55:3001) |
| 管理后台 | [http://8.136.191.55:3001/admin](http://8.136.191.55:3001/admin) |
| 后端 API | [http://8.136.191.55:3001/health](http://8.136.191.55:3001/health) |

## 🧱 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| **前端** | HTML5 + CSS3 + JavaScript + uni-app | 管理后台 + 小程序前端 |
| **网关** | Node.js + Express | API 代理、WebSocket 中继、SRS 流媒体代理 |
| **后端** | Node.js + Express | REST API，完整业务逻辑 |
| **数据** | JSON 文件存储 | 轻量级持久化，无需安装数据库 |
| **Mock** | 内置代码生成 | 首次启动自动生成示例数据 |

## 🔗 项目结构

```
├── backend/                  # 后端业务服务 (:3000)
│   ├── app.js               # 主入口，Express 服务器
│   ├── config/index.js      # 配置文件
│   ├── db/index.js          # JSON 文件数据库（7个数据表）
│   ├── mock/data.js         # Mock 数据初始化
│   ├── routes/
│   │   ├── votes.js         # 投票接口
│   │   ├── debate.js        # 辩题接口
│   │   ├── ai.js            # AI 内容、评论、点赞
│   │   ├── live.js          # 直播控制、直播计划
│   │   ├── streams.js       # 直播流管理
│   │   ├── admin.js         # 用户管理、统计、仪表盘
│   │   └── wechat.js        # 微信登录（Mock 模式）
│   └── data/                # JSON 数据文件（自动生成）
│
├── live-gateway/             # 网关中间层 (:3001)
│   ├── gateway.js           # 网关主程序
│   ├── config/              # 网关配置
│   ├── admin/               # 管理后台静态页面
│   └── static/              # 静态资源 + 首页
│
├── frontend-live/            # uni-app 前端（可构建 H5/小程序）
├── start.js                 # 一键启动脚本
├── package.json             # 根配置
└── README.md
```

## 📡 主要接口

### 公开接口

| 功能 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取票数 | GET | `/api/votes` | 返回正反方票数和百分比 |
| 获取辩题 | GET | `/api/debate-topic` | 返回当前辩题信息 |
| AI内容列表 | GET | `/api/ai-content` | 返回AI识别的辩论观点 |
| 用户投票 | POST | `/api/user-vote` | 支持100票分配制和增量投票 |
| 添加评论 | POST | `/api/comment` | 对AI观点添加评论 |
| 删除评论 | DELETE | `/api/comment/:id` | 删除指定评论 |
| 点赞 | POST | `/api/like` | 内容或评论点赞 |
| 微信登录 | POST | `/api/wechat-login` | Mock模式返回模拟用户 |
| 直播控制 | POST | `/api/live/control` | 开始/停止直播 |

### 管理后台接口

| 功能 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 仪表盘 | GET | `/api/admin/dashboard` | 实时数据概览 |
| 辩题管理 | GET/PUT | `/api/admin/debate` | 查看/修改辩题 |
| 直播流管理 | GET/POST | `/api/admin/streams` | 列表/添加 |
| 直播流管理 | PUT/DELETE | `/api/admin/streams/:id` | 更新/删除 |
| 直播状态 | GET | `/api/admin/live/status` | 获取直播状态 |
| 直播控制 | POST | `/api/admin/live/start` | 开始直播 |
| 直播控制 | POST | `/api/admin/live/stop` | 停止直播 |
| 直播计划 | GET/POST | `/api/admin/live/schedule` | 查询/设置计划 |
| AI内容管理 | GET/POST | `/api/admin/ai-content` | 列表/添加 |
| AI内容管理 | PUT/DELETE | `/api/admin/ai-content/:id` | 更新/删除 |
| 评论管理 | GET | `/api/admin/ai-content/:id/comments` | AI内容评论列表 |
| 评论管理 | DELETE | `/api/admin/ai-content/:id/comments/:cid` | 删除评论 |
| 票数管理 | GET/PUT | `/api/admin/votes` | 查看/修改票数 |
| 票数重置 | POST | `/api/admin/votes/reset` | 重置票数为0 |
| 用户列表 | GET | `/api/admin/users` | 用户列表 |
| 统计汇总 | GET | `/api/admin/statistics/summary` | 统计数据 |
| 每日统计 | GET | `/api/admin/statistics/daily` | 每日数据 |

### 响应格式

所有接口统一返回：

```json
{
  "code": 0,
  "data": { ... },
  "message": "success"
}
```

## 🧠 架构设计

```
用户浏览器 ──HTTP──> gateway(:3001) ──代理──> backend(:3000)
    │                   │                         │
    │              WebSocket                   JSON 文件
    │              /ws                         /data/*.json
    │                   │
    │              SRS 流媒体
    │            (:8086, 可选)
```

- **Gateway**: 只做代理转发，不包含业务逻辑。负责 CORS、WebSocket、SRS代理、静态页面。
- **Backend**: 全部业务接口，JSON 文件持久化。重启数据不丢失。
- **数据流**: Gateway 将 `/api/*` 全部代理到 Backend，自身不存储状态。

## 📝 项目开发过程笔记

### 实现思路

1. **架构分层**: 严格遵循三层架构，Gateway 只做转发，Backend 承载全部业务逻辑。
2. **数据持久化**: 使用 JSON 文件而非内存变量，保证重启后数据不丢失，同时避免引入数据库依赖。
3. **Mock 数据**: 首次启动自动初始化 5 条 AI 辩论观点（含评论）、2 个直播流、1 个示例用户、7 天统计数据。
4. **Gateway 瘦身**: 将原 4000+ 行的 gateway.js 精简到约 160 行，业务逻辑全部迁移到 Backend。

### 遇到的问题与解决方案

1. **Gateway 与 Backend 路径代理问题**
   - `app.use('/api', proxy)` 会剥离 `/api` 前缀，导致请求到 Backend 时路径不匹配
   - 解决：添加 `pathRewrite: (path) => '/api' + path` 将前缀补回

2. **定时任务无法在 serverless 环境运行**
   - Vercel 等 serverless 平台不支持后台定时任务
   - 解决：选用 Render（支持长时间运行的 Web Service）

3. **CORS 双重配置**
   - Gateway 和 Backend 都有 CORS 中间件，OPTIONS 预检可能冲突
   - 解决：两端都配置了宽松的 CORS 策略

### 本地联调经验

- Backend 先启动 (:3000)，Gateway 后启动 (:3001)
- 用 curl 直接测试 Backend 接口，确认逻辑正确后再通过 Gateway 代理测试
- 管理后台的 API 调用使用相对路径，通过 Gateway 代理到 Backend，无需修改前端代码

### 部署步骤（Render）

1. 将项目推送到 GitHub
2. 在 Render 创建新 Web Service，关联 GitHub 仓库
3. Build Command: `npm run install:all`
4. Start Command: `npm start`
5. 设置环境变量（可选）
6. 部署完成后获得 `https://xxx.onrender.com` 地址

### 可扩展性思考

如果从 Mock 版本扩展到生产版本，需要进行以下改造：

- **数据库**: 将 `db/index.js` 的 JSON 读写替换为 Sequelize/Prisma 操作 MySQL/PostgreSQL
- **认证**: 微信登录目前是 Mock 模式，需接入真实微信 OAuth API
- **AI 内容**: 目前是静态 Mock 数据，可接入真实 NLP 服务生成辩论观点摘要
- **缓存**: 票数等高频接口可引入 Redis，减少数据库压力
- **并发**: 多进程 + 负载均衡，WebSocket 用 Redis Pub/Sub 跨进程同步

## 🧑 个人介绍

- **主语言**: JavaScript/Node.js，熟悉 Vue.js 和 uni-app
- **后端框架**: Express，了解 Spring Boot、NestJS
- **部署经验**: Render、Vercel、阿里云 ECS
- **学习目标**: 深入全栈架构设计，提升系统可扩展性和可靠性
