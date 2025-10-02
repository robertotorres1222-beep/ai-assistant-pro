import React, { useState, useRef, useEffect } from 'react'
import { 
  Send, 
  User, 
  Bot, 
  Copy, 
  Settings, 
  Sparkles, 
  Brain, 
  Zap, 
  Shield, 
  Eye,
  Code,
  Image as ImageIcon,
  FileText,
  MoreHorizontal,
  ChevronDown,
  X,
  Check
} from 'lucide-react'
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

interface ModernAIChatProps {
  className?: string
}

export default function ModernAIChat({ className = '' }: ModernAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `# Welcome to AI Assistant Pro ✨

I'm your advanced AI assistant with cutting-edge capabilities:

🧠 **Advanced Reasoning** - Complex problem solving with multiple reasoning strategies
🔧 **Tool Integration** - Execute code, search web, analyze files
👁️ **Vision Capabilities** - Analyze and understand images
🎨 **Creative Generation** - Create images, write code, design solutions
📊 **Data Processing** - Handle documents, spreadsheets, and complex data
🔒 **Enterprise Security** - Bank-level encryption and security
💡 **Intelligent Context** - Learn and remember from our conversations

Ready to explore the future of AI assistance?`,
      role: 'assistant',
      timestamp: new Date(),
      model: 'GPT-4 Turbo',
      provider: 'OpenAI'
    }
  ])
  
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('openai')
  const [selectedModel, setSelectedModel] = useState('gpt-4')
  const [showSettings, setShowSettings] = useState(false)
  const [showProviderMenu, setShowProviderMenu] = useState(false)
  const [apiKeys, setApiKeys] = useState<{[key: string]: string}>({})
  const [securityEnabled, setSecurityEnabled] = useState(true)
  const [enableTools, setEnableTools] = useState(true)
  const [enableMemory, setEnableMemory] = useState(true)
  const [streamingEnabled, setStreamingEnabled] = useState(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const keys = {
      openai: SecureStorage.getApiKey('openai') || '',
      anthropic: SecureStorage.getApiKey('anthropic') || '',
      google: SecureStorage.getApiKey('google') || ''
    }
    setApiKeys(keys)
  }, [])

  const providers = [
    { id: 'openai', name: 'OpenAI', icon: Brain, color: 'text-green-400', models: ['gpt-4', 'gpt-3.5-turbo'] },
    { id: 'anthropic', name: 'Anthropic', icon: Sparkles, color: 'text-orange-400', models: ['claude-3-sonnet', 'claude-3-haiku'] },
    { id: 'google', name: 'Google', icon: Zap, color: 'text-blue-400', models: ['gemini-pro', 'gemini-pro-vision'] }
  ]

  const currentProvider = providers.find(p => p.id === selectedProvider)

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

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
      const apiKey = apiKeys[selectedProvider]
      if (!apiKey) {
        throw new Error(`${selectedProvider} API key not configured. Please add it in settings.`)
      }

      const aiMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }))
      aiMessages.push({ role: 'user', content: userMessage.content })

      const response = await aiService.chat(aiMessages, {
        provider: selectedProvider,
        model: selectedModel,
        apiKey,
        stream: streamingEnabled,
        tools: enableTools,
        memory: enableMemory
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        role: 'assistant',
        timestamp: new Date(),
        model: response.model,
        provider: response.provider,
        tokens: response.tokens,
        cost: response.cost
      }

      setMessages(prev => [...prev, assistantMessage])
      toast.success(`Response generated using ${response.provider} ${response.model}`)
    } catch (error) {
      console.error('AI Chat Error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to get AI response')
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        role: 'assistant',
        timestamp: new Date(),
        model: 'Error',
        provider: selectedProvider
      }
      setMessages(prev => [...prev, errorMessage])
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

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Message copied to clipboard')
  }

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 text-gradient">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/\n/g, '<br>')
  }

  return (
    <div className={`flex flex-col h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 ${className}`}>
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">AI Assistant Pro</h1>
            <p className="text-xs text-gray-400">Advanced Intelligence Platform</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Provider Selector */}
          <div className="relative">
            <button
              onClick={() => setShowProviderMenu(!showProviderMenu)}
              className="flex items-center space-x-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
            >
              {currentProvider && (
                <>
                  <currentProvider.icon className={`w-4 h-4 ${currentProvider.color}`} />
                  <span className="text-sm text-white">{currentProvider.name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </>
              )}
            </button>
            
            {showProviderMenu && (
              <div className="absolute top-full mt-2 right-0 w-48 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl z-50 animate-scale-in">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => {
                      setSelectedProvider(provider.id)
                      setSelectedModel(provider.models[0])
                      setShowProviderMenu(false)
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-3 hover:bg-white/5 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <provider.icon className={`w-4 h-4 ${provider.color}`} />
                    <span className="text-sm text-white">{provider.name}</span>
                    {selectedProvider === provider.id && (
                      <Check className="w-4 h-4 text-green-400 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex space-x-4 animate-slide-up ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div
              className={`max-w-3xl ${
                message.role === 'user'
                  ? 'bg-blue-600/20 border-blue-500/30'
                  : 'bg-white/5 border-white/10'
              } border rounded-2xl p-4 backdrop-blur-sm`}
            >
              <div
                className="text-white leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
              />
              
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  {message.provider && (
                    <span className="px-2 py-1 bg-white/5 rounded-full">
                      {message.provider} {message.model}
                    </span>
                  )}
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.tokens && (
                    <span>{message.tokens} tokens</span>
                  )}
                </div>
                
                <button
                  onClick={() => copyMessage(message.content)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <Copy className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>
            
            {message.role === 'user' && (
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex space-x-4 animate-slide-up">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <span className="text-gray-400 text-sm ml-2">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything... (Shift+Enter for new line)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              rows={input.split('\n').length}
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-400 transition-colors">
              <Code className="w-3 h-3" />
              <span>Code</span>
            </button>
            <button className="flex items-center space-x-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-400 transition-colors">
              <ImageIcon className="w-3 h-3" />
              <span>Image</span>
            </button>
            <button className="flex items-center space-x-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-400 transition-colors">
              <FileText className="w-3 h-3" />
              <span>File</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            {securityEnabled && <Shield className="w-3 h-3 text-green-400" />}
            {enableTools && <Zap className="w-3 h-3 text-blue-400" />}
            {enableMemory && <Brain className="w-3 h-3 text-purple-400" />}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={apiKeys.openai}
                  onChange={(e) => {
                    const newKeys = { ...apiKeys, openai: e.target.value }
                    setApiKeys(newKeys)
                    SecureStorage.setApiKey('openai', e.target.value)
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="sk-..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Anthropic API Key
                </label>
                <input
                  type="password"
                  value={apiKeys.anthropic}
                  onChange={(e) => {
                    const newKeys = { ...apiKeys, anthropic: e.target.value }
                    setApiKeys(newKeys)
                    SecureStorage.setApiKey('anthropic', e.target.value)
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="sk-ant-..."
                />
              </div>
              
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Security Validation</span>
                  <button
                    onClick={() => setSecurityEnabled(!securityEnabled)}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      securityEnabled ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        securityEnabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Enable Tools</span>
                  <button
                    onClick={() => setEnableTools(!enableTools)}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      enableTools ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        enableTools ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Memory & Context</span>
                  <button
                    onClick={() => setEnableMemory(!enableMemory)}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      enableMemory ? 'bg-purple-500' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        enableMemory ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
