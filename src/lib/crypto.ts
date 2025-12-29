"use server"

/**
 * AES-256-GCM 加密/解密工具
 * 用于备份文件加密
 */

// 从密码派生密钥
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const passwordKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    )
    
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt.buffer as ArrayBuffer,
            iterations: 100000,
            hash: "SHA-256",
        },
        passwordKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    )
}

/**
 * 加密数据
 * @param data 要加密的字符串
 * @param password 加密密码
 * @returns Base64 编码的加密数据（包含 salt 和 iv）
 */
export async function encryptData(data: string, password: string): Promise<string> {
    const encoder = new TextEncoder()
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    const key = await deriveKey(password, salt)
    
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoder.encode(data)
    )
    
    // 组合: salt (16) + iv (12) + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(new Uint8Array(encrypted), salt.length + iv.length)
    
    // 转为 Base64
    return btoa(String.fromCharCode(...combined))
}

/**
 * 解密数据
 * @param encryptedData Base64 编码的加密数据
 * @param password 解密密码
 * @returns 解密后的字符串
 */
export async function decryptData(encryptedData: string, password: string): Promise<string> {
    const decoder = new TextDecoder()
    
    // 从 Base64 解码
    const combined = new Uint8Array(
        atob(encryptedData).split("").map(c => c.charCodeAt(0))
    )
    
    // 提取 salt, iv, encrypted data
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 28)
    const encrypted = combined.slice(28)
    
    const key = await deriveKey(password, salt)
    
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encrypted
    )
    
    return decoder.decode(decrypted)
}
