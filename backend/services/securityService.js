const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

class SecurityService {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });

    // In-memory storage (in production, use proper database)
    this.users = new Map();
    this.apiKeys = new Map();
    this.usageStats = new Map();
    this.auditLogs = [];
    this.rateLimitStore = new Map();

    // Security configuration
    this.config = {
      jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      apiKeyPrefix: 'aap_',
      saltRounds: 12,
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      apiKeyLength: 32
    };

    // Initialize default users and API keys
    this.initializeDefaultData();

    this.logger.info('🔒 Security Service initialized with enterprise-grade protection');
  }

  async initializeDefaultData() {
    // Create default admin user
    const adminUser = {
      id: 'admin-001',
      email: 'admin@aiassistantpro.com',
      passwordHash: await bcrypt.hash('admin123', this.config.saltRounds),
      tier: 'enterprise',
      permissions: ['all'],
      preferences: {
        responseStyle: 'technical',
        expertise: 'advanced'
      },
      createdAt: new Date(),
      lastLogin: null,
      loginAttempts: 0,
      lockedUntil: null
    };

    this.users.set(adminUser.id, adminUser);

    // Create default API key for admin
    const defaultApiKey = {
      id: 'key-001',
      key: this.config.apiKeyPrefix + 'default_development_key_12345678',
      userId: adminUser.id,
      name: 'Default Development Key',
      permissions: ['chat', 'analyze', 'generate-image', 'tools'],
      active: true,
      createdAt: new Date(),
      lastUsed: null,
      usageCount: 0
    };

    this.apiKeys.set(defaultApiKey.key, defaultApiKey);
    
    this.logger.info('Default security data initialized');
  }

  async validateApiKey(apiKey) {
    try {
      const keyData = this.apiKeys.get(apiKey);
      
      if (!keyData || !keyData.active) {
        this.auditLog('api_key_validation_failed', { apiKey: apiKey.substring(0, 8) + '...', reason: 'invalid_key' }, 'medium');
        return null;
      }

      const user = this.users.get(keyData.userId);
      if (!user) {
        this.auditLog('api_key_validation_failed', { apiKey: apiKey.substring(0, 8) + '...', reason: 'user_not_found' }, 'high');
        return null;
      }

      // Update usage statistics
      keyData.lastUsed = new Date();
      keyData.usageCount++;

      this.auditLog('api_key_validated', { 
        userId: user.id, 
        keyId: keyData.id,
        tier: user.tier 
      }, 'low');

      return {
        id: user.id,
        email: user.email,
        tier: user.tier,
        permissions: keyData.permissions,
        preferences: user.preferences,
        keyId: keyData.id
      };

    } catch (error) {
      this.logger.error('API key validation error:', error);
      this.auditLog('api_key_validation_error', { error: error.message }, 'critical');
      return null;
    }
  }

  async createUser({ email, password, tier = 'free', permissions = [] }) {
    try {
      // Check if user already exists
      const existingUser = Array.from(this.users.values()).find(u => u.email === email);
      if (existingUser) {
        throw new Error('User already exists');
      }

      const userId = uuidv4();
      const passwordHash = await bcrypt.hash(password, this.config.saltRounds);

      const user = {
        id: userId,
        email,
        passwordHash,
        tier,
        permissions,
        preferences: {
          responseStyle: 'balanced',
          expertise: 'general'
        },
        createdAt: new Date(),
        lastLogin: null,
        loginAttempts: 0,
        lockedUntil: null
      };

      this.users.set(userId, user);
      
      this.auditLog('user_created', { userId, email, tier }, 'low');
      
      return {
        id: userId,
        email,
        tier,
        permissions,
        createdAt: user.createdAt
      };

    } catch (error) {
      this.logger.error('User creation error:', error);
      throw error;
    }
  }

  async authenticateUser(email, password) {
    try {
      const user = Array.from(this.users.values()).find(u => u.email === email);
      
      if (!user) {
        this.auditLog('login_failed', { email, reason: 'user_not_found' }, 'medium');
        throw new Error('Invalid credentials');
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        this.auditLog('login_failed', { userId: user.id, reason: 'account_locked' }, 'medium');
        throw new Error('Account temporarily locked');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      
      if (!isValidPassword) {
        user.loginAttempts++;
        
        if (user.loginAttempts >= this.config.maxLoginAttempts) {
          user.lockedUntil = new Date(Date.now() + this.config.lockoutDuration);
          this.auditLog('account_locked', { userId: user.id, attempts: user.loginAttempts }, 'high');
        }
        
        this.auditLog('login_failed', { userId: user.id, reason: 'invalid_password', attempts: user.loginAttempts }, 'medium');
        throw new Error('Invalid credentials');
      }

      // Reset login attempts on successful login
      user.loginAttempts = 0;
      user.lockedUntil = null;
      user.lastLogin = new Date();

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          tier: user.tier 
        },
        this.config.jwtSecret,
        { expiresIn: '24h' }
      );

      this.auditLog('login_successful', { userId: user.id, email }, 'low');

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          tier: user.tier,
          permissions: user.permissions,
          preferences: user.preferences
        }
      };

    } catch (error) {
      this.logger.error('Authentication error:', error);
      throw error;
    }
  }

  async createApiKey(userId, name, permissions = []) {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const keyId = uuidv4();
      const apiKey = this.generateApiKey();

      const keyData = {
        id: keyId,
        key: apiKey,
        userId,
        name,
        permissions,
        active: true,
        createdAt: new Date(),
        lastUsed: null,
        usageCount: 0
      };

      this.apiKeys.set(apiKey, keyData);
      
      this.auditLog('api_key_created', { 
        userId, 
        keyId, 
        name, 
        permissions 
      }, 'low');

      return {
        id: keyId,
        name,
        key: apiKey,
        key_prefix: apiKey.substring(0, 12) + '...',
        permissions,
        created_at: keyData.createdAt
      };

    } catch (error) {
      this.logger.error('API key creation error:', error);
      throw error;
    }
  }

  generateApiKey() {
    const randomBytes = crypto.randomBytes(this.config.apiKeyLength);
    return this.config.apiKeyPrefix + randomBytes.toString('hex');
  }

  async getUserApiKeys(userId) {
    try {
      const userKeys = Array.from(this.apiKeys.values())
        .filter(key => key.userId === userId)
        .map(key => ({
          id: key.id,
          name: key.name,
          key_prefix: key.key.substring(0, 12) + '...',
          active: key.active,
          permissions: key.permissions,
          created_at: key.createdAt,
          last_used: key.lastUsed,
          usage_count: key.usageCount
        }));

      return userKeys;

    } catch (error) {
      this.logger.error('Get user API keys error:', error);
      throw error;
    }
  }

  async revokeApiKey(userId, keyId) {
    try {
      const keyEntry = Array.from(this.apiKeys.entries())
        .find(([_, keyData]) => keyData.id === keyId && keyData.userId === userId);

      if (!keyEntry) {
        throw new Error('API key not found');
      }

      const [apiKey, keyData] = keyEntry;
      keyData.active = false;

      this.auditLog('api_key_revoked', { 
        userId, 
        keyId, 
        name: keyData.name 
      }, 'low');

      return true;

    } catch (error) {
      this.logger.error('API key revocation error:', error);
      throw error;
    }
  }

  async logUsage(userId, usageData) {
    try {
      const { endpoint, tokens, processingTime, cost } = usageData;
      
      if (!this.usageStats.has(userId)) {
        this.usageStats.set(userId, {
          totalRequests: 0,
          totalTokens: 0,
          totalCost: 0,
          dailyUsage: new Map(),
          endpointUsage: new Map()
        });
      }

      const stats = this.usageStats.get(userId);
      const today = new Date().toISOString().split('T')[0];

      // Update overall stats
      stats.totalRequests++;
      stats.totalTokens += tokens;
      stats.totalCost += cost;

      // Update daily stats
      if (!stats.dailyUsage.has(today)) {
        stats.dailyUsage.set(today, {
          date: today,
          requests: 0,
          tokens: 0,
          cost: 0
        });
      }

      const dailyStats = stats.dailyUsage.get(today);
      dailyStats.requests++;
      dailyStats.tokens += tokens;
      dailyStats.cost += cost;

      // Update endpoint stats
      if (!stats.endpointUsage.has(endpoint)) {
        stats.endpointUsage.set(endpoint, {
          endpoint,
          requests: 0,
          tokens: 0,
          cost: 0,
          avgProcessingTime: 0
        });
      }

      const endpointStats = stats.endpointUsage.get(endpoint);
      endpointStats.requests++;
      endpointStats.tokens += tokens;
      endpointStats.cost += cost;
      endpointStats.avgProcessingTime = 
        (endpointStats.avgProcessingTime * (endpointStats.requests - 1) + processingTime) / endpointStats.requests;

      this.auditLog('usage_logged', { 
        userId, 
        endpoint, 
        tokens, 
        cost 
      }, 'low');

    } catch (error) {
      this.logger.error('Usage logging error:', error);
    }
  }

  async getUsageStats(userId, period = '30d') {
    try {
      const stats = this.usageStats.get(userId);
      if (!stats) {
        return {
          total_requests: 0,
          total_tokens: 0,
          total_cost: 0,
          period,
          daily_usage: [],
          endpoint_usage: []
        };
      }

      // Calculate period start date
      const periodDays = parseInt(period.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Filter daily usage for the period
      const dailyUsage = Array.from(stats.dailyUsage.values())
        .filter(day => new Date(day.date) >= startDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Get endpoint usage
      const endpointUsage = Array.from(stats.endpointUsage.values())
        .sort((a, b) => b.requests - a.requests);

      return {
        total_requests: stats.totalRequests,
        total_tokens: stats.totalTokens,
        total_cost: stats.totalCost,
        period,
        daily_usage: dailyUsage,
        endpoint_usage: endpointUsage
      };

    } catch (error) {
      this.logger.error('Get usage stats error:', error);
      throw error;
    }
  }

  sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }

    // Remove potentially dangerous patterns
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/data:text\/html/gi, '') // Remove data URLs
      .trim();

    // Validate length
    if (sanitized.length > 50000) { // 50KB limit
      throw new Error('Input too large');
    }

    return sanitized;
  }

  validatePermission(userPermissions, requiredPermission) {
    if (!userPermissions || !Array.isArray(userPermissions)) {
      return false;
    }

    return userPermissions.includes('all') || userPermissions.includes(requiredPermission);
  }

  checkRateLimit(userId, endpoint, limit = 100, windowMs = 60 * 60 * 1000) {
    const key = `${userId}:${endpoint}`;
    const now = Date.now();
    
    if (!this.rateLimitStore.has(key)) {
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
    }

    const rateData = this.rateLimitStore.get(key);
    
    if (now > rateData.resetTime) {
      // Reset the window
      rateData.count = 1;
      rateData.resetTime = now + windowMs;
      return { allowed: true, remaining: limit - 1, resetTime: rateData.resetTime };
    }

    if (rateData.count >= limit) {
      this.auditLog('rate_limit_exceeded', { 
        userId, 
        endpoint, 
        count: rateData.count, 
        limit 
      }, 'medium');
      
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: rateData.resetTime,
        retryAfter: Math.ceil((rateData.resetTime - now) / 1000)
      };
    }

    rateData.count++;
    return { 
      allowed: true, 
      remaining: limit - rateData.count, 
      resetTime: rateData.resetTime 
    };
  }

  encryptSensitiveData(data) {
    try {
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(this.config.jwtSecret, 'salt', 32);
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher(algorithm, key);
      cipher.setAAD(Buffer.from('additional-data'));
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };

    } catch (error) {
      this.logger.error('Encryption error:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  decryptSensitiveData(encryptedData) {
    try {
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(this.config.jwtSecret, 'salt', 32);
      
      const decipher = crypto.createDecipher(algorithm, key);
      decipher.setAAD(Buffer.from('additional-data'));
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);

    } catch (error) {
      this.logger.error('Decryption error:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  auditLog(event, details = {}, severity = 'low') {
    const logEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      event,
      details,
      severity,
      source: 'security_service'
    };

    this.auditLogs.push(logEntry);

    // Keep only last 10000 logs in memory
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }

    // Log critical events immediately
    if (severity === 'critical' || severity === 'high') {
      this.logger.error(`[SECURITY AUDIT] ${event}:`, details);
    } else {
      this.logger.info(`[SECURITY AUDIT] ${event}:`, details);
    }
  }

  getAuditLogs(filters = {}) {
    let logs = [...this.auditLogs];

    // Apply filters
    if (filters.severity) {
      logs = logs.filter(log => log.severity === filters.severity);
    }

    if (filters.event) {
      logs = logs.filter(log => log.event.includes(filters.event));
    }

    if (filters.startDate) {
      logs = logs.filter(log => log.timestamp >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      logs = logs.filter(log => log.timestamp <= new Date(filters.endDate));
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp - a.timestamp);

    // Limit results
    const limit = filters.limit || 100;
    return logs.slice(0, limit);
  }

  generateSecurityReport() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentLogs = this.auditLogs.filter(log => log.timestamp >= last24h);
    const weeklyLogs = this.auditLogs.filter(log => log.timestamp >= last7d);

    const securityEvents = {
      critical: recentLogs.filter(log => log.severity === 'critical').length,
      high: recentLogs.filter(log => log.severity === 'high').length,
      medium: recentLogs.filter(log => log.severity === 'medium').length,
      low: recentLogs.filter(log => log.severity === 'low').length
    };

    const topEvents = weeklyLogs.reduce((acc, log) => {
      acc[log.event] = (acc[log.event] || 0) + 1;
      return acc;
    }, {});

    return {
      reportDate: now,
      period: '24 hours',
      totalEvents: recentLogs.length,
      securityEvents,
      topEvents: Object.entries(topEvents)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([event, count]) => ({ event, count })),
      activeUsers: this.users.size,
      activeApiKeys: Array.from(this.apiKeys.values()).filter(key => key.active).length,
      recommendations: this.generateSecurityRecommendations(securityEvents)
    };
  }

  generateSecurityRecommendations(securityEvents) {
    const recommendations = [];

    if (securityEvents.critical > 0) {
      recommendations.push({
        priority: 'critical',
        message: 'Critical security events detected - immediate action required',
        action: 'Review audit logs and investigate critical events'
      });
    }

    if (securityEvents.high > 5) {
      recommendations.push({
        priority: 'high',
        message: 'High number of high-severity security events',
        action: 'Review security policies and access controls'
      });
    }

    if (securityEvents.medium > 20) {
      recommendations.push({
        priority: 'medium',
        message: 'Elevated medium-severity security events',
        action: 'Monitor user behavior and adjust rate limits'
      });
    }

    return recommendations;
  }

  cleanupExpiredData() {
    const now = Date.now();
    
    // Cleanup rate limit data
    for (const [key, data] of this.rateLimitStore.entries()) {
      if (now > data.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }

    // Cleanup old audit logs (keep last 30 days)
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    this.auditLogs = this.auditLogs.filter(log => log.timestamp >= thirtyDaysAgo);

    // Cleanup old daily usage data (keep last 90 days)
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);
    for (const stats of this.usageStats.values()) {
      for (const [date, _] of stats.dailyUsage.entries()) {
        if (new Date(date) < ninetyDaysAgo) {
          stats.dailyUsage.delete(date);
        }
      }
    }

    this.logger.info('Security service cleanup completed');
  }

  isHealthy() {
    return {
      status: 'healthy',
      users: this.users.size,
      activeApiKeys: Array.from(this.apiKeys.values()).filter(key => key.active).length,
      auditLogs: this.auditLogs.length,
      rateLimitEntries: this.rateLimitStore.size,
      lastCleanup: new Date().toISOString()
    };
  }
}

module.exports = SecurityService;

