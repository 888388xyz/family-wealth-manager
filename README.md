# 家庭财富管家 (Family Wealth Manager)

一个面向家庭的资产管理系统，帮助您追踪和管理家庭财富。

## 功能特性

### 核心功能
- **仪表面板**: 资产总览、分布饼图、趋势图表、收益分析、历史对比
- **账户管理**: 多币种账户管理、余额追踪、到期提醒
- **用户管理**: 管理员可管理用户和角色
- **系统配置**: 自定义银行/平台、产品类型、币种

### 安全特性
- **权限控制**: 用户只能操作自己的账户，管理员拥有全局权限
- **审计日志**: 记录所有敏感操作，仅管理员可查看
- **登录保护**: 频率限制防止暴力破解（5分钟内最多10次尝试）
- **环境变量验证**: 启动时验证关键配置，防止配置错误
- **密码策略**: 强制8位以上，包含大小写字母和数字
- **输入验证**: UUID、角色、金额等参数严格验证
- **敏感信息过滤**: 日志自动过滤密码、token等敏感字段

### 数据可视化
- **分布饼图**: 币种、平台、资产类型分布，支持点击跳转筛选
- **趋势图表**: 30天/90天/1年资产变化趋势
- **收益分析**: 加权平均收益率、预期月/年收益
- **历史对比**: 与上月、去年同期对比

### 通知提醒
- **到期提醒**: 定期理财产品到期前7天和1天提醒
- **通知中心**: 未读通知徽章、一键全部已读

## 快速开始

### 环境变量

在根目录创建 `.env.local` 文件：

```bash
AUTH_SECRET="your_generated_secret"  # 生成命令: npx auth secret
DATABASE_URL="file:./sqlite.db"      # SQLite 本地数据库
# 或使用 PostgreSQL:
# DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

### 安装步骤

1. 安装依赖：
   ```bash
   pnpm install
   ```

2. 初始化数据库：
   ```bash
   pnpm exec drizzle-kit push
   ```

3. 创建管理员账户：
   ```bash
   pnpm exec tsx scripts/create-admin.ts
   ```

4. 启动开发服务器：
   ```bash
   pnpm dev
   ```

访问 [http://localhost:3000](http://localhost:3000)

## 技术栈

- **框架**: Next.js 15 (App Router)
- **数据库**: SQLite / PostgreSQL + Drizzle ORM
- **UI 组件**: Tailwind CSS + shadcn/ui
- **图表**: Recharts
- **认证**: NextAuth.js (Auth.js)
- **语言**: TypeScript

## 项目结构

```
src/
├── actions/          # Server Actions
│   ├── account-actions.ts
│   ├── audit-actions.ts
│   ├── notification-actions.ts
│   └── snapshot-actions.ts
├── app/              # Next.js App Router
│   ├── (auth)/       # 认证页面
│   ├── (dashboard)/  # 仪表面板页面
│   └── api/          # API 路由
├── components/       # React 组件
│   ├── accounts/     # 账户管理组件
│   ├── audit-logs/   # 审计日志组件
│   ├── charts/       # 图表组件
│   ├── dashboard/    # 仪表面板组件
│   ├── notifications/# 通知组件
│   └── ui/           # 基础 UI 组件
├── db/               # 数据库配置
│   ├── index.ts
│   └── schema.ts
└── lib/              # 工具库
    ├── audit-logger.ts   # 审计日志
    ├── cached-queries.ts # React cache 缓存查询
    ├── constants.ts      # 常量定义
    ├── env-validator.ts  # 环境变量验证
    ├── logger.ts         # 结构化日志器
    ├── password-validator.ts # 密码策略验证
    ├── rate-limiter.ts   # 频率限制器
    ├── result.ts         # 统一错误处理类型
    ├── validators.ts     # 输入验证器
    └── utils.ts          # 通用工具
```

## 数据库表

| 表名 | 说明 |
|------|------|
| user | 用户账户 |
| bank_account | 银行/理财账户 |
| balance_history | 余额历史记录 |
| audit_logs | 审计日志 |
| notifications | 系统通知 |
| daily_snapshots | 每日资产快照 |
| exchange_rates | 汇率缓存 |
| system_banks | 银行/平台配置 |
| system_product_types | 产品类型配置 |
| system_currencies | 币种配置 |

## 版本历史

### v0.5.0 (当前)
- **安全增强**
  - 环境变量启动验证：DATABASE_URL 和 AUTH_SECRET（>=32字符）
  - 密码策略增强：8位最小长度、大小写字母、数字要求
  - 输入验证增强：UUID、角色、金额参数严格验证
  - 敏感信息日志过滤：自动过滤 password、secret、token、email
- **代码优化**
  - 数据库查询优化：批量查询替代 N+1 查询
  - React cache 缓存：getCurrentUser、getExchangeRatesMap
  - 常量提取：CENTS_PER_UNIT、YIELD_MULTIPLIER、LOGIN_RATE_LIMIT 等
  - 统一错误处理：Result<T> 类型、ErrorCodes 常量
- **新增模块**
  - `env-validator.ts` - 环境变量验证器
  - `password-validator.ts` - 密码策略验证器
  - `validators.ts` - 通用输入验证器
  - `logger.ts` - 结构化日志器
  - `result.ts` - 统一错误处理类型
  - `cached-queries.ts` - React cache 缓存查询

### v0.3.0
- 两步验证 (2FA)：可选的 TOTP 两步验证功能，增强账户安全
- 账户克隆：一键复制现有账户信息快速创建新账户
- UI 简化：移除仪表面板平均余额卡片、标题和副标题
- 趋势分析页面：将趋势图表、收益分析、历史对比移至独立页面

### v0.2.0
- 安全性加固：权限控制、审计日志、登录频率限制
- 数据可视化：饼图、趋势图、收益分析、历史对比
- 通知系统：到期提醒、通知中心
- UI 优化：中文化、用户信息显示

### v0.1.0
- 基础功能：账户管理、用户管理、仪表面板

## License

MIT
