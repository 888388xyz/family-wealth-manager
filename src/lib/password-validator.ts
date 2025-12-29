/**
 * 密码验证器
 * 实现密码策略检查，确保密码满足安全要求
 */

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
}

export const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
} as const

/**
 * 验证密码是否满足安全策略
 * @param password 待验证的密码
 * @returns 验证结果，包含是否有效和错误列表
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  // 检查最小长度
  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`密码长度至少为${PASSWORD_RULES.minLength}位`)
  }

  // 检查大写字母
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母')
  }

  // 检查小写字母
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('密码必须包含至少一个小写字母')
  }

  // 检查数字
  if (PASSWORD_RULES.requireDigit && !/\d/.test(password)) {
    errors.push('密码必须包含至少一个数字')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
