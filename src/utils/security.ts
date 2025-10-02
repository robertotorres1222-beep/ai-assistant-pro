// Security utilities for the AI Assistant Pro application

export interface SecurityConfig {
  apiKeyEncryption: boolean
  inputSanitization: boolean
  rateLimiting: boolean
  contentFiltering: boolean
  auditLogging: boolean
}

export interface SecurityEvent {
  type: 'api_call' | 'file_upload' | 'content_filter' | 'rate_limit'
  timestamp: Date
  userId?: string
  details: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

class SecurityManager {
  private config: SecurityConfig
  private events: SecurityEvent[] = []
  private blockedPatterns: RegExp[] = []
  private allowedDomains: string[] = []

  constructor() {
    this.config = {
      apiKeyEncryption: true,
      inputSanitization: true,
      rateLimiting: true,
      contentFiltering: true,
      auditLogging: true
    }

    this.initializeSecurityPatterns()
    this.loadSecurityConfiguration()
  }

  private initializeSecurityPatterns() {
    // Malicious patterns to block
    this.blockedPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi
    ]

    // Allowed domains for external requests
    this.allowedDomains = [
      'api.openai.com',
      'api.anthropic.com',
      'generativelanguage.googleapis.com',
      'api.github.com',
      'api.stackoverflow.com'
    ]
  }

  private loadSecurityConfiguration() {
    try {
      const saved = localStorage.getItem('security-config')
      if (saved) {
        const parsed = JSON.parse(saved)
        this.config = { ...this.config, ...parsed }
      }
    } catch (error) {
      console.warn('Failed to load security configuration:', error)
    }
  }

  private saveSecurityConfiguration() {
    try {
      localStorage.setItem('security-config', JSON.stringify(this.config))
    } catch (error) {
      console.warn('Failed to save security configuration:', error)
    }
  }

  // Initialize security features
  public initializeSecurity(): void {
    this.setupContentSecurityPolicy()
    this.setupApiKeyProtection()
    this.setupInputValidation()
    this.logSecurityEvent({
      type: 'api_call',
      details: { action: 'security_initialized' },
      severity: 'low'
    })
  }

  private setupContentSecurityPolicy(): void {
    // Set up CSP headers (would be handled by the backend)
    const meta = document.createElement('meta')
    meta.httpEquiv = 'Content-Security-Policy'
    meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com"
    document.head.appendChild(meta)
  }

  private setupApiKeyProtection(): void {
    // Override console methods to prevent API key leakage
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn

    console.log = (...args) => {
      const filtered = this.filterSensitiveData(args)
      originalLog.apply(console, filtered)
    }

    console.error = (...args) => {
      const filtered = this.filterSensitiveData(args)
      originalError.apply(console, filtered)
    }

    console.warn = (...args) => {
      const filtered = this.filterSensitiveData(args)
      originalWarn.apply(console, filtered)
    }
  }

