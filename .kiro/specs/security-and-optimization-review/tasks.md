# Implementation Plan: 安全增强与代码优化

## Overview

本任务列表包含 P1 和 P2 优先级的改进：
1. 环境变量启动验证
2. 密码策略增强
3. 输入验证增强
4. 敏感信息日志清理
5. 数据库查询优化
6. 错误处理统一
7. 常量提取

## Tasks

- [x] 1. 创建基础工具模块
  - [x] 1.1 创建环境变量验证器
    - 创建 `src/lib/env-validator.ts`
    - 验证 DATABASE_URL 存在
    - 验证 AUTH_SECRET 存在且长度 >= 32
    - 导出类型安全的 env 对象
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 更新数据库连接使用环境验证器
    - 修改 `src/db/index.ts` 使用 env-validator
    - 移除 `!` 断言
    - _Requirements: 1.1_

  - [ ]* 1.3 编写环境验证器属性测试
    - **Property 1: 环境变量验证完整性**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

- [x] 2. 创建密码验证模块
  - [x] 2.1 创建密码验证器
    - 创建 `src/lib/password-validator.ts`
    - 实现 8 位最小长度检查
    - 实现大写字母检查
    - 实现小写字母检查
    - 实现数字检查
    - 返回所有不满足的规则列表
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.2 集成密码验证到 settings-actions
    - 修改 `changePasswordAction` 使用密码验证器
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.3 集成密码验证到 user-actions
    - 修改 `createUserAction` 使用密码验证器
    - 修改 `resetUserPasswordAction` 使用密码验证器
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.4 编写密码验证器属性测试
    - **Property 2: 密码策略验证**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [x] 3. Checkpoint - 确保密码验证完成
  - 确保所有测试通过，如有问题请询问用户

- [x] 4. 创建输入验证模块
  - [x] 4.1 创建通用验证器
    - 创建 `src/lib/validators.ts`
    - 实现 UUID 验证函数
    - 实现角色验证函数
    - 实现金额范围验证
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 4.2 集成角色验证到 user-actions
    - 修改 `updateUserRoleAction` 验证 role 参数
    - _Requirements: 3.1_

  - [x] 4.3 集成 UUID 验证到关键 actions
    - 修改 `deleteAccountAction` 验证 accountId
    - 修改 `updateBalanceAction` 验证 accountId
    - 修改 `deleteUserAction` 验证 userId
    - _Requirements: 3.2_

  - [ ]* 4.4 编写输入验证器属性测试
    - **Property 3: 角色参数验证**
    - **Property 4: UUID 格式验证**
    - **Validates: Requirements 3.1, 3.2**

- [x] 5. 创建结构化日志模块
  - [x] 5.1 创建日志器
    - 创建 `src/lib/logger.ts`
    - 实现敏感信息过滤（password, secret, token, email）
    - 实现结构化 JSON 输出
    - 实现日志级别（debug, info, warn, error）
    - 生产环境隐藏 debug 日志
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 5.2 替换关键模块的 console 调用
    - 修改 `src/actions/auth-actions.ts` 使用 logger
    - 修改 `src/actions/snapshot-actions.ts` 使用 logger
    - _Requirements: 4.1, 4.2_

  - [ ]* 5.3 编写日志器属性测试
    - **Property 5: 日志敏感信息过滤**
    - **Validates: Requirements 4.1**

- [x] 6. Checkpoint - 确保安全模块完成
  - 确保所有测试通过，如有问题请询问用户

- [x] 7. 扩展常量文件
  - [x] 7.1 添加新常量定义
    - 修改 `src/lib/constants.ts`
    - 添加 CENTS_PER_UNIT = 100
    - 添加 YIELD_MULTIPLIER = 100
    - 添加 CACHE_DURATION_MS
    - 添加 PENDING_2FA_EXPIRY_MS
    - 添加 PASSWORD_POLICY 对象
    - 添加 LOGIN_RATE_LIMIT 对象
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 7.2 更新代码使用常量
    - 修改 `src/actions/account-actions.ts` 使用 CENTS_PER_UNIT
    - 修改 `src/lib/rate-limiter.ts` 使用 LOGIN_RATE_LIMIT
    - 修改 `src/actions/auth-actions.ts` 使用 PENDING_2FA_EXPIRY_MS
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 8. 创建统一错误处理模块
  - [x] 8.1 创建 Result 类型
    - 创建 `src/lib/result.ts`
    - 定义 Success<T> 和 Failure 类型
    - 定义 Result<T> 联合类型
    - 实现 success() 和 failure() 辅助函数
    - 定义 ErrorCodes 常量
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 8.2 编写错误处理属性测试
    - **Property 6: 错误响应结构一致性**
    - **Validates: Requirements 6.2**

- [x] 9. 数据库查询优化
  - [x] 9.1 优化 seedHistoricalSnapshots
    - 修改 `src/actions/snapshot-actions.ts`
    - 批量查询所有账户
    - 内存中按用户分组
    - _Requirements: 5.1_

  - [x] 9.2 优化 createAllUsersSnapshotsAction
    - 修改 `src/actions/snapshot-actions.ts`
    - 批量查询所有账户
    - 内存中按用户分组
    - _Requirements: 5.2_

  - [x] 9.3 优化 refreshExchangeRates
    - 修改 `src/actions/currency-actions.ts`
    - 使用 onConflictDoUpdate 替代 select-then-update
    - _Requirements: 5.3_

  - [x] 9.4 添加 React cache 缓存
    - 创建 `src/lib/cached-queries.ts`
    - 实现 getCurrentUser 缓存函数
    - 实现 getExchangeRatesMap 缓存函数
    - _Requirements: 5.4_

- [x] 10. Final Checkpoint - 确保所有改进完成
  - 确保所有测试通过
  - 验证环境变量验证正常工作
  - 验证密码策略正常工作
  - 验证输入验证正常工作
  - 验证日志敏感信息过滤正常工作

## Notes

- 任务标记 `*` 的是可选的测试任务
- 每个 checkpoint 用于验证阶段性成果
- 性能优化任务（9.x）可以在功能完成后进行
- 数据库索引建议需要手动在数据库中执行
