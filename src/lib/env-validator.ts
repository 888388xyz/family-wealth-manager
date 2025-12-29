/**
 * 环境变量验证器
 * 在应用启动时验证关键环境变量
 */

interface EnvConfig {
  DATABASE_URL: string
  AUTH_SECRET: string
  NODE_ENV: 'development' | 'production' | 'test'
}

function validateEnv(): EnvConfig {
  const errors: string[] = []

  // 验证 DATABASE_URL 存在
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required')
  }

  // 验证 AUTH_SECRET 存在且长度 >= 32
  if (!process.env.AUTH_SECRET) {
    errors.push('AUTH_SECRET is required')
  } else if (process.env.AUTH_SECRET.length < 32) {
    errors.push('AUTH_SECRET must be at least 32 characters')
  }

  // 如果有错误，抛出描述性错误
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`)
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    AUTH_SECRET: process.env.AUTH_SECRET!,
    NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development'
  }
}

export const env = validateEnv()
