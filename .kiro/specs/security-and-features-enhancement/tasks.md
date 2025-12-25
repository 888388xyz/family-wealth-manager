# Implementation Plan: 安全性加固与功能增强

## Overview

本实现计划将系统增强分为四个阶段：Bug修复、安全性加固、数据可视化、通知提醒。每个阶段包含可独立执行的任务。

## Tasks

### Phase 0: Bug 修复与 UI 改进

- [x] 1. 账户表格中文化和样式修复
  - [x] 1.1 修改表头为中文
    - 将 "Owner" 改为 "所有者"
    - 将 "Bank" 改为 "平台"
    - 将 "Name" 改为 "产品名称"
    - 将 "Type" 改为 "产品类型"
    - 将 "Currency" 改为 "币种"
    - 将 "Balance" 改为 "余额"
    - 将 "Yield" 改为 "预期收益"
    - 将 "Actions" 改为 "操作"
    - _Requirements: 0.1.1-0.1.8_
  - [x] 1.2 修复人民币货币符号
    - 修改 getCurrencySymbol 函数，将 CNY 的返回值从 "Y" 改为 "¥"
    - _Requirements: 0.2.1, 0.2.2_
  - [ ]* 1.3 编写货币符号属性测试
    - **Property 1: 货币符号正确性**
    - **Validates: Requirements 0.2.1, 0.2.2**

- [x] 2. 仪表面板名称和布局修改
  - [x] 2.1 修改导航和页面标题
    - 将侧边栏 "仪表盘" 改为 "仪表面板"
    - 将 Dashboard 页面标题改为 "仪表面板"
    - _Requirements: 0.3.1, 0.3.2_
  - [x] 2.2 移除最新变动账户模块
    - 从 Dashboard 页面移除 "最新变动账户" 卡片
    - _Requirements: 0.4.1, 0.4.2_

- [x] 3. 筛选结果外币折算修复
  - [x] 3.1 修改账户表格筛选合计逻辑
    - 获取当前汇率数据
    - 将外币账户余额按汇率折算为人民币
    - 显示折算后的合计金额，标注 "(折算CNY)"
    - _Requirements: 0.6.1, 0.6.2, 0.6.3_
  - [ ]* 3.2 编写外币折算属性测试
    - **Property 7: 筛选结果外币折算**
    - **Validates: Requirements 0.6.1, 0.6.2**

- [x] 4. 用户信息和版本号显示
  - [x] 4.1 创建用户信息组件
    - 在侧边栏底部显示当前登录用户名称
    - 显示用户昵称，无昵称则显示邮箱
    - 添加退出登录按钮
    - _Requirements: 0.7.1, 0.7.2, 0.7.3_
  - [x] 4.2 显示系统版本号
    - 从 package.json 读取版本号
    - 在侧边栏底部显示 "v0.1.0" 格式的版本号
    - _Requirements: 0.8.1, 0.8.2, 0.8.3_

- [x] 5. Checkpoint - Bug 修复验证
  - 验证表头中文化完成
  - 验证货币符号显示正确
  - 验证仪表面板名称修改
  - 验证筛选合计金额正确折算
  - 验证用户信息和版本号显示
  - 如有问题请询问用户

### Phase 1: 安全性加固

- [x] 6. 数据库 Schema 扩展
  - [x] 6.1 创建审计日志表
    - 添加 audit_logs 表到 schema.ts
    - 包含字段：id, userId, action, targetType, targetId, details, ipAddress, createdAt
    - 运行 drizzle-kit push 更新数据库
    - _Requirements: 1.3.1_

- [x] 7. 权限漏洞修复
  - [x] 7.1 修复 updateBalanceAction 权限检查
    - 添加账户所有权验证
    - 管理员可以更新任何账户
    - 非所有者非管理员返回权限错误
    - _Requirements: 1.1.1, 1.1.2, 1.1.3_
  - [x] 7.2 修复 getAccountHistoryAction 权限检查
    - 添加账户所有权验证
    - 管理员可以查看任何账户历史
    - 非所有者非管理员返回空结果
    - _Requirements: 1.2.1, 1.2.2, 1.2.3_
  - [ ]* 7.3 编写权限控制属性测试
    - **Property 2: 余额更新权限控制**
    - **Property 3: 账户历史查询权限控制**
    - **Validates: Requirements 1.1.1-1.1.3, 1.2.1-1.2.3**

- [x] 8. 审计日志功能
  - [x] 8.1 创建审计日志工具库
    - 创建 src/lib/audit-logger.ts
    - 实现 logAudit 函数
    - 定义 AuditAction 类型
    - _Requirements: 1.3.2, 1.3.3_
  - [x] 8.2 在敏感操作中添加审计日志
    - 登录成功/失败记录
    - 账户创建/更新/删除记录
    - 余额更新记录
    - 用户管理操作记录
    - _Requirements: 1.3.2_
  - [x] 8.3 创建审计日志查看页面
    - 创建 /audit-logs 页面（仅管理员可访问）
    - 显示可筛选和分页的日志列表
    - _Requirements: 1.3.4, 1.3.5_
  - [ ]* 8.4 编写审计日志属性测试
    - **Property 4: 审计日志完整性**
    - **Validates: Requirements 1.3.2, 1.3.3**

