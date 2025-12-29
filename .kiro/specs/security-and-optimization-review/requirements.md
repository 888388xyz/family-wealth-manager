# 项目安全审查与优化建议

## 项目概述

这是一个"家庭财富管家"应用，基于 Next.js 16 + NextAuth 5 + Drizzle ORM + PostgreSQL (Neon) 构建，用于管理家庭银行账户和资产。

---

## 一、安全隐患分析

### 1. 高风险问题

#### 1.1 2FA 临时 Token 安全漏洞 (严重)

**位置**: `src/actions/auth-actions.ts` 第 95-100 行

**问题**: 2FA 临时 token 将用户的邮箱和明文密码以 Base64 编码存储，这不是加密！

```typescript
const tempToken = Buffer.from(JSON.stringify({
    email,
    password,  // 明文密码！
    timestamp: Date.now()
})).toString('base64')
```

**风险**: 
- Base64 可以轻易解码，任何获取到 token 的人都能看到明文密码
- 如果 token 被日志记录或泄露，密码将暴露

**建议修复**:
- 使用 JWT 签名 token，不存储密码
- 或使用服务端 session 存储临时认证状态

#### 1.2 2FA Secret 内存存储问题 (低风险 - 家庭系统可接受)

**位置**: `src/actions/settings-actions.ts` 第 72 行

```typescript
const pendingSecrets = new Map<string, { secret: string; expiresAt: number }>()
```

**说明**:
- 使用内存 Map 存储 2FA pending secrets
- 对于家庭小系统，单实例部署，这个方案是可接受的
- 5分钟过期时间足够完成 2FA 设置流程

**可选优化**: 如果未来需要，可以存到数据库临时表，但当前不是必须

#### 1.3 缺少 CSRF 保护验证

**问题**: Server Actions 虽然有内置 CSRF 保护，但部分敏感操作缺少额外验证

**建议**: 对关键操作（如删除账户、修改密码）添加二次确认机制

### 2. 中等风险问题

#### 2.1 路由保护方式 (已通过其他方式实现)

**说明**: Next.js 15+ 中 middleware 可以被 layout 级别的认证检查替代

**当前实现**: 
- Dashboard layout 通过 `getCurrentUserAction()` 获取用户信息
- 各 Server Action 都有 `auth()` 检查

**建议**: 当前实现是合理的，可以在 dashboard layout 中添加未登录重定向：

```typescript
// src/app/(dashboard)/layout.tsx
const user = await getCurrentUserAction()
if (!user) {
    redirect("/login")
}
```

#### 2.2 密码策略过于简单

**位置**: 多处密码验证

**问题**: 密码只要求最少 6 位，没有复杂度要求

**建议**:
- 要求至少 8 位
- 包含大小写字母、数字
- 可选：特殊字符

#### 2.3 Rate Limiter 内存存储 (家庭系统可接受)

**位置**: `src/lib/rate-limiter.ts`

**说明**: 
- 使用内存 Map 存储，对于家庭小系统单实例部署是合适的
- 5分钟窗口 + 10次尝试的限制已经足够防止暴力破解

**当前实现已足够**: 不需要引入 Redis 等额外依赖

#### 2.4 审计日志缺少 IP 地址记录

**位置**: 大部分 action 调用 `logAudit` 时未传递 `ipAddress`

**建议**: 统一获取并记录客户端 IP

### 3. 低风险问题

#### 3.1 敏感信息日志输出

**位置**: 多处 `console.error` 和 `console.log`

**问题**: 生产环境可能泄露敏感信息

**建议**: 使用结构化日志库，区分环境

#### 3.2 数据库连接字符串

**位置**: `src/db/index.ts`

```typescript
const sql = neon(process.env.DATABASE_URL!);
```

**问题**: 使用 `!` 断言，如果环境变量未设置会导致运行时错误

**建议**: 添加启动时检查

#### 3.3 AUTH_SECRET 未验证

**问题**: 未检查 `AUTH_SECRET` 是否设置且足够强

**建议**: 启动时验证环境变量

---

## 二、代码优化建议

### 1. 架构优化

#### 1.1 重复的权限检查逻辑

**问题**: 多个 action 文件中重复实现 `isAdmin()` 检查

**位置**: 
- `src/actions/config-actions.ts`
- `src/actions/audit-actions.ts`

**建议**: 统一使用 `src/lib/action-utils.ts` 中的 `adminAction` wrapper

#### 1.2 数据库查询优化

**问题**: 部分查询可以合并或使用事务

**示例**: `updateBalanceAction` 中多次查询可以优化

