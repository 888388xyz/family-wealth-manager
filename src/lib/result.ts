/**
 * 统一错误处理模块
 * 提供类型安全的 Result 类型用于 action 返回值
 */

// 成功结果
export type Success<T> = {
  success: true
  data: T
}

// 失败结果
export type Failure = {
  success: false
  error: string
  code?: string
}

// 统一结果类型
export type Result<T> = Success<T> | Failure

// 辅助函数：创建成功结果
export function success<T>(data: T): Success<T> {
  return { success: true, data }
}

// 辅助函数：创建失败结果
export function failure(error: string, code?: string): Failure {
  return { success: false, error, code }
}

// 错误码常量
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  STARTUP_ERROR: 'STARTUP_ERROR',
} as const

// 错误码类型
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]
