const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { OpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize AI providers
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
}) : null;

const google = process.env.GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(
  process.env.GOOGLE_AI_API_KEY
) : null;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://api.anthropic.com", "https://generativelanguage.googleapis.com"]
    }
  }
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://ai-assistant-13sh6yauv-robertotos-projects.vercel.app'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    providers: {
      openai: !!openai,
      anthropic: !!anthropic,
      google: !!google
    }
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, model = 'gpt-4o', provider = 'openai', context = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required and must be a string'
      });
    }

    let response;

    switch (provider) {
      case 'openai':
        if (!openai) {
          return res.status(400).json({ error: 'OpenAI API key not configured' });
        }
        response = await callOpenAI(message, context, model);
        break;
      
      case 'anthropic':
        if (!anthropic) {
          return res.status(400).json({ error: 'Anthropic API key not configured' });
        }
        response = await callAnthropic(message, context, model);
        break;
      
      case 'google':
        if (!google) {
          return res.status(400).json({ error: 'Google AI API key not configured' });
        }
        response = await callGoogle(message, context, model);
        break;
      
      default:
        return res.status(400).json({ error: 'Unsupported provider' });
    }

    res.json({
      success: true,
      data: {
        message: response,
        model,
        provider,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to process chat request',
      details: error.message
    });
  }
});

// OpenAI API call
async function callOpenAI(message, context, model) {
  const messages = [
    ...context.map(msg => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: message }
  ];

  const completion = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    max_tokens: 4000
  });

  return completion.choices[0]?.message?.content || 'No response generated';
}

// Anthropic API call
async function callAnthropic(message, context, model) {
  const conversation = context.map(msg => 
    `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
  ).join('\n\n');
  
  const fullPrompt = `${conversation}\n\nHuman: ${message}\n\nAssistant:`;

  const response = await anthropic.messages.create({
    model,
    max_tokens: 4000,
    messages: [{ role: 'user', content: fullPrompt }]
  });

  return response.content[0]?.text || 'No response generated';
}

// Google AI API call
async function callGoogle(message, context, model) {
  const conversation = context.map(msg => 
    `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
  ).join('\n\n');
  
  const fullPrompt = `${conversation}\n\nUser: ${message}\n\nAssistant:`;

  const genAI = google;
  const generativeModel = genAI.getGenerativeModel({ model });

  const result = await generativeModel.generateContent(fullPrompt);
  const response = await result.response;

  return response.text() || 'No response generated';
}

// Error handling
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Assistant Pro Backend running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 OpenAI: ${openai ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🧠 Anthropic: ${anthropic ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`⚡ Google AI: ${google ? '✅ Configured' : '❌ Not configured'}`);
});

module.exports = app;