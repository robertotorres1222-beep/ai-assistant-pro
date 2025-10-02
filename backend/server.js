const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const winston = require('winston');

// Import our custom AI intelligence services
const IntelligenceEngine = require('./services/intelligenceEngine');
const ToolsService = require('./services/toolsService');
const KnowledgeBase = require('./services/knowledgeBase');
const ReasoningEngine = require('./services/reasoningEngine');
const CodeAnalysisService = require('./services/codeAnalysisService');
const FileProcessingService = require('./services/fileProcessingService');
const SecurityService = require('./services/securityService');

const app = express();
const PORT = process.env.PORT || 3001;

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://api.anthropic.com"]
    }
  }
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message, code: 'RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Different rate limits for different tiers
const freeTierLimit = createRateLimit(60 * 60 * 1000, 100, 'Free tier: 100 requests per hour exceeded');
const proTierLimit = createRateLimit(60 * 60 * 1000, 1000, 'Pro tier: 1000 requests per hour exceeded');
const enterpriseLimit = createRateLimit(60 * 60 * 1000, 10000, 'Enterprise tier: 10000 requests per hour exceeded');

// Initialize services
const intelligenceEngine = new IntelligenceEngine();
const toolsService = new ToolsService();
const knowledgeBase = new KnowledgeBase();
const reasoningEngine = new ReasoningEngine();
const codeAnalysisService = new CodeAnalysisService();
const fileProcessingService = new FileProcessingService();
const securityService = new SecurityService();

// Authentication middleware
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key required', 
        code: 'INVALID_API_KEY' 
      });
    }

    // Validate API key and get user info
    const user = await securityService.validateApiKey(apiKey);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid API key', 
        code: 'INVALID_API_KEY' 
      });
    }

    req.user = user;
    
    // Apply appropriate rate limiting based on tier
    let rateLimitMiddleware;
    switch (user.tier) {
      case 'enterprise':
        rateLimitMiddleware = enterpriseLimit;
        break;
      case 'pro':
        rateLimitMiddleware = proTierLimit;
        break;
      default:
        rateLimitMiddleware = freeTierLimit;
    }
    
    rateLimitMiddleware(req, res, next);
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication failed', 
      code: 'AUTH_ERROR' 
    });
  }
};

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    apiKey: req.headers['x-api-key']?.substring(0, 8) + '...'
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      intelligence: intelligenceEngine.isHealthy(),
      tools: toolsService.isHealthy(),
      knowledge: knowledgeBase.isHealthy(),
      reasoning: reasoningEngine.isHealthy()
    }
  });
});

