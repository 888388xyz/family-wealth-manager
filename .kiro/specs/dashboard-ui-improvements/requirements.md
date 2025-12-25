# Requirements Document

## Introduction

本次改进主要针对仪表面板页面的 UI 优化、登录安全增强（两步验证）、账户管理功能增强（克隆账户）以及版本升级。目标是简化仪表面板显示、提升安全性、改善用户体验。

## Glossary

- **Dashboard**: 仪表面板，显示家庭资产总览的主页面
- **Two_Factor_Authentication (2FA)**: 两步验证，登录时除密码外需要额外验证码
- **TOTP**: 基于时间的一次性密码算法，用于生成两步验证码
- **Account_Clone**: 账户克隆功能，复制现有账户信息快速创建新账户
- **Trend_Analysis_Page**: 资产趋势分析页面，包含趋势图、历史对比等信息

## Requirements

### Requirement 1: 移除仪表面板平均余额卡片

**User Story:** As a user, I want a cleaner dashboard without unnecessary metrics, so that I can focus on the most important financial information.

#### Acceptance Criteria

1. WHEN the dashboard page loads, THE Dashboard SHALL NOT display the average balance card
2. THE Dashboard SHALL display only three summary cards: total assets, account count, and foreign currency accounts

### Requirement 2: 将趋势分析移至独立页面并隐藏

**User Story:** As a user, I want trend analysis features to be on a separate page that is hidden by default, so that the dashboard remains clean and focused.

#### Acceptance Criteria

1. THE System SHALL create a new trend analysis page at `/trends` route
2. THE Trend_Analysis_Page SHALL contain the trend chart component (TrendChart)
3. THE Trend_Analysis_Page SHALL contain the historical comparison component (HistoricalComparison)
4. THE Trend_Analysis_Page SHALL contain the yield analysis component (YieldAnalysis)
5. WHEN the dashboard page loads, THE Dashboard SHALL NOT display trend chart, historical comparison, or yield analysis components
6. THE Sidebar SHALL NOT display a link to the trend analysis page by default (hidden feature)

### Requirement 3: 添加可选的两步验证功能

**User Story:** As a user, I want to optionally enable two-factor authentication, so that I can enhance my account security when desired.

#### Acceptance Criteria

1. THE System SHALL support TOTP-based two-factor authentication
2. WHEN a user accesses settings, THE Settings_Page SHALL display an option to enable/disable 2FA
3. WHEN a user enables 2FA, THE System SHALL generate a TOTP secret and display a QR code for authenticator app setup
4. WHEN a user enables 2FA, THE System SHALL require verification of a valid TOTP code before activation
5. WHEN 2FA is enabled and user logs in with correct password, THE Login_Form SHALL prompt for TOTP code
6. WHEN 2FA is enabled and user provides invalid TOTP code, THE System SHALL reject the login attempt
7. WHEN 2FA is disabled (default), THE Login_Form SHALL NOT require TOTP code
8. THE User database schema SHALL store 2FA secret and enabled status

### Requirement 4: 移除仪表面板标题和副标题

**User Story:** As a user, I want a cleaner dashboard header, so that I have more screen space for actual content.

#### Acceptance Criteria

1. WHEN the dashboard page loads, THE Dashboard SHALL NOT display the "仪表面板" heading
2. WHEN the dashboard page loads, THE Dashboard SHALL NOT display the "家庭资产总览" subtitle
3. THE Dashboard SHALL retain the admin view badge when applicable

### Requirement 5: 账户克隆功能

**User Story:** As a user, I want to clone an existing account, so that I can quickly create new accounts with similar settings.

#### Acceptance Criteria

1. WHEN viewing the account table, THE Account_Table SHALL display a clone button for each account row
2. WHEN a user clicks the clone button, THE System SHALL open the add account dialog pre-filled with the source account's data
3. THE Clone_Dialog SHALL pre-fill: bank name, product type, currency, expected yield, and notes
4. THE Clone_Dialog SHALL NOT pre-fill: account name (user must provide new name) and balance (default to 0)
5. WHEN a user submits the clone dialog, THE System SHALL create a new account with the provided data

### Requirement 6: 版本升级至 v0.3.0

**User Story:** As a developer, I want to update the version number, so that users can identify the current release.

#### Acceptance Criteria

1. THE Sidebar SHALL display version "v0.3.0"
2. THE README SHALL document version 0.3.0 changes
