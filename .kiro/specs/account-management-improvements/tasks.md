# Implementation Plan: 账户管理功能改进

## Overview

本实现计划将账户管理功能改进分解为可执行的任务，包括：添加账户编辑功能、界面中文化、表格样式美化、以及登录页面品牌统一。

## Tasks

- [-] 1. 添加账户更新服务端操作
  - [x] 1.1 在 account-actions.ts 中添加 updateAccountAction 函数
    - 添加 updateAccountSchema 验证模式
    - 实现权限检查（只能编辑自己的账户）
    - 更新账户的 bankName、accountName、productType、currency、expectedYield、notes 字段
    - _Requirements: 1.2, 1.5, 1.6, 5.5_
  - [ ]* 1.2 编写 updateAccountAction 的属性测试
    - **Property 1: 账户更新数据一致性**
    - **Property 2: 权限控制 - 用户只能编辑自己的账户**
    - **Property 5: 输入验证错误处理**
    - **Validates: Requirements 1.2, 1.5, 1.6, 5.5, 5.6**

- [x] 2. 创建账户编辑对话框组件
  - [x] 2.1 创建 edit-account-dialog.tsx 组件
    - 接收账户数据、平台列表、产品类型列表、货币列表作为 props
    - 显示表单字段：平台、产品名称、产品类型、币种、预期收益率、备注
    - 不包含余额字段
    - 使用中文标签和按钮文本
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 2.5_
  - [ ]* 2.2 编写编辑对话框的属性测试
    - **Property 4: 编辑对话框默认值正确性**
    - **Validates: Requirements 5.1**

- [x] 3. 修改账户表格组件
  - [x] 3.1 中文化表格文本
    - 修改表头为中文：所有者、平台、产品名称、产品类型、币种、余额、预期收益、操作
    - 修改筛选器标签为中文：所有平台、所有类型、全部、所有用户
    - 修改搜索框占位符为"搜索..."
    - 修改空状态提示为中文
    - 修改删除确认提示为中文
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.1, 7.2_
  - [x] 3.2 移除更新时间列
    - 从表头移除 Updated 列
    - 从表格行移除更新时间单元格
    - 从排序选项中移除 updatedAt
    - _Requirements: 3.1, 3.3_
  - [x] 3.3 添加编辑图标按钮
    - 在删除图标前添加编辑图标（Settings2 或 Pencil）
    - 点击编辑图标打开 EditAccountDialog
    - 传递必要的数据（账户信息、配置列表）
    - _Requirements: 1.1, 1.3_
  - [x] 3.4 美化表头样式
    - 为 TableHeader 添加背景色 (bg-muted/50)
    - 为 TableHead 添加加粗字体 (font-semibold)
    - 确保表头与内容有明显视觉区分
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 4. 更新账户页面
  - [x] 4.1 修改 accounts/page.tsx 传递额外数据
    - 获取并传递 banks 列表到 AccountTable
    - 获取并传递 currencies 列表到 AccountTable
    - _Requirements: 1.1_

- [x] 5. 修改登录页面品牌名称
  - [x] 5.1 将登录页面的 "Wealth Manager" 改为 "家庭财富管家"
    - _Requirements: 6.1, 6.2_

- [x] 6. Checkpoint - 功能验证
  - 确保所有测试通过
  - 验证编辑功能正常工作
  - 验证中文化完整
  - 验证表格样式美化效果
  - 如有问题请询问用户

## Notes

- 任务标记 `*` 的为可选测试任务，可跳过以加快 MVP 开发
- 每个任务都引用了具体的需求编号以便追溯
- 余额编辑功能保持现有的内联编辑方式不变
- 数据库中的 updatedAt 字段由 Drizzle ORM 自动更新，无需额外代码
