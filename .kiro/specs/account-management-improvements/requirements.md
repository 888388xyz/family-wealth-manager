# Requirements Document

## Introduction

本文档定义了家庭财富管理系统的全面改进需求，包括：账户信息编辑功能、界面中文化、表格样式美化、登录页面品牌统一、以及其他用户体验优化。

## Glossary

- **Account_Table**: 账户管理表格组件，用于展示和管理用户的银行账户信息
- **Edit_Account_Dialog**: 账户编辑对话框，用于修改账户的平台、类型等信息（不包括余额）
- **Balance_Editor**: 余额编辑器，用于内联修改账户余额
- **Login_Page**: 登录页面组件
- **System**: 家庭财富管理系统

## Requirements

### Requirement 1: 账户信息编辑功能

**User Story:** 作为用户，我希望能够修改我的账户信息（如平台、产品类型等），以便在账户信息变更时进行更新。

#### Acceptance Criteria

1. WHEN 用户点击账户行的编辑图标 THEN THE System SHALL 打开账户编辑对话框，显示当前账户信息
2. WHEN 用户在编辑对话框中修改账户信息并提交 THEN THE System SHALL 更新账户的平台、产品类型、币种、预期收益率和备注字段
3. THE System SHALL 在删除图标前显示编辑图标，编辑图标用于修改账户信息
4. THE System SHALL 保持余额字段的内联编辑功能不变，不在编辑对话框中包含余额修改
5. WHEN 管理员尝试编辑其他用户的账户信息 THEN THE System SHALL 拒绝操作并返回权限错误
6. WHEN 普通用户尝试编辑其他用户的账户信息 THEN THE System SHALL 拒绝操作并返回权限错误

### Requirement 2: 界面中文化

**User Story:** 作为中文用户，我希望系统界面完全使用中文，以便更好地理解和使用系统。

#### Acceptance Criteria

1. THE Account_Table SHALL 使用中文表头，包括：所有者、平台、产品名称、产品类型、币种、余额、预期收益、操作
2. THE Account_Table SHALL 使用中文筛选器标签，包括：所有平台、所有类型、所有币种、所有用户
3. THE Account_Table SHALL 使用中文搜索框占位符文本
4. THE Account_Table SHALL 使用中文空状态提示文本
5. THE Edit_Account_Dialog SHALL 使用中文标签和按钮文本

### Requirement 3: 移除更新时间列

**User Story:** 作为用户，我希望账户列表更加简洁，更新时间等历史信息应该在专门的历史分析页面查看。

#### Acceptance Criteria

1. THE Account_Table SHALL 不显示"最后更新时间"列
2. THE System SHALL 继续在数据库中记录更新时间，用于历史分析功能
3. WHEN 筛选或排序功能使用时 THEN THE System SHALL 不包含更新时间作为排序选项

### Requirement 4: 表格样式美化

**User Story:** 作为用户，我希望表格的表头和内容有明显的视觉区分，以便更容易阅读数据。

#### Acceptance Criteria

1. THE Account_Table SHALL 使用加粗字体和背景色区分表头行
2. THE Account_Table SHALL 使用适当的字体大小区分表头和内容
3. THE Account_Table SHALL 为表头添加底部边框以增强视觉分隔
4. THE Account_Table SHALL 保持整体风格与系统设计一致

### Requirement 5: 编辑对话框设计

**User Story:** 作为用户，我希望编辑对话框清晰易用，能够方便地修改账户信息。

#### Acceptance Criteria

1. THE Edit_Account_Dialog SHALL 显示账户的当前信息作为默认值
2. THE Edit_Account_Dialog SHALL 包含以下可编辑字段：平台、产品名称、产品类型、币种、预期收益率、备注
3. THE Edit_Account_Dialog SHALL 不包含余额字段（余额通过内联编辑修改）
4. THE Edit_Account_Dialog SHALL 提供取消和保存按钮
5. WHEN 用户点击保存按钮 THEN THE System SHALL 验证输入并更新账户信息
6. WHEN 输入验证失败 THEN THE System SHALL 显示相应的错误提示

### Requirement 6: 登录页面品牌统一

**User Story:** 作为用户，我希望登录页面显示中文品牌名称，与系统其他部分保持一致。

#### Acceptance Criteria

1. THE Login_Page SHALL 显示中文品牌名称"家庭财富管家"而非英文"Wealth Manager"
2. THE Login_Page SHALL 保持与侧边栏品牌名称一致

### Requirement 7: 删除确认对话框中文化

**User Story:** 作为中文用户，我希望删除确认提示使用中文，以便清楚理解操作后果。

#### Acceptance Criteria

1. WHEN 用户点击删除账户按钮 THEN THE System SHALL 显示中文确认提示"确定要删除此账户吗？"
2. THE System SHALL 在确认对话框中使用中文按钮文本
