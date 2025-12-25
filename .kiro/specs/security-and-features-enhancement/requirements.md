# Requirements Document

## Introduction

本文档定义了家庭财富管理系统的全面增强需求，分为三个主要模块：
1. **安全性加固** - 修复权限漏洞、添加审计日志、实现请求频率限制
2. **数据可视化增强** - 资产趋势图表、收益分析、历史对比
3. **通知与提醒** - 余额变动提醒、定期理财到期提醒

## Glossary

- **System**: 家庭财富管理系统
- **Audit_Log**: 审计日志，记录系统中的敏感操作
- **Rate_Limiter**: 请求频率限制器，防止暴力攻击和滥用
- **Balance_History**: 余额历史记录，用于生成趋势图表
- **Notification**: 系统通知，用于提醒用户重要事件
- **Dashboard**: 仪表盘页面，展示资产概览和图表

---

## Part 0: Bug 修复

### Requirement 0.1: 账户管理表头中文化

**User Story:** 作为中文用户，我希望账户管理表格的表头显示中文，以便更好地理解各列含义。

#### Acceptance Criteria

1. THE Account_Table SHALL 将表头 "Owner" 改为 "所有者"
2. THE Account_Table SHALL 将表头 "Bank" 改为 "平台"
3. THE Account_Table SHALL 将表头 "Name" 改为 "产品名称"
4. THE Account_Table SHALL 将表头 "Type" 改为 "产品类型"
5. THE Account_Table SHALL 将表头 "Currency" 改为 "币种"
6. THE Account_Table SHALL 将表头 "Balance" 改为 "余额"
7. THE Account_Table SHALL 将表头 "Yield" 改为 "预期收益"
8. THE Account_Table SHALL 将表头 "Actions" 改为 "操作"

### Requirement 0.2: 人民币货币符号修复

**User Story:** 作为用户，我希望人民币金额显示正确的货币符号 "¥"，而不是 "Y"。

#### Acceptance Criteria

1. WHEN 显示人民币金额 THEN THE System SHALL 使用 "¥" 符号而非 "Y"
2. THE getCurrencySymbol 函数 SHALL 返回 "¥" 作为 CNY 的货币符号

### Requirement 0.3: 仪表盘名称修改

**User Story:** 作为用户，我希望导航栏和页面标题使用"仪表面板"而非"仪表盘"，以保持术语一致性。

#### Acceptance Criteria

1. THE 侧边栏导航 SHALL 显示 "仪表面板" 而非 "仪表盘"
2. THE Dashboard 页面标题 SHALL 显示 "仪表面板" 而非 "仪表盘"

### Requirement 0.4: 移除最新变动账户模块

**User Story:** 作为用户，我希望仪表面板更加简洁，不需要显示最新变动账户列表。

#### Acceptance Criteria

1. THE Dashboard SHALL 移除"最新变动账户"卡片模块
2. THE Dashboard SHALL 保留其他统计卡片和分布图表

### Requirement 0.5: 分布图表改为饼图并支持点击跳转

**User Story:** 作为用户，我希望通过饼图直观地查看资产分布，并能点击跳转到对应的账户列表。

#### Acceptance Criteria

1. THE Dashboard SHALL 将"币种分布"改为饼图展示
2. THE Dashboard SHALL 将"银行/平台分布"改为饼图展示
3. THE Dashboard SHALL 将"资产类型分布"改为饼图展示
4. WHEN 用户点击饼图中的某个扇区 THEN THE System SHALL 跳转到账户管理页面并自动筛选对应类别
5. THE 饼图 SHALL 显示各分类的百分比和金额
6. THE 饼图 SHALL 使用不同颜色区分各分类

### Requirement 0.6: 筛选后合计金额外币折算修复

**User Story:** 作为用户，我希望账户列表筛选后显示的合计金额能正确将外币折算为人民币，以便准确了解筛选结果的总资产。

#### Acceptance Criteria