  private setupInputValidation(): void {
    // Add input validation to all text inputs
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement
      if (target && (target.type === 'text' || target.tagName === 'TEXTAREA')) {
        this.sanitizeInput(target.value)
      }
    })
  }

  private filterSensitiveData(args: any[]): any[] {
    return args.map(arg => {
      if (typeof arg === 'string') {
        // Filter out potential API keys
        return arg.replace(/sk-[a-zA-Z0-9]{20,}/g, '[API_KEY_FILTERED]')
                  .replace(/[a-zA-Z0-9]{32,}/g, '[POTENTIAL_KEY_FILTERED]')
      }
      return arg
    })
  }

  // Sanitize user input
  public sanitizeInput(input: string): string {
    if (!this.config.inputSanitization) return input

    let sanitized = input

    // Remove potentially dangerous patterns
    this.blockedPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[FILTERED]')
    })

    // Escape HTML entities
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')

    // Limit length
    const maxLength = 10000
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength) + '...[TRUNCATED]'
    }

    return sanitized
  }

  // Validate API key format
  public validateApiKey(apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') return false

    // OpenAI API key format
    if (apiKey.startsWith('sk-') && apiKey.length >= 20) return true

    // Anthropic API key format
    if (apiKey.startsWith('sk-ant-') && apiKey.length >= 20) return true

    // Google AI API key format
    if (apiKey.length >= 20 && /^[a-zA-Z0-9_-]+$/.test(apiKey)) return true

    return false
  }

  // Encrypt API key for storage
  public encryptApiKey(apiKey: string): string {
    if (!this.config.apiKeyEncryption) return apiKey

    // Simple base64 encoding (in production, use proper encryption)
    return btoa(apiKey)
  }

  // Decrypt API key from storage
  public decryptApiKey(encryptedKey: string): string {
    if (!this.config.apiKeyEncryption) return encryptedKey

    try {
      return atob(encryptedKey)
    } catch (error) {
      console.error('Failed to decrypt API key:', error)
      return encryptedKey
    }
  }

  // Rate limiting
  private requestCounts: Map<string, number> = new Map()
  private lastReset: number = Date.now()

  public checkRateLimit(userId: string, limit: number = 100): boolean {
    if (!this.config.rateLimiting) return true

    const now = Date.now()
    const resetInterval = 60 * 60 * 1000 // 1 hour

    // Reset counters if interval has passed
    if (now - this.lastReset > resetInterval) {
      this.requestCounts.clear()
      this.lastReset = now
    }

    const count = this.requestCounts.get(userId) || 0
    if (count >= limit) {
      this.logSecurityEvent({
        type: 'rate_limit',
        details: { userId, limit, count },
        severity: 'high'
      })
      return false
    }

    this.requestCounts.set(userId, count + 1)
    return true
  }

  // Content filtering
  public filterContent(content: string): { isAllowed: boolean; filteredContent: string; reason?: string } {
    if (!this.config.contentFiltering) {
      return { isAllowed: true, filteredContent: content }
    }

    // Check for malicious patterns
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(content)) {
        this.logSecurityEvent({
          type: 'content_filter',
          details: { pattern: pattern.toString(), content: content.substring(0, 100) },
          severity: 'medium'
        })
        return { 
          isAllowed: false, 
          filteredContent: '[CONTENT_BLOCKED]', 
          reason: 'Potentially malicious content detected' 
        }
      }
    }

    // Check for excessive profanity (simple example)
    const profanityWords = ['spam', 'scam', 'phishing'] // Add more as needed
    const lowerContent = content.toLowerCase()
    for (const word of profanityWords) {
      if (lowerContent.includes(word)) {
        return { 
          isAllowed: false, 
          filteredContent: '[CONTENT_FILTERED]', 
          reason: 'Inappropriate content detected' 
        }
      }
    }

    return { isAllowed: true, filteredContent: content }
  }

  // Validate file upload
  public validateFileUpload(file: File): { isValid: boolean; reason?: string } {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/json',
      'image/jpeg',
      'image/png',
      'image/gif',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'application/pdf'
    ]

    if (file.size > maxSize) {
      return { isValid: false, reason: 'File size exceeds limit' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, reason: 'File type not allowed' }
    }

    // Check filename for suspicious patterns
    const suspiciousPatterns = /\.(exe|bat|cmd|scr|pif|com)$/i
    if (suspiciousPatterns.test(file.name)) {
      return { isValid: false, reason: 'Executable files not allowed' }
    }

    return { isValid: true }
  }

  // Log security events
  private logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    if (!this.config.auditLogging) return

    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    }

    this.events.push(securityEvent)

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000)
    }

    // Save to localStorage
    try {
      localStorage.setItem('security-events', JSON.stringify(this.events.slice(-100)))
    } catch (error) {
      console.warn('Failed to save security events:', error)
    }

    // Log critical events to console
    if (event.severity === 'critical' || event.severity === 'high') {
      console.warn('Security Event:', securityEvent)
    }
  }

  // Get security events
  public getSecurityEvents(severity?: SecurityEvent['severity']): SecurityEvent[] {
    if (severity) {
      return this.events.filter(event => event.severity === severity)
    }
    return [...this.events]
  }

  // Get security statistics
  public getSecurityStats(): {
    totalEvents: number
    eventsBySeverity: Record<SecurityEvent['severity'], number>
    eventsByType: Record<SecurityEvent['type'], number>
    recentActivity: SecurityEvent[]
  } {
    const eventsBySeverity = this.events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1
      return acc
    }, {} as Record<SecurityEvent['severity'], number>)

    const eventsByType = this.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1
      return acc
    }, {} as Record<SecurityEvent['type'], number>)

    const recentActivity = this.events
      .filter(event => Date.now() - event.timestamp.getTime() < 24 * 60 * 60 * 1000) // Last 24 hours
      .slice(-10)

    return {
      totalEvents: this.events.length,
      eventsBySeverity,
      eventsByType,
      recentActivity
    }
  }

  // Update security configuration
  public updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.saveSecurityConfiguration()
  }

  // Get current configuration
  public getConfig(): SecurityConfig {
    return { ...this.config }
  }
}

// Create singleton instance
export const securityManager = new SecurityManager()

// Initialize security when module is loaded
export const initializeSecurity = (): void => {
  securityManager.initializeSecurity()
}

// Export types and utilities
export type { SecurityConfig, SecurityEvent }
export { SecurityManager }
