# AI Assistant Pro - Public API Documentation

## Overview

The AI Assistant Pro API provides programmatic access to our AI-powered development tools. You can integrate our services into your applications, build custom workflows, and leverage our AI capabilities at scale.

**Base URL:** `https://api.aiassistantpro.com/v1`

## Authentication

All API requests require authentication using an API key. Include your API key in one of these ways:

### Header (Recommended)
```http
X-API-Key: aap_your_api_key_here
```

### Query Parameter
```http
GET /api/chat?apiKey=aap_your_api_key_here
```

## Rate Limits

- **Free Tier:** 100 requests per hour
- **Pro Tier:** 1,000 requests per hour  
- **Enterprise:** Custom limits

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per hour
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Endpoints

### 1. Health Check

Check API status and version.

```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

### 2. Chat

Send messages to AI assistants.

```http
POST /api/chat
```

**Request Body:**
```json
{
  "message": "Explain this JavaScript code",
  "provider": "chatgpt",
  "context": [
    {
      "role": "user",
      "content": "Previous message context"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "AI response here",
    "provider": "ChatGPT",
    "tokens": 150,
    "cost": 0.02,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 3. Code Analysis

Analyze code for issues, optimizations, and best practices.

```http
POST /api/analyze
```

**Request Body:**
```json
{
  "code": "function add(a, b) { return a + b; }",
  "language": "javascript",
  "analysis_type": "general"
}
```

**Analysis Types:**
- `general`: Overall code quality and best practices
- `security`: Security vulnerabilities and concerns
- `performance`: Performance optimizations
- `maintainability`: Code maintainability improvements

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": "Code analysis results...",
    "language": "javascript",
    "type": "general",
    "tokens": 200,
    "cost": 0.03,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 4. Image Generation

Generate images using DALL-E 3.

```http
POST /api/generate-image
```

**Request Body:**
```json
{
  "prompt": "A futuristic city skyline at sunset",
  "size": "1024x1024",
  "count": 1
}
```

**Supported Sizes:**
- `1024x1024`: Square (1:1)
- `1024x1792`: Portrait (9:16)
- `1792x1024`: Landscape (16:9)

**Response:**
```json
{
  "success": true,
  "data": {
    "images": [
      "https://generated-image-url.com/image1.png"
    ],
    "prompt": "A futuristic city skyline at sunset",
    "cost": 0.04,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 5. File Analysis

Analyze uploaded files (PDF, Word, Excel, etc.).

```http
POST /api/analyze-file
```

**Request Body:**
```json
{
  "file_content": "base64_encoded_file_content",
  "file_name": "document.pdf",
  "file_type": "application/pdf"
}
```

**Supported File Types:**
- PDF: `application/pdf`
- Word: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Excel: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Text: `text/plain`, `text/markdown`
- JSON: `application/json`

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": "File analysis results...",
    "file_name": "document.pdf",
    "file_type": "application/pdf",
    "tokens": 300,
    "cost": 0.04,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 6. Usage Statistics

Get your API usage statistics.

```http
GET /api/usage?period=30d
```

**Query Parameters:**
- `period`: `1d`, `7d`, `30d`, `90d`, `1y`

**Response:**
```json
{
  "success": true,
  "data": {
    "total_requests": 1250,
    "total_tokens": 45000,
    "total_cost": 6.75,
    "period": "30d",
    "daily_usage": [
      {
        "date": "2024-01-15",
        "requests": 45,
        "tokens": 1500,
        "cost": 0.23
      }
    ]
  }
}
```

### 7. API Key Management

#### List API Keys
```http
GET /api/keys
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "key_123",
      "name": "Production App",
      "key_prefix": "aap_abc123",
      "active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "last_used": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Create API Key
```http
POST /api/keys
```

**Request Body:**
```json
{
  "name": "My Application",
  "permissions": ["chat", "analyze", "generate-image"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "key_124",
    "name": "My Application",
    "key": "aap_full_api_key_here",
    "key_prefix": "aap_def456",
    "permissions": ["chat", "analyze", "generate-image"],
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

### Common Error Codes

- `INVALID_API_KEY`: API key is missing or invalid
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INVALID_REQUEST`: Request format is invalid
- `QUOTA_EXCEEDED`: Monthly quota exceeded
- `SERVICE_UNAVAILABLE`: AI service temporarily unavailable

### HTTP Status Codes

- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## SDKs and Examples

### JavaScript/Node.js

```javascript
const AIAssistant = require('ai-assistant-pro-sdk');

const client = new AIAssistant({
  apiKey: 'aap_your_api_key_here'
});

// Chat
const response = await client.chat({
  message: 'Explain this code',
  provider: 'chatgpt'
});

// Code Analysis
const analysis = await client.analyze({
  code: 'function add(a, b) { return a + b; }',
  language: 'javascript'
});

// Image Generation
const image = await client.generateImage({
  prompt: 'A beautiful landscape',
  size: '1024x1024'
});
```

### Python

```python
from ai_assistant_pro import Client

client = Client(api_key='aap_your_api_key_here')

# Chat
response = client.chat(
    message='Explain this code',
    provider='chatgpt'
)

# Code Analysis
analysis = client.analyze(
    code='def add(a, b): return a + b',
    language='python'
)

# Image Generation
image = client.generate_image(
    prompt='A beautiful landscape',
    size='1024x1024'
)
```

### cURL Examples

```bash
# Chat
curl -X POST https://api.aiassistantpro.com/v1/chat \
  -H "X-API-Key: aap_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, AI!", "provider": "chatgpt"}'

# Code Analysis
curl -X POST https://api.aiassistantpro.com/v1/analyze \
  -H "X-API-Key: aap_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"code": "function test() {}", "language": "javascript"}'

# Image Generation
curl -X POST https://api.aiassistantpro.com/v1/generate-image \
  -H "X-API-Key: aap_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A futuristic city", "size": "1024x1024"}'
```

## Webhooks

Set up webhooks to receive notifications about API events.

### Webhook Events

- `api_key.created`: New API key created
- `api_key.deactivated`: API key deactivated
- `quota.exceeded`: Monthly quota exceeded
- `usage.threshold`: Usage threshold reached

### Webhook Payload

```json
{
  "event": "api_key.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "key_id": "key_123",
    "name": "My Application"
  }
}
```

## Pricing

### Pay-per-Use
- **Chat/Analysis:** $0.02 per 1K tokens
- **Image Generation:** $0.04 per image
- **File Analysis:** $0.03 per file

### Monthly Plans
- **Starter:** $29/month - 50K tokens included
- **Pro:** $99/month - 200K tokens included
- **Enterprise:** Custom pricing

## Support

- **Documentation:** https://docs.aiassistantpro.com
- **Status Page:** https://status.aiassistantpro.com
- **Support Email:** api-support@aiassistantpro.com
- **Community:** https://community.aiassistantpro.com

## Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- Chat, analysis, and image generation endpoints
- API key management
- Usage statistics and monitoring

---

**Ready to get started?** [Create your first API key](https://app.aiassistantpro.com/api-keys) and start building with AI Assistant Pro!
