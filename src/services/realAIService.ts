import { create } from 'zustand'

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: {
    model: string
    tokens: number
    cost: number
    processingTime: number
  }
}

export interface AIConfig {
  temperature: number
  maxTokens: number
  model: string
  provider: string
}

interface AIStore {
  messages: AIMessage[]
  isProcessing: boolean
  currentModel: string
  config: AIConfig
  setCurrentModel: (model: string) => void
  setConfig: (config: Partial<AIConfig>) => void
  addMessage: (message: AIMessage) => void
  setProcessing: (processing: boolean) => void
  clearMessages: () => void
}

export const useAIStore = create<AIStore>((set, get) => ({
  messages: [],
  isProcessing: false,
  currentModel: 'gpt-4o',
  config: {
    temperature: 0.7,
    maxTokens: 4000,
    model: 'gpt-4o',
    provider: 'openai'
  },
  setCurrentModel: (model) => set({ currentModel: model }),
  setConfig: (newConfig) => set((state) => ({ 
    config: { ...state.config, ...newConfig } 
  })),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  setProcessing: (processing) => set({ isProcessing: processing }),
  clearMessages: () => set({ messages: [] })
}))

// Real AI Service Implementation
export class RealAIService {
  private openaiApiKey: string | null = null
  private anthropicApiKey: string | null = null
  private googleApiKey: string | null = null
  private currentModel: string = 'gpt-4o'

  constructor() {
    this.loadApiKeys()
  }

  private loadApiKeys() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('openai_api_key')
    this.anthropicApiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || localStorage.getItem('anthropic_api_key')
    this.googleApiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY || localStorage.getItem('google_api_key')
  }

  setApiKey(provider: string, apiKey: string) {
    switch (provider) {
      case 'openai':
        this.openaiApiKey = apiKey
        localStorage.setItem('openai_api_key', apiKey)
        break
      case 'anthropic':
        this.anthropicApiKey = apiKey
        localStorage.setItem('anthropic_api_key', apiKey)
        break
      case 'google':
        this.googleApiKey = apiKey
        localStorage.setItem('google_api_key', apiKey)
        break
    }
  }

  async generateResponse(
    message: string, 
    context: AIMessage[] = [], 
    model: string = 'gpt-4o',
    provider: string = 'openai'
  ): Promise<string> {
    const startTime = Date.now()
    
    try {
      let response: string

      switch (provider) {
        case 'openai':
          response = await this.callOpenAI(message, context, model)
          break
        case 'anthropic':
          response = await this.callAnthropic(message, context, model)
          break
        case 'google':
          response = await this.callGoogle(message, context, model)
          break
        default:
          throw new Error(`Unsupported provider: ${provider}`)
      }

      const processingTime = Date.now() - startTime

      // Add response message to store
      const store = useAIStore.getState()
      store.addMessage({
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        metadata: {
          model,
          tokens: this.estimateTokens(response),
          cost: this.calculateCost(provider, this.estimateTokens(response)),
          processingTime
        }
      })

      return response

    } catch (error) {
      console.error('AI Service Error:', error)
      throw error
    }
  }

  private async callOpenAI(message: string, context: AIMessage[], model: string): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const messages = [
      ...context.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user' as const, content: message }
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4000
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API Error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'No response generated'
  }

  private async callAnthropic(message: string, context: AIMessage[], model: string): Promise<string> {
    if (!this.anthropicApiKey) {
      throw new Error('Anthropic API key not configured')
    }

    const conversation = context.map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`).join('\n\n')
    const fullPrompt = `${conversation}\n\nHuman: ${message}\n\nAssistant:`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.anthropicApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        messages: [{ role: 'user', content: fullPrompt }]
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Anthropic API Error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.content[0]?.text || 'No response generated'
  }

  private async callGoogle(message: string, context: AIMessage[], model: string): Promise<string> {
    if (!this.googleApiKey) {
      throw new Error('Google AI API key not configured')
    }

    const conversation = context.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n\n')
    const fullPrompt = `${conversation}\n\nUser: ${message}\n\nAssistant:`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Google AI API Error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.candidates[0]?.content?.parts[0]?.text || 'No response generated'
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }

  private calculateCost(provider: string, tokens: number): number {
    const pricing = {
      openai: {
        'gpt-4o': 0.005 / 1000, // $5 per 1M input tokens
        'gpt-4o-mini': 0.00015 / 1000, // $0.15 per 1M input tokens
        'o1-preview': 0.015 / 1000 // $15 per 1M input tokens
      },
      anthropic: {
        'claude-3-5-sonnet-20241022': 0.003 / 1000, // $3 per 1M input tokens
        'claude-3-5-haiku-20241022': 0.00025 / 1000 // $0.25 per 1M input tokens
      },
      google: {
        'gemini-2.0-flash-exp': 0.000075 / 1000, // $0.075 per 1M input tokens
        'gemini-1.5-pro': 0.00125 / 1000 // $1.25 per 1M input tokens
      }
    }

    return (pricing as any)[provider]?.[this.currentModel] * tokens || 0
  }

  getAvailableModels(): { provider: string; models: string[] }[] {
    return [
      {
        provider: 'openai',
        models: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini']
      },
      {
        provider: 'anthropic',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022']
      },
      {
        provider: 'google',
        models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro']
      }
    ]
  }
}

export const realAIService = new RealAIService()

// Utility functions
export const formatCost = (cost: number): string => {
  return cost < 0.01 ? '< $0.01' : `$${cost.toFixed(4)}`
}

export const formatTokens = (tokens: number): string => {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`
  }
  return tokens.toString()
}

export const formatTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}
