import { authenticator } from 'otplib';

// TOTP 配置
const TOTP_CONFIG = {
  issuer: '家庭财富管家',
  algorithm: 'sha1' as const,
  digits: 6,
  period: 30, // 30秒有效期
};

// 配置 authenticator
authenticator.options = {
  digits: TOTP_CONFIG.digits,
  step: TOTP_CONFIG.period,
};

/**
 * 生成 TOTP secret
 * @returns 生成的 secret 字符串
 */
export function generateSecret(): string {
  return authenticator.generateSecret();
}

/**
 * 生成用于 authenticator app 扫描的 QR 码 URL
 * @param secret TOTP secret
 * @param email 用户邮箱
 * @returns otpauth:// 格式的 URL
 */
export function generateQRCodeUrl(secret: string, email: string): string {
  return authenticator.keyuri(email, TOTP_CONFIG.issuer, secret);
}

/**
 * 验证 TOTP 码
 * @param secret TOTP secret
 * @param code 用户输入的验证码
 * @returns 验证是否通过
 */
export function verifyTOTP(secret: string, code: string): boolean {
  try {
    return authenticator.verify({ token: code, secret });
  } catch {
    return false;
  }
}

/**
 * 生成当前时间的 TOTP 码（用于测试）
 * @param secret TOTP secret
 * @returns 当前的 TOTP 码
 */
export function generateTOTP(secret: string): string {
  return authenticator.generate(secret);
}