1. WHEN 账户列表应用筛选条件后 THEN THE System SHALL 将所有外币账户余额按当前汇率折算为人民币
2. THE 筛选结果合计 SHALL 显示折算后的人民币总额
3. THE System SHALL 在合计金额旁标注"(折算CNY)"以明确显示的是折算后金额

### Requirement 0.7: 显示登录用户名

**User Story:** 作为用户，我希望在界面上看到当前登录的用户名，以便确认登录状态。

#### Acceptance Criteria

1. THE 侧边栏底部 SHALL 显示当前登录用户的名称
2. THE System SHALL 显示用户的昵称，如果没有昵称则显示邮箱
3. THE 用户信息区域 SHALL 包含退出登录按钮

### Requirement 0.8: 显示系统版本号

**User Story:** 作为用户，我希望看到系统的版本号，以便了解当前使用的版本。

#### Acceptance Criteria

1. THE 侧边栏底部 SHALL 显示系统版本号
2. THE 版本号 SHALL 从 package.json 中读取
3. THE 版本号格式 SHALL 为 "v0.1.0" 形式

---

## Part 1: 安全性加固

### Requirement 1.1: 修复余额更新权限漏洞

**User Story:** 作为系统管理员，我希望确保用户只能更新自己账户的余额，以防止未授权的数据修改。

#### Acceptance Criteria

1. WHEN 用户调用 updateBalanceAction THEN THE System SHALL 验证该账户属于当前登录用户
2. WHEN 用户尝试更新非自己账户的余额 THEN THE System SHALL 拒绝操作并返回"无权修改他人账户余额"错误
3. WHEN 管理员尝试更新其他用户账户的余额 THEN THE System SHALL 允许操作（管理员特权）
4. THE System SHALL 在更新余额前记录操作到审计日志

### Requirement 1.2: 修复账户历史查询权限漏洞

**User Story:** 作为系统管理员，我希望确保用户只能查看自己账户的历史记录，以保护用户隐私。

#### Acceptance Criteria

1. WHEN 用户调用 getAccountHistoryAction THEN THE System SHALL 验证该账户属于当前登录用户
2. WHEN 用户尝试查看非自己账户的历史 THEN THE System SHALL 返回空结果或权限错误
3. WHEN 管理员查询账户历史 THEN THE System SHALL 允许查看所有账户的历史记录

### Requirement 1.3: 审计日志功能

**User Story:** 作为系统管理员，我希望记录所有敏感操作的审计日志，以便追踪和审查系统活动。

#### Acceptance Criteria

1. THE System SHALL 创建 audit_logs 数据表，包含字段：id、userId、action、targetType、targetId、details、ipAddress、createdAt
2. WHEN 用户执行以下操作时 THEN THE System SHALL 记录审计日志：
   - 登录成功/失败
   - 创建/更新/删除账户
   - 更新余额
   - 创建/删除用户
   - 修改用户角色
   - 重置密码
3. THE Audit_Log SHALL 记录操作用户ID、操作类型、目标对象、操作详情和时间戳
4. WHEN 管理员访问审计日志页面 THEN THE System SHALL 显示可筛选和分页的日志列表
5. THE System SHALL 仅允许管理员查看审计日志

### Requirement 1.4: 登录请求频率限制

**User Story:** 作为系统管理员，我希望限制登录尝试频率，以防止暴力破解攻击。

#### Acceptance Criteria

1. THE System SHALL 限制同一IP地址在5分钟内最多尝试登录10次
2. WHEN 登录尝试超过限制 THEN THE System SHALL 返回"登录尝试过于频繁，请5分钟后再试"错误
3. WHEN 登录成功 THEN THE System SHALL 重置该IP的失败计数
4. THE Rate_Limiter SHALL 使用内存存储（可选：Redis）记录尝试次数

### Requirement 1.5: API请求频率限制

**User Story:** 作为系统管理员，我希望限制API请求频率，以防止系统滥用和DoS攻击。

#### Acceptance Criteria