// Advanced AI Chat endpoint with custom intelligence
app.post('/api/chat', authenticateApiKey, async (req, res) => {
  try {
    const { message, context = [], tools_enabled = true, reasoning_mode = 'advanced' } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required and must be a string',
        code: 'INVALID_REQUEST'
      });
    }

    // Security validation
    const sanitizedMessage = securityService.sanitizeInput(message);
    
    // Start processing with our intelligence engine
    const startTime = Date.now();
    
    // Step 1: Analyze the request with reasoning engine
    const analysis = await reasoningEngine.analyzeRequest(sanitizedMessage, context);
    
    // Step 2: Determine if tools are needed
    let toolResults = null;
    if (tools_enabled && analysis.requiresTools) {
      toolResults = await toolsService.executeTools(analysis.suggestedTools, sanitizedMessage);
    }
    
    // Step 3: Generate response with our custom intelligence
    const response = await intelligenceEngine.generateResponse({
      message: sanitizedMessage,
      context,
      analysis,
      toolResults,
      reasoningMode: reasoning_mode,
      userPreferences: req.user.preferences
    });
    
    const processingTime = Date.now() - startTime;
    
    // Log usage for billing
    await securityService.logUsage(req.user.id, {
      endpoint: 'chat',
      tokens: response.tokens,
      processingTime,
      cost: response.cost
    });
    
    res.json({
      success: true,
      data: {
        message: response.content,
        reasoning: response.reasoning,
        tools_used: toolResults?.toolsUsed || [],
        confidence: response.confidence,
        tokens: response.tokens,
        cost: response.cost,
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Chat endpoint error:', error);
    res.status(500).json({
      error: 'Failed to process chat request',
      code: 'PROCESSING_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Advanced Code Analysis endpoint
app.post('/api/analyze', authenticateApiKey, async (req, res) => {
  try {
    const { code, language, analysis_type = 'comprehensive' } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({
        error: 'Code and language are required',
        code: 'INVALID_REQUEST'
      });
    }

    const startTime = Date.now();
    
    // Use our advanced code analysis service
    const analysis = await codeAnalysisService.analyzeCode({
      code: securityService.sanitizeInput(code),
      language,
      analysisType: analysis_type,
      deepAnalysis: req.user.tier !== 'free' // Premium feature
    });
    
    const processingTime = Date.now() - startTime;
    
    await securityService.logUsage(req.user.id, {
      endpoint: 'analyze',
      tokens: analysis.tokens,
      processingTime,
      cost: analysis.cost
    });
    
    res.json({
      success: true,
      data: {
        analysis: analysis.result,
        suggestions: analysis.suggestions,
        security_issues: analysis.securityIssues,
        performance_insights: analysis.performanceInsights,
        maintainability_score: analysis.maintainabilityScore,
        complexity_analysis: analysis.complexityAnalysis,
        language,
        type: analysis_type,
        tokens: analysis.tokens,
        cost: analysis.cost,
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Code analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze code',
      code: 'ANALYSIS_ERROR'
    });
  }
});

// Advanced File Processing endpoint
app.post('/api/analyze-file', authenticateApiKey, async (req, res) => {
  try {
    const { file_content, file_name, file_type, analysis_depth = 'standard' } = req.body;
    
    if (!file_content || !file_name || !file_type) {
      return res.status(400).json({
        error: 'File content, name, and type are required',
        code: 'INVALID_REQUEST'
      });
    }

    const startTime = Date.now();
    
    // Process file with our advanced service
    const analysis = await fileProcessingService.processFile({
      content: file_content,
      fileName: file_name,
      fileType: file_type,
      analysisDepth: analysis_depth,
      extractEntities: req.user.tier !== 'free',
      generateSummary: true,
      detectLanguage: true
    });
    
    const processingTime = Date.now() - startTime;
    
    await securityService.logUsage(req.user.id, {
      endpoint: 'analyze-file',
      tokens: analysis.tokens,
      processingTime,
      cost: analysis.cost
    });
    
    res.json({
      success: true,
      data: {
        analysis: analysis.content,
        summary: analysis.summary,
        entities: analysis.entities,
        key_insights: analysis.keyInsights,
        language_detected: analysis.detectedLanguage,
        file_name,
        file_type,
        tokens: analysis.tokens,
        cost: analysis.cost,
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('File analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze file',
      code: 'FILE_ANALYSIS_ERROR'
    });
  }
});

// Knowledge Base Query endpoint
app.post('/api/knowledge/query', authenticateApiKey, async (req, res) => {
  try {
    const { query, domain, max_results = 10 } = req.body;
    
    const results = await knowledgeBase.search({
      query: securityService.sanitizeInput(query),
      domain,
      maxResults: max_results,
      userContext: req.user.preferences
    });
    
    res.json({
      success: true,
      data: {
        results: results.items,
        total_found: results.total,
        query_time_ms: results.queryTime,
        relevance_scores: results.relevanceScores
      }
    });
    
  } catch (error) {
    logger.error('Knowledge query error:', error);
    res.status(500).json({
      error: 'Failed to query knowledge base',
      code: 'KNOWLEDGE_ERROR'
    });
  }
});

// Tool Execution endpoint
app.post('/api/tools/execute', authenticateApiKey, async (req, res) => {
  try {
    const { tool_name, parameters, context } = req.body;
    
    if (req.user.tier === 'free' && !toolsService.isToolFreeForUser(tool_name)) {
      return res.status(403).json({
        error: 'Tool requires paid subscription',
        code: 'PREMIUM_FEATURE_REQUIRED'
      });
    }
    
    const result = await toolsService.executeTool({
      toolName: tool_name,
      parameters: securityService.sanitizeInput(parameters),
      context,
      userId: req.user.id
    });
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error('Tool execution error:', error);
    res.status(500).json({
      error: 'Failed to execute tool',
      code: 'TOOL_EXECUTION_ERROR'
    });
  }
});

// Usage Statistics endpoint
app.get('/api/usage', authenticateApiKey, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const stats = await securityService.getUsageStats(req.user.id, period);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    logger.error('Usage stats error:', error);
    res.status(500).json({
      error: 'Failed to get usage statistics',
      code: 'STATS_ERROR'
    });
  }
});

// API Key Management endpoints
app.get('/api/keys', authenticateApiKey, async (req, res) => {
  try {
    const keys = await securityService.getUserApiKeys(req.user.id);
    res.json({ success: true, data: keys });
  } catch (error) {
    logger.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to get API keys', code: 'KEYS_ERROR' });
  }
});

app.post('/api/keys', authenticateApiKey, async (req, res) => {
  try {
    const { name, permissions } = req.body;
    const newKey = await securityService.createApiKey(req.user.id, name, permissions);
    res.json({ success: true, data: newKey });
  } catch (error) {
    logger.error('Create API key error:', error);
    res.status(500).json({ error: 'Failed to create API key', code: 'KEY_CREATION_ERROR' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId: uuidv4()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 AI Assistant Pro Backend Service running on port ${PORT}`);
  logger.info('🧠 Intelligence Engine: Initialized');
  logger.info('🔧 Tools Service: Ready');
  logger.info('📚 Knowledge Base: Loaded');
  logger.info('🤔 Reasoning Engine: Active');
});

module.exports = app;

