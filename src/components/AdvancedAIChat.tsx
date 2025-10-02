import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Copy, ThumbsUp, ThumbsDown, Download, Settings, Shield, Zap } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { aiService } from '../services/aiService'
import { SecurityValidator, SecureStorage } from '../utils/security'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  model?: string
  provider?: string
  tokens?: number
  cost?: number
}

interface AIChatProps {
  className?: string
}

export default function AIChat({ className = '' }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI Assistant Pro. I can help you with coding, analysis, writing, and much more. I support multiple AI providers including OpenAI GPT-4, Anthropic Claude, and Google Gemini. What would you like to work on today?',
      role: 'assistant',
      timestamp: new Date(),
      model: 'GPT-4',
      provider: 'OpenAI'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('openai')
  const [selectedModel, setSelectedModel] = useState('gpt-4')
  const [showSettings, setShowSettings] = useState(false)
  const [apiKeys, setApiKeys] = useState<{[key: string]: string}>({})
  const [securityEnabled, setSecurityEnabled] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load API keys on component mount
  useEffect(() => {
    const keys = {
      openai: SecureStorage.getApiKey('openai') || '',
      anthropic: SecureStorage.getApiKey('anthropic') || '',
      google: SecureStorage.getApiKey('google') || ''
    }
    setApiKeys(keys)
  }, [])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    // Security validation
    if (securityEnabled) {
      try {
        SecurityValidator.sanitizeText(input)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Invalid input')
        return
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Check if API key is available
      const apiKey = apiKeys[selectedProvider]
      if (!apiKey) {
        throw new Error(`${selectedProvider} API key not configured. Please add it in settings.`)
      }

      // Convert messages to AI service format
      const aiMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }))

      // Add user message
      aiMessages.push({
        role: 'user',
        content: userMessage.content
      })

      // Get AI response
      const response = await aiService.chat(aiMessages, selectedProvider, selectedModel)

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        role: 'assistant',
        timestamp: response.timestamp,
        model: response.model,
        provider: response.provider,
        tokens: response.tokens,
        cost: response.cost
      }

      setMessages(prev => [...prev, aiMessage])
      toast.success(`Response from ${response.provider} ${response.model}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response'
      toast.error(errorMessage)
      
      // Add error message to chat
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: `❌ Error: ${errorMessage}`,
        role: 'assistant',
        timestamp: new Date(),
        model: selectedModel,
        provider: selectedProvider
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard!')
  }

  const downloadChat = () => {
    const chatData = messages.map(msg => 
      `${msg.role.toUpperCase()} (${msg.provider} ${msg.model}): ${msg.content}\n`
    ).join('\n')
    
    const blob = new Blob([chatData], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-chat-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const saveApiKey = (provider: string, key: string) => {
    try {
      if (key.trim()) {
        SecureStorage.setApiKey(provider, key.trim())
        setApiKeys(prev => ({ ...prev, [provider]: key.trim() }))
        toast.success(`${provider} API key saved securely`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save API key')
    }
  }

  const removeApiKey = (provider: string) => {
    SecureStorage.removeApiKey(provider)
    setApiKeys(prev => ({ ...prev, [provider]: '' }))
    toast.success(`${provider} API key removed`)
  }

  const getAvailableProviders = () => {
    return aiService.getAvailableProviders().filter(provider => 
      apiKeys[provider.name.toLowerCase()] || provider.name.toLowerCase() === 'openai'
    )
  }

  const getProviderModels = (provider: string) => {
    const providers = aiService.getAvailableProviders()
    const providerInfo = providers.find(p => p.name.toLowerCase() === provider.toLowerCase())
    return providerInfo?.models || []
  }

  return (
    <div className={`flex flex-col h-full bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant Pro</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Multi-AI Provider Support</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            {securityEnabled && <Shield className="w-4 h-4 text-green-500"  />}
            <Zap className="w-4 h-4 text-yellow-500"  />
          </div>
          <select 
            value={selectedProvider}
            onChange={(e) => {
              setSelectedProvider(e.target.value)
              const models = getProviderModels(e.target.value)
              if (models.length > 0) {
                setSelectedModel(models[0])
              }
            }}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {getAvailableProviders().map(provider => (
              <option key={provider.name} value={provider.name.toLowerCase()}>
                {provider.name}
              </option>
            ))}
          </select>
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {getProviderModels(selectedProvider).map(model => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={downloadChat}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="Download chat"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                OpenAI API Key
              </label>
              <div className="flex space-x-2">
                <input
                  type="password"
                  placeholder="sk-..."
                  value={apiKeys.openai}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => saveApiKey('openai', apiKeys.openai)}
                  className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Save
                </button>
                {apiKeys.openai && (
                  <button
                    onClick={() => removeApiKey('openai')}
                    className="px-3 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Anthropic API Key
              </label>
              <div className="flex space-x-2">
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  value={apiKeys.anthropic}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => saveApiKey('anthropic', apiKeys.anthropic)}
                  className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Save
                </button>
                {apiKeys.anthropic && (
                  <button
                    onClick={() => removeApiKey('anthropic')}
                    className="px-3 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Google AI API Key
              </label>
              <div className="flex space-x-2">
                <input
                  type="password"
                  placeholder="AIza..."
                  value={apiKeys.google}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, google: e.target.value }))}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => saveApiKey('google', apiKeys.google)}
                  className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Save
                </button>
                {apiKeys.google && (
                  <button
                    onClick={() => removeApiKey('google')}
                    className="px-3 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="security"
                checked={securityEnabled}
                onChange={(e) => setSecurityEnabled(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="security" className="text-sm text-gray-700 dark:text-gray-300">
                Enable Enterprise Security
              </label>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Close Settings
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-4xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} space-x-3`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-blue-500' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>
              <div className={`rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
              }`}>
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className={`flex items-center justify-between mt-2 text-xs ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  <div className="flex items-center space-x-2">
                    {message.provider && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                        {message.provider} {message.model}
                      </span>
                    )}
                    {message.tokens && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
                        {message.tokens} tokens
                      </span>
                    )}
                    {message.cost && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded-full">
                        ${message.cost.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>
                {message.role === 'assistant' && (
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      onClick={() => copyToClipboard(message.content)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Copy response"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Good response"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Poor response"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything... (Press Enter to send, Shift+Enter for new line)"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          AI Assistant Pro supports OpenAI GPT-4, Anthropic Claude, and Google Gemini. Enterprise security enabled.
        </div>
      </div>
    </div>
  )
}
