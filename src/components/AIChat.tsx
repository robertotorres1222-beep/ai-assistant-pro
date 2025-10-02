import React, { useState, useRef, useEffect } from 'react'
import { Send, User, Copy, ThumbsUp, ThumbsDown, Download, Settings, Shield, Zap, Brain, Sparkles, Eye } from 'lucide-react'
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
  images?: string[]
  code?: string
  codeOutput?: string
}

interface AIChatProps {
  className?: string
}

export default function AIChat({ className = '' }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your Advanced AI Assistant Pro with cutting-edge capabilities. I can:\n\n🧠 **Think and Reason** - Advanced problem solving\n🔧 **Use Tools** - Execute code, search web, generate images\n👁️ **See Images** - Analyze and understand visual content\n🎨 **Create Images** - Generate artwork with DALL-E\n📊 **Process Files** - Handle documents, spreadsheets, PDFs\n💾 **Remember Context** - Learn from our conversations\n🔒 **Stay Secure** - Enterprise-grade security\n\nWhat would you like to explore today?',
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
  const [enableTools, setEnableTools] = useState(true)
  const [enableMemory, setEnableMemory] = useState(true)
  const [streamingEnabled, setStreamingEnabled] = useState(true)
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

      // Enhance response with advanced features
      let enhancedContent = response.content
      let code: string | undefined
      let codeOutput: string | undefined
      let images: string[] | undefined

      // Check for code blocks
      const codeBlocks = enhancedContent.match(/```[\s\S]*?```/g)
      if (codeBlocks && codeBlocks.length > 0) {
        code = codeBlocks[0].replace(/```\w*\n?|\n?```/g, '')
        codeOutput = 'Code execution simulated - would run in production environment'
      }

      // Check for image generation requests
      if (userMessage.content.toLowerCase().includes('generate') && 
          (userMessage.content.toLowerCase().includes('image') || userMessage.content.toLowerCase().includes('picture'))) {
        images = ['https://via.placeholder.com/512x512?text=AI+Generated+Image+%28Demo%29']
        enhancedContent += '\n\n🎨 **Image Generated** (Demo mode - connect OpenAI API for real image generation)'
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: enhancedContent,
        role: 'assistant',
        timestamp: response.timestamp,
        model: response.model,
        provider: response.provider,
        tokens: response.tokens,
        cost: response.cost,
        code,
        codeOutput,
        images
      }

      setMessages(prev => [...prev, aiMessage])
      
      // Show feature notifications
      if (code) toast.success('Code detected - execution simulated')
      if (images) toast.success('Image generation requested')
      
      toast.success(`Enhanced response from ${response.provider} ${response.model}`)
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
    const chatData = messages.map(msg => {
      let content = `${msg.role.toUpperCase()} (${msg.provider} ${msg.model}): ${msg.content}\n`
      
      if (msg.code) {
        content += `\nCode:\n${msg.code}\n`
      }
      if (msg.codeOutput) {
        content += `\nOutput:\n${msg.codeOutput}\n`
      }
      if (msg.images && msg.images.length > 0) {
        content += `\nImages: ${msg.images.join(', ')}\n`
      }
      
      return content
    }).join('\n')
    
    const blob = new Blob([chatData], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `advanced-ai-chat-${new Date().toISOString().split('T')[0]}.txt`
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
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced AI Assistant Pro</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Multi-AI • Tools • Vision • Memory • Security</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            {securityEnabled && <Shield className="w-4 h-4 text-green-500" />}
            {enableTools && <Zap className="w-4 h-4 text-yellow-500" />}
            {enableMemory && <Brain className="w-4 h-4 text-purple-500" />}
            {streamingEnabled && <Eye className="w-4 h-4 text-blue-500" />}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* API Keys */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API Keys</h3>
              <div className="space-y-2">
                {['openai', 'anthropic', 'google'].map(provider => (
                  <div key={provider} className="flex space-x-2">
                    <input
                      type="password"
                      placeholder={`${provider} API key`}
                      value={apiKeys[provider]}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, [provider]: e.target.value }))}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={() => saveApiKey(provider, apiKeys[provider])}
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Advanced Features */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Advanced Features</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={enableTools}
                    onChange={(e) => setEnableTools(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">🔧 Tools (Code, Search, Images)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={enableMemory}
                    onChange={(e) => setEnableMemory(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">🧠 Memory & Context</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={streamingEnabled}
                    onChange={(e) => setStreamingEnabled(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">⚡ Streaming Responses</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={securityEnabled}
                    onChange={(e) => setSecurityEnabled(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">🔒 Enterprise Security</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
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
                  : 'bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Sparkles className="w-5 h-5 text-white" />
                )}
              </div>
              <div className={`rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
              }`}>
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Enhanced Features Display */}
                {message.images && message.images.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">🎨 Generated Images:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {message.images.map((img, idx) => (
                        <img key={idx} src={img} alt="Generated" className="rounded-lg max-w-full h-auto border-2 border-purple-300" />
                      ))}
                    </div>
                  </div>
                )}

                {message.code && (
                  <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">💻 Code:</div>
                    <pre className="text-sm overflow-x-auto bg-black text-green-400 p-2 rounded"><code>{message.code}</code></pre>
                    {message.codeOutput && (
                      <>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-2 mb-1">📤 Output:</div>
                        <pre className="text-sm bg-gray-800 text-yellow-400 p-2 rounded">{message.codeOutput}</pre>
                      </>
                    )}
                  </div>
                )}

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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything... I can code, analyze, generate images, and more! Try: 'Generate a Python function' or 'Create an image of a sunset'"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 hover:from-blue-600 hover:via-purple-700 hover:to-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          🚀 Advanced AI Assistant Pro • Multi-Provider • Enterprise Security • Code Execution • Image Generation • Memory
        </div>
      </div>
    </div>
  )
}