1. THE System SHALL 限制每个用户每分钟最多100次API请求
2. WHEN 请求超过限制 THEN THE System SHALL 返回429状态码和"请求过于频繁"错误
3. THE System SHALL 在响应头中包含剩余请求次数和重置时间

---

## Part 2: 数据可视化增强

### Requirement 2.1: 资产趋势图表

**User Story:** 作为用户，我希望看到我的资产随时间变化的趋势图，以便了解财富增长情况。

#### Acceptance Criteria

1. THE Dashboard SHALL 显示资产趋势折线图，展示过去30天/90天/1年的总资产变化
2. THE System SHALL 每日自动记录用户的总资产快照到 daily_snapshots 表
3. WHEN 用户切换时间范围 THEN THE System SHALL 更新图表显示对应时间段的数据
4. THE 图表 SHALL 支持按币种筛选（全部/仅CNY/仅外币）
5. THE 图表 SHALL 显示数据点的具体数值（hover显示）

### Requirement 2.2: 收益分析

**User Story:** 作为用户，我希望看到我的投资收益分析，以便评估投资表现。

#### Acceptance Criteria

1. THE Dashboard SHALL 显示预期年化收益统计卡片
2. THE System SHALL 计算加权平均收益率（按余额加权）
3. THE Dashboard SHALL 按产品类型显示收益率对比柱状图
4. WHEN 账户设置了预期收益率 THEN THE System SHALL 计算预期月收益和年收益金额
5. THE System SHALL 显示收益最高和最低的账户排名

### Requirement 2.3: 历史对比

**User Story:** 作为用户，我希望对比不同时间点的资产状况，以便了解资产变化。

#### Acceptance Criteria

1. THE Dashboard SHALL 提供"与上月对比"功能，显示资产增减金额和百分比
2. THE Dashboard SHALL 提供"与去年同期对比"功能
3. WHEN 资产增加 THEN THE System SHALL 使用绿色显示增长数值
4. WHEN 资产减少 THEN THE System SHALL 使用红色显示减少数值
5. THE System SHALL 显示各银行/平台的资产变化明细

---

## Part 3: 通知与提醒

### Requirement 3.1: 系统通知基础设施

**User Story:** 作为用户，我希望在系统内收到重要通知，以便及时了解账户动态。

#### Acceptance Criteria

1. THE System SHALL 创建 notifications 数据表，包含字段：id、userId、type、title、content、isRead、createdAt
2. THE System SHALL 在导航栏显示通知图标和未读数量徽章
3. WHEN 用户点击通知图标 THEN THE System SHALL 显示通知下拉列表
4. WHEN 用户点击单条通知 THEN THE System SHALL 标记该通知为已读
5. THE System SHALL 提供"全部标记为已读"功能

### Requirement 3.2: 余额变动提醒

**User Story:** 作为用户，我希望在账户余额发生显著变动时收到通知，以便及时关注异常情况。

#### Acceptance Criteria

1. WHEN 账户余额变动超过设定阈值（默认10%或1000元）THEN THE System SHALL 创建余额变动通知
2. THE 通知 SHALL 包含账户名称、变动金额、变动百分比
3. THE System SHALL 允许用户在设置中自定义变动阈值
4. THE System SHALL 允许用户选择开启或关闭余额变动提醒

### Requirement 3.3: 定期理财到期提醒

**User Story:** 作为用户，我希望在定期理财产品即将到期时收到提醒，以便及时处理到期资金。

#### Acceptance Criteria

1. THE System SHALL 在 bank_account 表中添加 maturityDate（到期日期）字段
2. WHEN 添加或编辑定期理财账户 THEN THE System SHALL 允许设置到期日期
3. WHEN 定期理财距离到期还有7天 THEN THE System SHALL 创建到期提醒通知
4. WHEN 定期理财距离到期还有1天 THEN THE System SHALL 创建紧急到期提醒通知
5. THE 通知 SHALL 包含产品名称、到期日期、当前余额
6. THE System SHALL 每日检查即将到期的理财产品并发送提醒

