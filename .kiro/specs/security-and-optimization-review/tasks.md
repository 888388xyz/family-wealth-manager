# Implementation Plan: 安全与优化改进

## Overview

本任务列表包含三个主要改进：
1. 修复 2FA 临时 token 安全漏洞（P0 - 必须）
2. 统一权限检查逻辑（P1 - 推荐）
3. Dashboard Layout 添加未登录重定向（P1 - 推荐）

## Tasks

- [x] 1. 修复 2FA 安全漏洞
  - [x] 1.1 创建 pending_2fa_sessions 数据库表
    - 在 `src/db/schema.ts` 添加 `pending2FASessions` 表定义
    - 包含字段：id, userId, token, expiresAt, createdAt
    - 添加外键关联到 users 表
    - _Requirements: 1.1_

  - [x] 1.2 生成数据库迁移并执行
    - 运行 `npx drizzle-kit generate` 生成迁移文件
    - 运行 `npx drizzle-kit push` 应用到数据库
    - _Requirements: 1.1_

  - [x] 1.3 修改 loginAction 函数
    - 移除 Base64 编码密码的 tempToken 生成逻辑
    - 改为生成随机 UUID 作为 sessionToken
    - 将 sessionToken 和 userId 存入 pending_2fa_sessions 表
    - 设置 5 分钟过期时间
    - _Requirements: 1.1_

  - [x] 1.4 修改 verifyTOTPAction 函数
    - 从数据库查询 pending session 而非解码 token
    - 验证 session 是否过期
    - 验证 TOTP 码
    - 成功后删除 pending session
    - 使用 NextAuth 创建真正的登录 session
    - _Requirements: 1.1_

  - [x] 1.5 添加过期 session 清理逻辑
    - 在 verifyTOTPAction 中顺便清理过期记录
    - 或在查询时过滤过期记录
    - _Requirements: 1.1_

  - [ ]* 1.6 编写单元测试
    - 测试 session token 生成格式
    - 测试过期 session 被拒绝
    - 测试成功验证后 session 被删除
    - _Requirements: 1.1_

- [x] 2. Checkpoint - 确保 2FA 修复完成
  - 确保所有测试通过，如有问题请询问用户

- [x] 3. 统一权限检查逻辑
  - [x] 3.1 重构 config-actions.ts
    - 移除本地 `isAdmin()` 函数
    - 导入 `adminAction` from `@/lib/action-utils`
    - 修改 `addBankAction` 使用 adminAction wrapper
    - 修改 `deleteBankAction` 使用 adminAction wrapper
    - 修改 `addProductTypeAction` 使用 adminAction wrapper
    - 修改 `deleteProductTypeAction` 使用 adminAction wrapper
    - 修改 `addCurrencyAction` 使用 adminAction wrapper
    - 修改 `deleteCurrencyAction` 使用 adminAction wrapper
    - 修改 `initializeConfigAction` 使用 adminAction wrapper
    - _Requirements: 1.1 (代码质量)_

  - [x] 3.2 重构 audit-actions.ts
    - 移除本地 `isAdmin()` 函数
    - 导入 `adminAction` from `@/lib/action-utils`
    - 修改 `getAuditLogsAction` 使用 adminAction wrapper
    - 修改 `getAuditActionsAction` 使用 adminAction wrapper
    - 修改 `getAuditTargetTypesAction` 使用 adminAction wrapper
    - _Requirements: 1.1 (代码质量)_

- [x] 4. Dashboard Layout 添加未登录重定向
  - [x] 4.1 修改 dashboard layout
    - 在 `src/app/(dashboard)/layout.tsx` 添加未登录检查
    - 如果 `getCurrentUserAction()` 返回 null，重定向到 `/login`
    - _Requirements: 2.1_

- [x] 5. Final Checkpoint - 确保所有改进完成
  - 确保所有测试通过
  - 验证 2FA 登录流程正常工作
  - 验证管理员功能正常工作
  - 验证未登录访问 dashboard 会重定向

## Notes

- 任务 1 是安全修复，必须完成
- 任务 3、4 是代码优化，推荐完成
- 标记 `*` 的任务是可选的测试任务
- 每个 checkpoint 用于验证阶段性成果
