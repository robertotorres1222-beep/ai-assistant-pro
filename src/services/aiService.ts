import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { create } from 'zustand'

// AI Service Types
export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
  metadata?: {
    model?: string
    tokens?: number
    cost?: number
    processingTime?: number
  }
}

export interface AIResponse {
  content: string
  model: string
  tokens: number
  cost: number
  processingTime: number
  reasoning?: string
  confidence?: number
}

export interface AIConfig {
  openaiApiKey?: string
  anthropicApiKey?: string
  googleApiKey?: string
  defaultModel: string
  temperature: number
  maxTokens: number
}

export interface AIProvider {
  name: string
  models: string[]
  isAvailable: boolean
  lastUsed?: Date
}

// AI Service Store
interface AIServiceStore {
  config: AIConfig
  providers: AIProvider[]
  messages: AIMessage[]
  isProcessing: boolean
  currentModel: string
  
  // Actions
  setConfig: (config: Partial<AIConfig>) => void
  addMessage: (message: AIMessage) => void
  clearMessages: () => void
  setProcessing: (processing: boolean) => void
  setCurrentModel: (model: string) => void
  updateProviders: (providers: AIProvider[]) => void
}

export const useAIService = create<AIServiceStore>((set, get) => ({
  config: {
    defaultModel: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 4000
  },
  providers: [
    {
      name: 'OpenAI',
      models: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini'],
      isAvailable: false
    },
    {
      name: 'Anthropic',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
      isAvailable: false
    },
    {
      name: 'Google',
      models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      isAvailable: false
    }
  ],
  messages: [],
  isProcessing: false,
  currentModel: 'gpt-4o',
  
  setConfig: (config) => set((state) => ({ 
    config: { ...state.config, ...config } 
  })),
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  clearMessages: () => set({ messages: [] }),
  
  setProcessing: (processing) => set({ isProcessing: processing }),
  
  setCurrentModel: (model) => set({ currentModel: model }),
  
  updateProviders: (providers) => set({ providers })
}))

// AI Service Class
class AIService {
  private openai?: OpenAI
  private anthropic?: Anthropic
  private google?: GoogleGenerativeAI
  
  constructor() {
    this.initializeProviders()
  }
  
