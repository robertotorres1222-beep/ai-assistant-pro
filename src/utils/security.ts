import CryptoJS from 'crypto-js'

// Security configuration
const SECURITY_CONFIG = {
  ENCRYPTION_KEY: import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-in-production',
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS_PER_WINDOW: 100,
  MAX_MESSAGE_LENGTH: 10000,
  ALLOWED_FILE_TYPES: ['txt', 'md', 'js', 'ts', 'json', 'py', 'html', 'css'],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
}

// Content Security Policy
export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
}

// Input validation and sanitization
export class SecurityValidator {
  // Validate and sanitize text input
  static sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid input: must be a non-empty string')
    }

    // Remove potential XSS vectors
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()

    // Check length
    if (sanitized.length > SECURITY_CONFIG.MAX_MESSAGE_LENGTH) {
      throw new Error(`Message too long: maximum ${SECURITY_CONFIG.MAX_MESSAGE_LENGTH} characters allowed`)
    }

    return sanitized
  }

  // Validate file upload
  static validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File too large: maximum ${SECURITY_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB allowed`
      }
    }

    // Check file type
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !SECURITY_CONFIG.ALLOWED_FILE_TYPES.includes(extension)) {
      return {
        isValid: false,
        error: `File type not allowed. Allowed types: ${SECURITY_CONFIG.ALLOWED_FILE_TYPES.join(', ')}`
      }
    }

    return { isValid: true }
  }

  // Validate API key format
  static validateApiKey(key: string, provider: string): boolean {
    if (!key || typeof key !== 'string') return false

    switch (provider.toLowerCase()) {
      case 'openai':
        return key.startsWith('sk-') && key.length > 20
      case 'anthropic':
        return key.startsWith('sk-ant-') && key.length > 30
      case 'google':
        return key.length > 20 && /^[A-Za-z0-9_-]+$/.test(key)
      default:
        return false
    }
  }

  // Rate limiting
  private static requestCounts = new Map<string, { count: number; resetTime: number }>()

  static checkRateLimit(identifier: string): { allowed: boolean; resetTime?: number } {
    const now = Date.now()
    const current = this.requestCounts.get(identifier)

    if (!current || now > current.resetTime) {
      // Reset or initialize
      this.requestCounts.set(identifier, {
        count: 1,
        resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW
      })
      return { allowed: true }
    }

    if (current.count >= SECURITY_CONFIG.MAX_REQUESTS_PER_WINDOW) {
      return { allowed: false, resetTime: current.resetTime }
    }

    current.count++
    return { allowed: true }
  }

  // Clear expired rate limit entries
  static cleanupRateLimit(): void {
    const now = Date.now()
    for (const [key, value] of this.requestCounts.entries()) {
      if (now > value.resetTime) {
        this.requestCounts.delete(key)
      }
    }
  }
}

// Encryption utilities
export class EncryptionService {
  // Encrypt sensitive data
  static encrypt(text: string): string {
    try {
      return CryptoJS.AES.encrypt(text, SECURITY_CONFIG.ENCRYPTION_KEY).toString()
    } catch (error) {
      throw new Error('Encryption failed')
    }
  }

  // Decrypt sensitive data
  static decrypt(encryptedText: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, SECURITY_CONFIG.ENCRYPTION_KEY)
      return bytes.toString(CryptoJS.enc.Utf8)
    } catch (error) {
      throw new Error('Decryption failed')
    }
  }

  // Hash password (for future auth features)
  static hashPassword(password: string): string {
    return CryptoJS.SHA256(password + SECURITY_CONFIG.ENCRYPTION_KEY).toString()
  }

  // Generate secure random string
  static generateSecureRandom(length: number = 32): string {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
}

// Secure storage for API keys
export class SecureStorage {
  private static STORAGE_PREFIX = 'ai_assistant_secure_'

  // Store API key securely
  static setApiKey(provider: string, key: string): void {
    if (!SecurityValidator.validateApiKey(key, provider)) {
      throw new Error(`Invalid ${provider} API key format`)
    }

    const encryptedKey = EncryptionService.encrypt(key)
    localStorage.setItem(`${this.STORAGE_PREFIX}${provider}`, encryptedKey)
  }

  // Retrieve API key
  static getApiKey(provider: string): string | null {
    const encryptedKey = localStorage.getItem(`${this.STORAGE_PREFIX}${provider}`)
    if (!encryptedKey) return null

    try {
      return EncryptionService.decrypt(encryptedKey)
    } catch {
      // If decryption fails, remove the corrupted key
      this.removeApiKey(provider)
      return null
    }
  }

  // Remove API key
  static removeApiKey(provider: string): void {
    localStorage.removeItem(`${this.STORAGE_PREFIX}${provider}`)
  }

  // Check if API key exists
  static hasApiKey(provider: string): boolean {
    return this.getApiKey(provider) !== null
  }

  // Clear all stored keys
  static clearAllKeys(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  }
}

// Security headers for requests
export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  ...CSP_HEADERS
})

// Audit logging
export class SecurityAudit {
  private static logs: Array<{
    timestamp: Date
    event: string
    details: any
    severity: 'low' | 'medium' | 'high' | 'critical'
  }> = []

  static log(event: string, details: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'low'): void {
    this.logs.push({
      timestamp: new Date(),
      event,
      details,
      severity
    })

    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000)
    }

    // Log critical events to console in development
    if (severity === 'critical' && import.meta.env.DEV) {
      console.error(`[SECURITY AUDIT] ${event}:`, details)
    }
  }

  static getLogs(): Array<{ timestamp: Date; event: string; details: any; severity: string }> {
    return [...this.logs]
  }

  static clearLogs(): void {
    this.logs = []
  }
}

// Initialize security features
export const initializeSecurity = () => {
  // Clean up rate limiting every 5 minutes
  setInterval(() => {
    SecurityValidator.cleanupRateLimit()
  }, 5 * 60 * 1000)

  // Log security initialization
  SecurityAudit.log('Security system initialized', {}, 'low')
}

export default {
  SecurityValidator,
  EncryptionService,
  SecureStorage,
  SecurityAudit,
  getSecurityHeaders,
  initializeSecurity
}
