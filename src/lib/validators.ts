import { z } from 'zod'

// UUID 验证 Schema
export const uuidSchema = z.string().uuid('无效的 ID 格式')

// 角色验证 Schema
export const roleSchema = z.enum(['ADMIN', 'MEMBER'], {
    message: '无效的角色'
})

// 金额验证 Schema（分为单位，支持 0 到 9999999999.99 元）
export const amountSchema = z.number()
    .min(0, '金额不能为负')
    .max(999999999999, '金额超出范围')

// 通用验证函数

/**
 * 验证字符串是否为有效的 UUID 格式
 * @param id 待验证的字符串
 * @returns 是否为有效 UUID
 */
export function validateUUID(id: string): boolean {
    return uuidSchema.safeParse(id).success
}

/**
 * 验证字符串是否为有效的角色
 * @param role 待验证的字符串
 * @returns 是否为有效角色（ADMIN 或 MEMBER）
 */
export function validateRole(role: string): role is 'ADMIN' | 'MEMBER' {
    return roleSchema.safeParse(role).success
}

/**
 * 验证数字是否在有效金额范围内
 * @param amount 待验证的金额（分为单位）
 * @returns 是否为有效金额
 */
export function validateAmount(amount: number): boolean {
    return amountSchema.safeParse(amount).success
}

// 验证结果类型
export interface ValidationResult {
    isValid: boolean
    error?: string
}

/**
 * 验证 UUID 并返回详细结果
 * @param id 待验证的字符串
 * @returns 验证结果对象
 */
export function validateUUIDWithResult(id: string): ValidationResult {
    const result = uuidSchema.safeParse(id)
    if (result.success) {
        return { isValid: true }
    }
    return { isValid: false, error: result.error.issues[0]?.message || '无效的 ID 格式' }
}

/**
 * 验证角色并返回详细结果
 * @param role 待验证的字符串
 * @returns 验证结果对象
 */
export function validateRoleWithResult(role: string): ValidationResult {
    const result = roleSchema.safeParse(role)
    if (result.success) {
        return { isValid: true }
    }
    return { isValid: false, error: result.error.issues[0]?.message || '无效的角色' }
}

/**
 * 验证金额并返回详细结果
 * @param amount 待验证的金额
 * @returns 验证结果对象
 */
export function validateAmountWithResult(amount: number): ValidationResult {
    const result = amountSchema.safeParse(amount)
    if (result.success) {
        return { isValid: true }
    }
    return { isValid: false, error: result.error.issues[0]?.message || '无效的金额' }
}