```typescript
// 当前：3次查询
const account = await db.query.bankAccounts.findFirst(...)
const currentUser = await db.query.users.findFirst(...)
// 更新...

// 优化：使用 JOIN 或事务
```

#### 1.3 类型安全改进

**问题**: 部分地方使用 `any` 类型

**位置**: `src/actions/snapshot-actions.ts` 多处 `as any`

**建议**: 定义明确的类型接口

### 2. 性能优化

#### 2.1 N+1 查询问题

**位置**: `src/actions/snapshot-actions.ts` - `seedHistoricalSnapshots`

```typescript
for (const user of targetUsers) {
    const accounts = await db.query.bankAccounts.findMany(...)  // N次查询
}
```

**建议**: 批量查询后在内存中分组

#### 2.2 缓存策略

**问题**: 汇率等数据每次都查询数据库

**建议**: 
- 使用 Next.js 的 `unstable_cache` 或 React `cache`
- 当前汇率已有 6 小时缓存机制，对家庭系统足够

#### 2.3 分页优化

**问题**: 审计日志分页使用 offset，大数据量时性能差

**建议**: 使用游标分页 (cursor-based pagination)

### 3. 代码质量

#### 3.1 错误处理不一致

**问题**: 有些地方返回 `{ error: string }`，有些返回 `null`

**建议**: 统一错误处理模式，使用 Result 类型

```typescript
type Result<T> = { success: true; data: T } | { success: false; error: string }
```

#### 3.2 魔法数字

**问题**: 代码中有硬编码的数字

```typescript
const CACHE_DURATION = 6 * 60 * 60 * 1000 // 应该放到常量文件
Math.round(data.balance * 100) // 100 是什么？
```

**建议**: 提取到 `src/lib/constants.ts`

#### 3.3 缺少输入验证

**问题**: 部分 action 缺少 Zod 验证

**示例**: `updateUserRoleAction` 没有验证 role 参数

---

## 三、功能增强建议

### 1. 安全功能

#### 1.1 登录设备管理
- 记录登录设备信息
- 允许用户查看和撤销活跃会话

#### 1.2 密码历史
- 防止用户重复使用最近的密码

#### 1.3 账户锁定
- 连续登录失败后临时锁定账户

#### 1.4 安全日志通知
- 异常登录时发送邮件/通知

### 2. 业务功能

#### 2.1 数据导入功能
- 当前只有导出，缺少导入
- 支持 CSV/Excel 导入账户数据

#### 2.2 预算管理
- 设置月度/年度预算
- 预算超支提醒

#### 2.3 账户分类/标签
- 支持自定义标签
- 按标签筛选和统计

#### 2.4 多币种汇总
- 仪表盘显示各币种总额
- 支持自定义基准货币

#### 2.5 定期报告
- 周报/月报自动生成
- 邮件发送报告

#### 2.6 目标追踪
- 设置储蓄目标
- 进度可视化

### 3. 用户体验

#### 3.1 深色模式
- 已有 theme-provider，但需完善

#### 3.2 移动端优化
- 响应式布局改进
- PWA 支持

#### 3.3 数据可视化增强
- 更多图表类型
- 自定义时间范围

#### 3.4 批量操作
- 批量更新余额
- 批量删除账户

#### 3.5 搜索功能
- 全局搜索账户
- 搜索历史记录

### 4. 系统功能

#### 4.1 API 接口
- 提供 REST API 供第三方集成
- API Key 管理

#### 4.2 Webhook
- 余额变动通知
- 到期提醒 webhook

#### 4.3 数据备份
- 自动定期备份
- 备份恢复功能

#### 4.4 多语言支持
- i18n 国际化
- 支持英文界面

---

## 四、优先级建议

### 立即修复 (P0)
1. 2FA 临时 token 安全漏洞
2. 添加 middleware 路由保护

### 短期改进 (P1)
1. 密码策略增强（可选）
2. 统一权限检查逻辑
3. Dashboard layout 添加未登录重定向

### 中期优化 (P2)
1. 数据库查询优化
2. 缓存策略
3. 错误处理统一
4. 类型安全改进

### 长期功能 (P3)
1. 数据导入功能
2. 预算管理
3. 定期报告
4. API 接口

---

## 总结

这个项目整体架构合理，使用了现代化的技术栈。作为家庭小系统，当前的安全措施（内存 rate limiter、内存 2FA pending）是合适的，不需要引入 Redis 等额外依赖。

**唯一需要立即修复的问题**是 2FA 临时 token 中存储明文密码的安全漏洞。

代码质量良好，有一些重复逻辑可以优化。功能上可以考虑添加数据导入、预算管理等实用功能来增强产品价值。
