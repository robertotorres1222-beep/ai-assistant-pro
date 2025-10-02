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
  Code,
  Image as ImageIcon,
  FileText,
  ChevronDown,
  X,
  Check,
  Crown,
  Star
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
      content: `# 🚀 Welcome to AI Assistant Pro - The Future is Here!

I'm powered by the **latest and most advanced AI models** available:

## 🔥 **NEW & CUTTING-EDGE MODELS**
- **GPT-4o** 🆕 - OpenAI's most advanced multimodal model
- **o1-preview** 🧠 - Revolutionary reasoning model for complex problems  
- **Claude 3.5 Sonnet** ⚡ - Anthropic's fastest and smartest model
- **Gemini 2.0 Flash** 🌟 - Google's latest experimental model

## 💪 **Advanced Capabilities**
🧠 **Superior Reasoning** - Complex problem solving with o1-preview
🔧 **Tool Mastery** - Execute code, search web, analyze files
👁️ **Vision Pro** - Advanced image analysis and understanding
🎨 **Creative Genius** - Generate images, write code, design solutions
📊 **Data Wizard** - Process documents, spreadsheets, complex data
🔒 **Fort Knox Security** - Enterprise-grade encryption and protection
💡 **Memory Palace** - Remember and learn from our conversations

## 🎯 **Why Choose AI Assistant Pro?**
✅ Access to **ALL** the latest AI models in one place
✅ **Faster** than ChatGPT, **Smarter** than Claude
✅ **No model switching** - I automatically choose the best model
✅ **Free tier** available - try before you buy!

Ready to experience the **next generation** of AI assistance? 🚀`,
      role: 'assistant',
      timestamp: new Date(),
      model: 'GPT-4o',
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
  const [showPricing, setShowPricing] = useState(false)
  const [currentPlan] = useState('free')
  
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
    { 
      id: 'openai', 
      name: 'OpenAI', 
      icon: Brain, 
      color: 'text-green-400', 
      models: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
      badge: 'NEW'
    },
    { 
      id: 'anthropic', 
      name: 'Anthropic', 
      icon: Sparkles, 
      color: 'text-orange-400', 
      models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
      badge: 'LATEST'
    },
    { 
      id: 'google', 
      name: 'Google', 
      icon: Zap, 
      color: 'text-blue-400', 
      models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro-latest', 'gemini-1.5-flash-latest', 'gemini-pro-vision', 'gemini-ultra'],
      badge: 'HOT'
    }
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

      const response = await aiService.chat(aiMessages, selectedModel)

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
          {/* Pricing Button */}
          <button
            onClick={() => setShowPricing(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            <Crown className="w-4 h-4 text-white" />
            <span className="text-sm text-white font-medium">Upgrade</span>
          </button>
          
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
                  {currentProvider.badge && (
                    <span className="px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                      {currentProvider.badge}
                    </span>
                  )}
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
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Streaming Response</span>
                  <button
                    onClick={() => setStreamingEnabled(!streamingEnabled)}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      streamingEnabled ? 'bg-cyan-500' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        streamingEnabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {showPricing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-screen p-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowPricing(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
              
              {/* Pricing Plans Content */}
              <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl p-8">
                <div className="text-center mb-12">
                  <h1 className="text-4xl font-bold text-white mb-4">
                    Unlock <span className="text-gradient">Premium AI Models</span>
                  </h1>
                  <p className="text-xl text-gray-400">
                    Get access to GPT-4o, Claude 3.5 Sonnet, o1-preview and more!
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Free Plan */}
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <div className="text-center mb-6">
                      <Star className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-bold text-white mb-2">Free</h3>
                      <div className="text-3xl font-bold text-white mb-2">$0</div>
                      <p className="text-gray-400 text-sm">20 messages/month</p>
                    </div>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">GPT-3.5 Turbo</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">Claude 3 Haiku</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">Basic features</span>
                      </li>
                    </ul>
                    <button 
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        currentPlan === 'free' 
                          ? 'bg-green-500/20 text-green-400 cursor-not-allowed' 
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                      disabled={currentPlan === 'free'}
                    >
                      {currentPlan === 'free' ? 'Current Plan' : 'Choose Free'}
                    </button>
                  </div>

                  {/* Pro Plan */}
                  <div className="bg-white/5 backdrop-blur-xl border-2 border-blue-500/50 rounded-2xl p-6 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                      Most Popular
                    </div>
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                      <div className="text-3xl font-bold text-white mb-2">$20</div>
                      <p className="text-gray-400 text-sm">1,000 messages/month</p>
                    </div>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">GPT-4o</span>
                        <span className="px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">NEW</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">Claude 3.5 Sonnet</span>
                        <span className="px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded-full">LATEST</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">Advanced reasoning</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">Priority support</span>
                      </li>
                    </ul>
                    <button className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all transform hover:scale-105">
                      Upgrade to Pro
                    </button>
                  </div>

                  {/* Enterprise Plan */}
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                        <Crown className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                      <div className="text-3xl font-bold text-white mb-2">$100</div>
                      <p className="text-gray-400 text-sm">Unlimited messages</p>
                    </div>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">o1-preview</span>
                        <span className="px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded-full">PREMIUM</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">All AI models</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">API access</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">Custom deployment</span>
                      </li>
                    </ul>
                    <button className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-medium transition-all transform hover:scale-105">
                      Contact Sales
                    </button>
                  </div>
                </div>

                {/* Features Highlight */}
                <div className="mt-12 text-center">
                  <h2 className="text-2xl font-bold text-white mb-8">
                    🚀 Latest AI Models Available
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-lg font-semibold text-white">GPT-4o</div>
                      <div className="text-xs text-green-400">NEW</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-lg font-semibold text-white">o1-preview</div>
                      <div className="text-xs text-purple-400">REASONING</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-lg font-semibold text-white">Claude 3.5</div>
                      <div className="text-xs text-orange-400">LATEST</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-lg font-semibold text-white">Gemini 2.0</div>
                      <div className="text-xs text-blue-400">HOT</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
