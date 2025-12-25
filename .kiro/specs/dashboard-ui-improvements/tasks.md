# Implementation Plan: Dashboard UI Improvements v0.3.0

## Overview

本实现计划将按照以下顺序完成：数据库变更 → 核心功能实现 → UI 组件更新 → 版本升级。

## Tasks

- [x] 1. 数据库 Schema 更新
  - [x] 1.1 添加 2FA 相关字段到 users 表
    - 添加 `twoFactorSecret` (text, nullable) 字段
    - 添加 `twoFactorEnabled` (boolean, default false) 字段
    - 运行 drizzle-kit push 更新数据库
    - _Requirements: 3.8_

- [-] 2. TOTP 工具函数实现
  - [x] 2.1 创建 TOTP 工具模块
    - 安装 otplib 依赖
    - 创建 `src/lib/totp.ts` 文件
    - 实现 `generateSecret()` 函数
    - 实现 `generateQRCodeUrl(secret, email)` 函数
    - 实现 `verifyTOTP(secret, code)` 函数
    - _Requirements: 3.1_
  - [ ]* 2.2 编写 TOTP 往返验证属性测试
    - **Property 1: TOTP Round Trip Verification**
    - **Validates: Requirements 3.1, 3.4**
  - [ ]* 2.3 编写 TOTP 无效码拒绝属性测试
    - **Property 2: TOTP Invalid Code Rejection**
    - **Validates: Requirements 3.6**

- [x] 3. 两步验证 Server Actions
  - [x] 3.1 实现 2FA 相关 Server Actions
    - 在 `src/actions/settings-actions.ts` 添加 `generate2FASecretAction()`
    - 添加 `enable2FAAction(code)` 验证并启用 2FA
    - 添加 `disable2FAAction(password)` 禁用 2FA
    - 添加 `get2FAStatusAction()` 获取 2FA 状态
    - _Requirements: 3.2, 3.3, 3.4_

- [x] 4. 登录流程 2FA 集成
  - [x] 4.1 修改认证逻辑支持 2FA
    - 修改 `src/auth.ts` 的 authorize 函数
    - 添加 2FA 状态检查
    - 创建 `src/actions/auth-actions.ts` 的 `verifyTOTPAction()`
    - _Requirements: 3.5, 3.6, 3.7_
  - [x] 4.2 修改 LoginForm 组件支持 2FA
    - 添加 TOTP 输入步骤
    - 处理 `requires2FA` 响应
    - 显示 TOTP 验证错误
    - _Requirements: 3.5, 3.6_

- [x] 5. 两步验证设置 UI
  - [x] 5.1 创建 TwoFactorSetup 组件
    - 创建 `src/components/settings/two-factor-setup.tsx`
    - 实现启用 2FA 流程（显示 QR 码、验证码输入）
    - 实现禁用 2FA 流程（密码确认）
    - 显示当前 2FA 状态
    - _Requirements: 3.2, 3.3, 3.4_
  - [x] 5.2 集成到设置页面
    - 修改 `src/components/settings/settings-form.tsx`
    - 添加 TwoFactorSetup 组件
    - _Requirements: 3.2_

- [x] 6. Checkpoint - 两步验证功能完成
  - 确保所有 2FA 相关测试通过
  - 手动测试 2FA 启用/禁用/登录流程
  - 如有问题请告知

- [x] 7. 账户克隆功能
  - [x] 7.1 创建克隆数据预填充工具函数
    - 创建 `src/lib/account-utils.ts`
    - 实现 `createCloneData(account)` 函数
    - _Requirements: 5.3, 5.4_
  - [ ]* 7.2 编写克隆预填充正确性属性测试
    - **Property 3: Clone Pre-fill Correctness**
    - **Validates: Requirements 5.3, 5.4**
  - [x] 7.3 修改 AddAccountDialog 支持克隆
    - 添加 `cloneFrom` 属性
    - 使用预填充数据初始化表单
    - _Requirements: 5.2, 5.3, 5.4_
  - [x] 7.4 修改 AccountTable 添加克隆按钮
    - 在操作列添加克隆按钮
    - 点击时打开预填充的 AddAccountDialog
    - _Requirements: 5.1, 5.2, 5.5_

- [x] 8. 仪表面板 UI 简化
  - [x] 8.1 移除平均余额卡片
    - 修改 `src/app/(dashboard)/dashboard/page.tsx`
    - 删除平均余额卡片代码
    - 调整网格布局为 3 列
    - _Requirements: 1.1, 1.2_
  - [x] 8.2 移除标题和副标题
    - 删除 "仪表面板" 标题
    - 删除 "家庭资产总览" 副标题
    - 保留管理员视图徽章
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 8.3 移除趋势分析组件
    - 从仪表面板移除 TrendChart 组件
    - 移除 YieldAnalysis 组件
    - 移除 HistoricalComparison 组件
    - _Requirements: 2.5_

- [x] 9. 创建趋势分析页面
  - [x] 9.1 创建趋势分析页面
    - 创建 `src/app/(dashboard)/trends/page.tsx`
    - 添加 TrendChart 组件
    - 添加 YieldAnalysis 组件
    - 添加 HistoricalComparison 组件
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 9.2 确保侧边栏不显示趋势页面链接
    - 验证 AppSidebar 不包含 `/trends` 链接
    - _Requirements: 2.6_

- [x] 10. 版本升级
  - [x] 10.1 更新版本号
    - 修改 `src/components/app-sidebar.tsx` 版本号为 "0.3.0"
    - _Requirements: 6.1_
  - [x] 10.2 更新 README 文档
    - 添加 v0.3.0 版本说明
    - 记录新功能：2FA、账户克隆、UI 简化
    - _Requirements: 6.2_

- [x] 11. Final Checkpoint - 全部功能完成
  - 确保所有测试通过
  - 验证所有功能正常工作
  - 如有问题请告知

## Notes

- 标记 `*` 的任务为可选测试任务，可跳过以加快 MVP 开发
- 每个任务引用具体需求以便追溯
- Checkpoint 任务用于阶段性验证
- 属性测试验证核心正确性属性