  private initializeProviders() {
    const store = useAIService.getState()
    
    // Initialize OpenAI
    if (store.config.openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: store.config.openaiApiKey,
        dangerouslyAllowBrowser: true
      })
      store.updateProviders(
        store.providers.map(p => 
          p.name === 'OpenAI' ? { ...p, isAvailable: true } : p
        )
      )
    }
    
    // Initialize Anthropic
    if (store.config.anthropicApiKey) {
      this.anthropic = new Anthropic({
        apiKey: store.config.anthropicApiKey
      })
      store.updateProviders(
        store.providers.map(p => 
          p.name === 'Anthropic' ? { ...p, isAvailable: true } : p
        )
      )
    }
    
    // Initialize Google
    if (store.config.googleApiKey) {
      this.google = new GoogleGenerativeAI(store.config.googleApiKey)
      store.updateProviders(
        store.providers.map(p => 
          p.name === 'Google' ? { ...p, isAvailable: true } : p
        )
      )
    }
  }
  
  async generateResponse(
    message: string, 
    context: AIMessage[] = [],
    model?: string
  ): Promise<AIResponse> {
    const store = useAIService.getState()
    const selectedModel = model || store.currentModel
    const startTime = Date.now()
    
    store.setProcessing(true)
    
    try {
      let response: AIResponse
      
      // Route to appropriate provider based on model
      if (selectedModel.startsWith('gpt-') || selectedModel.startsWith('o1-')) {
        response = await this.generateWithOpenAI(message, context, selectedModel)
      } else if (selectedModel.startsWith('claude-')) {
        response = await this.generateWithAnthropic(message, context, selectedModel)
      } else if (selectedModel.startsWith('gemini-')) {
        response = await this.generateWithGoogle(message, context, selectedModel)
      } else {
        throw new Error(`Unknown model: ${selectedModel}`)
      }
      
      // Add to conversation history
      store.addMessage({
        role: 'user',
        content: message,
        timestamp: new Date()
      })
      
      store.addMessage({
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: {
          model: response.model,
          tokens: response.tokens,
          cost: response.cost,
          processingTime: response.processingTime
        }
      })
      
      return response
      
    } finally {
      store.setProcessing(false)
    }
  }
  
  private async generateWithOpenAI(
    message: string, 
    context: AIMessage[], 
    model: string
  ): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured')
    }
    
    const startTime = Date.now()
    const store = useAIService.getState()
    
    // Prepare messages
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      ...context.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      })),
      { role: 'user', content: message }
    ]
    
    const completion = await this.openai.chat.completions.create({
      model,
      messages,
      temperature: store.config.temperature,
      max_tokens: store.config.maxTokens,
      stream: false
    })
    
    const processingTime = Date.now() - startTime
    const response = completion.choices[0]?.message?.content || ''
    const tokens = completion.usage?.total_tokens || 0
    
    // Calculate cost (approximate)
    const cost = this.calculateOpenAICost(model, tokens)
    
    return {
      content: response,
      model,
      tokens,
      cost,
      processingTime,
      confidence: 0.9
    }
  }
  
  private async generateWithAnthropic(
    message: string, 
    context: AIMessage[], 
    model: string
  ): Promise<AIResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic API key not configured')
    }
    
    const startTime = Date.now()
    const store = useAIService.getState()
    
    // Prepare messages for Anthropic format
    const messages = context
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    
    // Add system message if present
    const systemMessage = context.find(msg => msg.role === 'system')?.content
    
    const completion = await this.anthropic.messages.create({
      model,
      max_tokens: store.config.maxTokens,
      temperature: store.config.temperature,
      system: systemMessage,
      messages: [
        ...messages,
        { role: 'user', content: message }
      ]
    })
    
    const processingTime = Date.now() - startTime
    const response = completion.content[0]?.type === 'text' 
      ? completion.content[0].text 
      : ''
    const tokens = (completion.usage?.input_tokens || 0) + (completion.usage?.output_tokens || 0)
    
    // Calculate cost (approximate)
    const cost = this.calculateAnthropicCost(model, tokens)
    
    return {
      content: response,
      model,
      tokens,
      cost,
      processingTime,
      confidence: 0.85
    }
  }
  
  private async generateWithGoogle(
    message: string, 
    context: AIMessage[], 
    model: string
  ): Promise<AIResponse> {
    if (!this.google) {
      throw new Error('Google API key not configured')
    }
    
    const startTime = Date.now()
    
    // Prepare context
    const contextText = context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n')
    
    const fullPrompt = contextText 
      ? `${contextText}\n\nUser: ${message}`
      : message
    
    const genModel = this.google.getGenerativeModel({ model })
    const result = await genModel.generateContent(fullPrompt)
    const response = await result.response
    
    const processingTime = Date.now() - startTime
    const content = response.text()
    const tokens = this.estimateTokens(content) // Google doesn't provide exact token count
    
    // Calculate cost (approximate)
    const cost = this.calculateGoogleCost(model, tokens)
    
    return {
      content,
      model,
      tokens,
      cost,
      processingTime,
      confidence: 0.8
    }
  }
  
  // Cost calculation methods
  private calculateOpenAICost(model: string, tokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'o1-preview': { input: 0.015, output: 0.06 },
      'o1-mini': { input: 0.003, output: 0.012 }
    }
    
    const price = pricing[model] || pricing['gpt-4o']
    // Assume 50/50 input/output split
    return (tokens * 0.5 * price.input + tokens * 0.5 * price.output) / 1000
  }
  
  private calculateAnthropicCost(model: string, tokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
      'claude-3-5-haiku-20241022': { input: 0.0008, output: 0.004 },
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 }
    }
    
    const price = pricing[model] || pricing['claude-3-5-sonnet-20241022']
    return (tokens * 0.5 * price.input + tokens * 0.5 * price.output) / 1000
  }
  
  private calculateGoogleCost(model: string, tokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'gemini-2.0-flash-exp': { input: 0.00075, output: 0.003 },
      'gemini-1.5-pro': { input: 0.0035, output: 0.0105 },
      'gemini-1.5-flash': { input: 0.00075, output: 0.003 }
    }
    
    const price = pricing[model] || pricing['gemini-1.5-pro']
    return (tokens * 0.5 * price.input + tokens * 0.5 * price.output) / 1000
  }
  
  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }
  
  // Vision capabilities
  async analyzeImage(imageData: string, prompt: string): Promise<AIResponse> {
    const store = useAIService.getState()
    
    if (!this.openai) {
      throw new Error('OpenAI API key required for vision capabilities')
    }
    
    const startTime = Date.now()
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: imageData,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    })
    
    const processingTime = Date.now() - startTime
    const response = completion.choices[0]?.message?.content || ''
    const tokens = completion.usage?.total_tokens || 0
    
    return {
      content: response,
      model: 'gpt-4o-vision',
      tokens,
      cost: this.calculateOpenAICost('gpt-4o', tokens),
      processingTime,
      confidence: 0.9
    }
  }
  
  // Function calling
  async callFunction(
    functionName: string, 
    parameters: Record<string, any>
  ): Promise<any> {
    // This would integrate with your function calling system
    // For now, return a placeholder
    return {
      function: functionName,
      parameters,
      result: 'Function executed successfully'
    }
  }
  
  // Streaming responses
  async *streamResponse(
    message: string, 
    context: AIMessage[] = [],
    model?: string
  ): AsyncGenerator<string, void, unknown> {
    const store = useAIService.getState()
    const selectedModel = model || store.currentModel
    
    if (!this.openai || !selectedModel.startsWith('gpt-')) {
      throw new Error('Streaming only available with OpenAI models')
    }
    
    const messages = [
      ...context.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      })),
      { role: 'user', content: message }
    ]
    
    const stream = await this.openai.chat.completions.create({
      model: selectedModel,
      messages,
      temperature: store.config.temperature,
      max_tokens: store.config.maxTokens,
      stream: true
    })
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  }
}

// Export singleton instance
export const aiService = new AIService()

// Utility functions
export const formatCost = (cost: number): string => {
  return `$${cost.toFixed(4)}`
}

export const formatTokens = (tokens: number): string => {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`
  }
  return tokens.toString()
}

export const formatTime = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`
  }
  return `${(ms / 1000).toFixed(1)}s`
}