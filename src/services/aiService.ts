import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Types
export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIResponse {
  content: string
  model: string
  tokens?: number
  cost?: number
  provider: string
  timestamp: Date
}

export interface AIProvider {
  name: string
  models: string[]
  isAvailable: boolean
  maxTokens: number
  costPerToken: number
}

// AI Service Configuration
class AIService {
  private openai: OpenAI | null = null
  private anthropic: Anthropic | null = null
  private googleAI: GoogleGenerativeAI | null = null

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders() {
    // Initialize OpenAI
    if (import.meta.env.VITE_OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true // Only for demo - use backend in production
      })
    }

    // Initialize Anthropic
    if (import.meta.env.VITE_ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true // Only for demo - use backend in production
      })
    }

    // Initialize Google AI
    if (import.meta.env.VITE_GOOGLE_API_KEY) {
      this.googleAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY)
    }
  }

  // Get available providers
  getAvailableProviders(): AIProvider[] {
    return [
      {
        name: 'OpenAI',
        models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        isAvailable: !!this.openai,
        maxTokens: 128000,
        costPerToken: 0.00003
      },
      {
        name: 'Anthropic',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
        isAvailable: !!this.anthropic,
        maxTokens: 200000,
        costPerToken: 0.000015
      },
      {
        name: 'Google',
        models: ['gemini-pro', 'gemini-pro-vision'],
        isAvailable: !!this.googleAI,
        maxTokens: 32000,
        costPerToken: 0.000001
      }
    ]
  }

  // OpenAI Chat Completion
  async chatWithOpenAI(messages: AIMessage[], model: string = 'gpt-4'): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured')
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages: messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        })),
        max_tokens: 4000,
        temperature: 0.7,
        stream: false
      })

      const response = completion.choices[0]?.message?.content || 'No response generated'
      const tokens = completion.usage?.total_tokens || 0
      const cost = tokens * 0.00003 // Approximate cost

      return {
        content: response,
        model: model,
        tokens,
        cost,
        provider: 'OpenAI',
        timestamp: new Date()
      }
    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Anthropic Claude Chat
  async chatWithAnthropic(messages: AIMessage[], model: string = 'claude-3-sonnet'): Promise<AIResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic API key not configured')
    }

    try {
      // Convert messages to Anthropic format
      const systemMessage = messages.find(msg => msg.role === 'system')
      const conversationMessages = messages.filter(msg => msg.role !== 'system')
      
      const response = await this.anthropic.messages.create({
        model,
        max_tokens: 4000,
        temperature: 0.7,
        system: systemMessage?.content || 'You are a helpful AI assistant.',
        messages: conversationMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      })

      const content = response.content[0]?.type === 'text' ? response.content[0].text : 'No response generated'
      const tokens = response.usage.input_tokens + response.usage.output_tokens
      const cost = tokens * 0.000015 // Approximate cost

      return {
        content,
        model: model,
        tokens,
        cost,
        provider: 'Anthropic',
        timestamp: new Date()
      }
    } catch (error) {
      throw new Error(`Anthropic API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Google Gemini Chat
  async chatWithGoogle(messages: AIMessage[], model: string = 'gemini-pro'): Promise<AIResponse> {
    if (!this.googleAI) {
      throw new Error('Google AI API key not configured')
    }

    try {
      const genAI = this.googleAI.getGenerativeModel({ model })
      
      // Convert messages to Google format
      const prompt = messages.map(msg => 
        `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
      ).join('\n\n')

      const result = await genAI.generateContent(prompt)
      const response = await result.response
      const content = response.text() || 'No response generated'
      
      // Estimate tokens (rough approximation)
      const tokens = Math.ceil(content.length / 4) + Math.ceil(prompt.length / 4)
      const cost = tokens * 0.000001 // Approximate cost

      return {
        content,
        model: model,
        tokens,
        cost,
        provider: 'Google',
        timestamp: new Date()
      }
    } catch (error) {
      throw new Error(`Google AI API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Unified chat method
  async chat(messages: AIMessage[], provider: string, model?: string): Promise<AIResponse> {
    switch (provider.toLowerCase()) {
      case 'openai':
        return this.chatWithOpenAI(messages, model || 'gpt-4')
      case 'anthropic':
        return this.chatWithAnthropic(messages, model || 'claude-3-sonnet')
      case 'google':
        return this.chatWithGoogle(messages, model || 'gemini-pro')
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  }

  // Code analysis with AI
  async analyzeCode(code: string, language: string, provider: string = 'openai'): Promise<AIResponse> {
    const systemPrompt = `You are an expert code reviewer and software engineer. Analyze the following ${language} code and provide:
1. Code quality assessment
2. Potential bugs or issues
3. Performance optimizations
4. Security concerns
5. Best practices recommendations
6. Refactoring suggestions

Provide a comprehensive analysis with specific examples and actionable recommendations.`

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please analyze this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`` }
    ]

    return this.chat(messages, provider)
  }

  // Text summarization
  async summarizeText(text: string, provider: string = 'openai'): Promise<AIResponse> {
    const systemPrompt = 'You are an expert at creating concise, accurate summaries. Provide a clear and comprehensive summary of the given text.'

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please summarize this text:\n\n${text}` }
    ]

    return this.chat(messages, provider)
  }

  // Translation
  async translateText(text: string, targetLanguage: string, provider: string = 'openai'): Promise<AIResponse> {
    const systemPrompt = `You are a professional translator. Translate the given text to ${targetLanguage}. Maintain the original meaning, tone, and context.`

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Translate this text to ${targetLanguage}:\n\n${text}` }
    ]

    return this.chat(messages, provider)
  }

  // Creative writing
  async creativeWrite(prompt: string, style: string = 'professional', provider: string = 'openai'): Promise<AIResponse> {
    const systemPrompt = `You are a creative writing assistant. Write in a ${style} style. Be engaging, original, and creative while maintaining high quality.`

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]

    return this.chat(messages, provider)
  }

  // Health check for all providers
  async healthCheck(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {}

    // Test OpenAI
    try {
      if (this.openai) {
        await this.openai.models.list()
        results.openai = true
      } else {
        results.openai = false
      }
    } catch {
      results.openai = false
    }

    // Test Anthropic
    try {
      if (this.anthropic) {
        // Simple test message
        await this.anthropic.messages.create({
          model: 'claude-3-haiku',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }]
        })
        results.anthropic = true
      } else {
        results.anthropic = false
      }
    } catch {
      results.anthropic = false
    }

    // Test Google
    try {
      if (this.googleAI) {
        const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' })
        await model.generateContent('Hello')
        results.google = true
      } else {
        results.google = false
      }
    } catch {
      results.google = false
    }

    return results
  }
}

// Export singleton instance
export const aiService = new AIService()
export default aiService