- [x] 9. 请求频率限制
  - [x] 9.1 创建频率限制器
    - 创建 src/lib/rate-limiter.ts
    - 实现 RateLimiter 类
    - 使用内存存储（Map）
    - _Requirements: 1.4.1, 1.5.1_
  - [x] 9.2 实现登录频率限制
    - 在登录逻辑中集成限制器
    - 5分钟内最多10次尝试
    - 超限返回错误信息
    - 登录成功重置计数
    - _Requirements: 1.4.1, 1.4.2, 1.4.3_
  - [ ]* 9.3 编写频率限制属性测试
    - **Property 5: 登录频率限制**
    - **Property 6: 登录成功重置计数**
    - **Validates: Requirements 1.4.1, 1.4.2, 1.4.3**

- [x] 10. Checkpoint - 安全性验证
  - 验证权限检查正常工作
  - 验证审计日志记录完整
  - 验证频率限制生效
  - 如有问题请询问用户

### Phase 2: 数据可视化增强

- [x] 11. 安装图表库和创建基础组件
  - [x] 11.1 安装 Recharts
    - 运行 pnpm add recharts
    - 添加必要的类型定义
  - [x] 11.2 创建饼图组件
    - 创建 src/components/charts/pie-chart.tsx
    - 支持点击事件回调
    - 显示百分比和数值
    - _Requirements: 0.5.5, 0.5.6_

- [x] 12. 仪表面板饼图改造
  - [x] 12.1 将币种分布改为饼图
    - 替换现有的列表展示
    - 添加点击跳转功能
    - _Requirements: 0.5.1, 0.5.4_
  - [x] 12.2 将平台分布改为饼图
    - 替换现有的列表展示
    - 添加点击跳转功能
    - _Requirements: 0.5.2, 0.5.4_
  - [x] 12.3 将资产类型分布改为饼图
    - 替换现有的列表展示
    - 添加点击跳转功能
    - _Requirements: 0.5.3, 0.5.4_

- [x] 13. 资产趋势图表
  - [x] 13.1 创建每日快照表和定时任务
    - 添加 daily_snapshots 表到 schema.ts
    - 创建记录每日快照的 action
    - _Requirements: 2.1.2_
  - [x] 13.2 创建趋势折线图组件
    - 创建 src/components/charts/line-chart.tsx
    - 支持时间范围切换（30天/90天/1年）
    - 支持 hover 显示具体数值
    - _Requirements: 2.1.1, 2.1.3, 2.1.5_
  - [x] 13.3 在仪表面板添加趋势图表
    - 集成折线图组件
    - 添加时间范围选择器
    - _Requirements: 2.1.1, 2.1.3, 2.1.4_

- [x] 14. 收益分析和历史对比
  - [x] 14.1 添加收益分析卡片
    - 计算加权平均收益率
    - 显示预期月收益和年收益
    - _Requirements: 2.2.1, 2.2.2, 2.2.3, 2.2.4_
  - [x] 14.2 添加历史对比功能
    - 显示与上月对比
    - 显示与去年同期对比
    - 使用颜色区分增减
    - _Requirements: 2.3.1, 2.3.2, 2.3.3, 2.3.4_

- [x] 15. Checkpoint - 可视化验证
  - 验证饼图显示正确
  - 验证点击跳转功能
  - 验证趋势图表数据
  - 如有问题请询问用户

### Phase 3: 通知与提醒

- [x] 16. 通知系统基础设施
  - [x] 16.1 创建通知表
    - 添加 notifications 表到 schema.ts
    - 运行 drizzle-kit push 更新数据库
    - _Requirements: 3.1.1_
  - [x] 16.2 创建通知 actions
    - 创建 src/actions/notification-actions.ts
    - 实现创建、获取、标记已读功能
    - _Requirements: 3.1.4, 3.1.5_
  - [x] 16.3 创建通知 UI 组件
    - 创建通知铃铛图标组件
    - 显示未读数量徽章
    - 创建通知下拉列表
    - _Requirements: 3.1.2, 3.1.3_

- [-] 17. 余额变动提醒 (已跳过)
  - [-] 17.1 实现余额变动检测 (已跳过)
    - 在 updateBalanceAction 中添加变动检测
    - 计算变动百分比和金额
    - 超过阈值时创建通知
    - _Requirements: 3.2.1, 3.2.2_
  - [-]* 17.2 编写余额变动通知属性测试 (已跳过)
    - **Property 8: 余额变动通知触发**
    - **Validates: Requirements 3.2.1**

- [x] 18. 定期理财到期提醒
  - [x] 18.1 添加到期日期字段
    - 在 bank_account 表添加 maturityDate 字段
    - 在账户编辑对话框添加到期日期输入
    - _Requirements: 3.3.1, 3.3.2_
  - [x] 18.2 实现到期检查和提醒
    - 创建检查即将到期账户的函数
    - 7天前和1天前发送提醒
    - _Requirements: 3.3.3, 3.3.4, 3.3.5_
  - [ ]* 18.3 编写到期提醒属性测试
    - **Property 9: 到期提醒通知**
    - **Validates: Requirements 3.3.3, 3.3.4**

- [x] 19. Final Checkpoint - 全面验证
  - 验证所有 Bug 修复完成
  - 验证安全性功能正常
  - 验证图表显示正确
  - 验证通知系统工作
  - 如有问题请询问用户

## Notes

- 任务标记 `*` 的为可选测试任务，可跳过以加快 MVP 开发
- 每个 Phase 结束后有 Checkpoint，确保阶段性功能完整
- 建议按 Phase 顺序执行，Phase 0 的 Bug 修复优先级最高
- 数据库 Schema 变更需要运行 `pnpm exec drizzle-kit push`
- 图表库使用 Recharts，需要先安装依赖
