import React, { useState, useRef, useEffect } from 'react'
import { 
  Send,
  Plus,
  MessageSquare,
  Settings,
  User,
  Crown,
  Sparkles,
  Brain,
  X,
  Menu,
  Trash2,
  Copy,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { aiService } from '../services/aiService'
import { SecureStorage } from '../utils/security'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  model?: string
  provider?: string
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  timestamp: Date
}

export default function CursorAIInterface() {
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: '1',
      title: 'AI Assistant Pro Demo',
      timestamp: new Date(),
      messages: [
        {
          id: '1',
          content: `# Welcome to AI Assistant Pro ✨

I have access to the most advanced AI models available:

**🚀 Latest Models Available:**
- **GPT-4o** - OpenAI's most capable model
- **o1-preview** - Advanced reasoning capabilities  
- **Claude 3.5 Sonnet** - Anthropic's flagship model
- **Gemini 2.0 Flash** - Google's cutting-edge AI

**💡 What I can help you with:**
- Complex reasoning and problem solving
- Code generation and debugging
- Creative writing and content creation
- Data analysis and visualization
- Research and information synthesis

How can I assist you today?`,
          role: 'assistant',
          timestamp: new Date(),
          model: 'GPT-4o',
          provider: 'OpenAI'
        }
      ]
    }
  ])
  
  const [currentSessionId, setCurrentSessionId] = useState('1')
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState('openai')
  const [selectedModel, setSelectedModel] = useState('gpt-4o')
  const [showSettings, setShowSettings] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [apiKeys, setApiKeys] = useState<{[key: string]: string}>({})
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0]

  const providers = [
    { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini'], color: 'text-green-400' },
    { id: 'anthropic', name: 'Anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'], color: 'text-orange-400' },
    { id: 'google', name: 'Google', models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro-latest'], color: 'text-blue-400' }
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentSession.messages])

  useEffect(() => {
    const keys = {
      openai: SecureStorage.getApiKey('openai') || '',
      anthropic: SecureStorage.getApiKey('anthropic') || '',
      google: SecureStorage.getApiKey('google') || ''
    }
    setApiKeys(keys)
  }, [])

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      timestamp: new Date()
    }
    setSessions(prev => [newSession, ...prev])
    setCurrentSessionId(newSession.id)
  }

  const deleteSession = (sessionId: string) => {
    if (sessions.length > 1) {
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (currentSessionId === sessionId) {
        setCurrentSessionId(sessions.find(s => s.id !== sessionId)?.id || sessions[0].id)
      }
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    }

    // Update session with user message
    setSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? { 
            ...session, 
            messages: [...session.messages, userMessage],
            title: session.messages.length === 0 ? input.trim().slice(0, 30) + (input.length > 30 ? '...' : '') : session.title
          }
        : session
    ))

    setInput('')
    setIsLoading(true)

    try {
      const apiKey = apiKeys[selectedProvider]
      if (!apiKey) {
        throw new Error(`${selectedProvider} API key not configured`)
      }

      const aiMessages = currentSession.messages.map(msg => ({
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
        provider: response.provider
      }

      setSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages: [...session.messages, assistantMessage] }
          : session
      ))

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to get response')
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

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="flex h-screen bg-white text-gray-900">
      {/* Sidebar - Cursor Style */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={createNewChat}
            className="w-full flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Chat</span>
          </button>
        </div>

        {/* Chat Sessions */}
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                currentSessionId === session.id 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => setCurrentSessionId(session.id)}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm truncate">{session.title}</span>
              </div>
              {sessions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSession(session.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                >
                  <Trash2 className="w-3 h-3 text-gray-500" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => setShowUpgrade(true)}
            className="w-full flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            <Crown className="w-4 h-4" />
            <span className="text-sm font-medium">Upgrade to Pro</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center space-x-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area - OpenAI Style */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">AI Assistant Pro</h1>
                <p className="text-xs text-gray-500">Powered by {selectedProvider} {selectedModel}</p>
              </div>
            </div>
          </div>

          {/* Model Selector */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value)
                setSelectedModel(providers.find(p => p.id === e.target.value)?.models[0] || '')
              }}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {providers.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {providers.find(p => p.id === selectedProvider)?.models.map(model => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {currentSession.messages.map((message) => (
              <div key={message.id} className="mb-8">
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-blue-600' 
                      : 'bg-gradient-to-r from-green-500 to-emerald-600'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-sm">
                        {message.role === 'user' ? 'You' : 'AI Assistant Pro'}
                      </span>
                      {message.model && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {message.model}
                        </span>
                      )}
                    </div>
                    
                    <div className="prose prose-sm max-w-none">
                      <div 
                        className="whitespace-pre-wrap leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: message.content
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
                            .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mb-3">$1</h1>')
                            .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mb-2">$1</h2>')
                            .replace(/^### (.*$)/gm, '<h3 class="text-base font-medium mb-2">$1</h3>')
                            .replace(/\n/g, '<br>')
                        }}
                      />
                    </div>

                    {/* Message Actions */}
                    <div className="flex items-center space-x-2 mt-3 opacity-0 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyMessage(message.content)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Copy message"
                      >
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
                      {message.role === 'assistant' && (
                        <>
                          <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Good response">
                            <ThumbsUp className="w-4 h-4 text-gray-500" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Bad response">
                            <ThumbsDown className="w-4 h-4 text-gray-500" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="mb-8">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-sm">AI Assistant Pro</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      <span className="text-sm text-gray-500 ml-2">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - OpenAI Style */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    adjustTextareaHeight()
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Message AI Assistant Pro..."
                  className="w-full p-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ minHeight: '44px', maxHeight: '200px' }}
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 bottom-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>{input.length} characters</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="sk-..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="sk-ant-..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Upgrade to AI Assistant Pro</h2>
              <button
                onClick={() => setShowUpgrade(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pro Plan */}
              <div className="border-2 border-blue-500 rounded-lg p-6 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">Pro</h3>
                  <div className="text-3xl font-bold mb-2">$20<span className="text-lg text-gray-500">/month</span></div>
                  <p className="text-gray-600">1,000 messages per month</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>GPT-4o access</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Claude 3.5 Sonnet</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Priority support</span>
                  </li>
                </ul>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors">
                  Upgrade to Pro
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                  <div className="text-3xl font-bold mb-2">$100<span className="text-lg text-gray-500">/month</span></div>
                  <p className="text-gray-600">Unlimited messages</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>All Pro features</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>o1-preview access</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>API access</span>
                  </li>
                </ul>
                <button className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-medium transition-colors">
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
