import React, { useState, useRef, useEffect } from 'react'
import { 
  Send,
  Plus,
  MessageSquare,
  Settings,
  User,
  X,
  Menu,
  Trash2,
  Copy,
  RotateCcw,
  Edit3,
  ChevronDown
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
  createdAt: Date
}

interface ClaudeInterfaceProps {
  className?: string
}

export default function ClaudeInterface({ className = '' }: ClaudeInterfaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('claude-3-5-sonnet-20241022')
  const [showSettings, setShowSettings] = useState(false)
  const [apiKeys, setApiKeys] = useState<{[key: string]: string}>({})
  const [showModelSelector, setShowModelSelector] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Claude's exact models and styling
  const models = [
    { 
      id: 'claude-3-5-sonnet-20241022', 
      name: 'Claude 3.5 Sonnet', 
      description: 'Most intelligent model',
      badge: 'Latest',
      badgeColor: 'bg-orange-100 text-orange-800'
    },
    { 
      id: 'claude-3-5-haiku-20241022', 
      name: 'Claude 3.5 Haiku', 
      description: 'Fastest model',
      badge: 'Fast',
      badgeColor: 'bg-green-100 text-green-800'
    },
    { 
      id: 'claude-3-opus-20240229', 
      name: 'Claude 3 Opus', 
      description: 'Powerful model for complex tasks',
      badge: 'Pro',
      badgeColor: 'bg-purple-100 text-purple-800'
    }
  ]

  const currentModel = models.find(m => m.id === selectedModel) || models[0]

  // Claude's welcome message
  const initialWelcomeMessage: Message = {
    id: 'welcome',
    content: `Hello! I'm Claude, an AI assistant created by Anthropic. I'm here to help with analysis, math, coding, creative writing, and much more. How can I assist you today?`,
    role: 'assistant',
    timestamp: new Date(),
    model: 'Claude 3.5 Sonnet',
    provider: 'Anthropic'
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatSessions, currentChatId])

  useEffect(() => {
    const keys = {
      openai: SecureStorage.getApiKey('openai') || '',
      anthropic: SecureStorage.getApiKey('anthropic') || '',
      google: SecureStorage.getApiKey('google') || ''
    }
    setApiKeys(keys)

    const storedSessions = localStorage.getItem('claudeChatSessions')
    if (storedSessions) {
      const parsedSessions: ChatSession[] = JSON.parse(storedSessions).map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt)
      }))
      setChatSessions(parsedSessions)
      if (parsedSessions.length > 0) {
        setCurrentChatId(parsedSessions[0].id)
      }
    } else {
      const newSession: ChatSession = {
        id: 'claude-chat-' + Date.now(),
        title: 'New conversation',
        messages: [initialWelcomeMessage],
        createdAt: new Date()
      }
      setChatSessions([newSession])
      setCurrentChatId(newSession.id)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('claudeChatSessions', JSON.stringify(chatSessions))
  }, [chatSessions])

  const currentChat = chatSessions.find(session => session.id === currentChatId)
  const messages = currentChat ? currentChat.messages : []

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: 'claude-chat-' + Date.now(),
      title: 'New conversation',
      messages: [initialWelcomeMessage],
      createdAt: new Date()
    }
    setChatSessions(prev => [newSession, ...prev])
    setCurrentChatId(newSession.id)
    setInput('')
  }

  const handleDeleteChat = (id: string) => {
    setChatSessions(prev => prev.filter(session => session.id !== id))
    if (currentChatId === id) {
      const remaining = chatSessions.filter(s => s.id !== id)
      setCurrentChatId(remaining.length > 0 ? remaining[0].id : null)
    }
    if (chatSessions.length === 1 && currentChatId === id) {
      handleNewChat()
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const apiKey = apiKeys.anthropic
    if (!apiKey) {
      toast.error('Please configure your Anthropic API key in settings first!')
      setShowSettings(true)
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    }

    setChatSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === currentChatId 
          ? { ...session, messages: [...session.messages, userMessage] } 
          : session
      )
    )
    setInput('')
    setIsLoading(true)

    try {
      const aiMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }))
      aiMessages.push({ role: 'user', content: userMessage.content })

      const response = await aiService.chat(aiMessages, selectedModel, apiKey)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        role: 'assistant',
        timestamp: new Date(),
        model: response.model,
        provider: response.provider
      }

      setChatSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === currentChatId 
            ? { ...session, messages: [...session.messages, assistantMessage] } 
            : session
        )
      )

      // Auto-title the chat
      if (currentChat && currentChat.title === 'New conversation') {
        const title = userMessage.content.split('\n')[0].substring(0, 50)
        setChatSessions(prevSessions => 
          prevSessions.map(session => 
            session.id === currentChatId 
              ? { ...session, title: title.length > 47 ? title + '...' : title } 
              : session
          )
        )
      }

    } catch (error) {
      console.error('AI Service Error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to get response')
      
      setChatSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === currentChatId 
            ? { ...session, messages: session.messages.filter(msg => msg.id !== userMessage.id) } 
            : session
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy'))
  }

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded-lg my-2 overflow-x-auto"><code class="text-sm font-mono">$1</code></pre>')
      .replace(/\n/g, '<br>')
  }

  return (
    <div className={`flex h-screen bg-white ${className}`}>
      {/* Claude's Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-200 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-md flex items-center justify-center">
                <span className="text-white text-xs font-bold">C</span>
              </div>
              <span className="font-semibold text-gray-900">Claude</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-200 rounded-md lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start new chat
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {chatSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setCurrentChatId(session.id)}
                className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                  currentChatId === session.id 
                    ? 'bg-gray-200 text-gray-900' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center min-w-0 flex-1">
                  <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-sm truncate">{session.title}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteChat(session.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-300 rounded transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            {/* Model Selector - Claude Style */}
            <div className="relative">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium">{currentModel.name}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showModelSelector && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    {models.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model.id)
                          setShowModelSelector(false)
                        }}
                        className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                          selectedModel === model.id ? 'bg-gray-100' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <div>
                              <div className="font-medium text-sm">{model.name}</div>
                              <div className="text-xs text-gray-500">{model.description}</div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${model.badgeColor}`}>
                            {model.badge}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.map((message) => (
              <div key={message.id} className={`mb-8 ${message.role === 'user' ? 'ml-12' : ''}`}>
                <div className="flex items-start space-x-3">
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">C</span>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    {message.role === 'user' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">You</span>
                      </div>
                    )}
                    
                    <div className="group relative">
                      <div 
                        className="prose prose-sm max-w-none text-gray-900 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                      />
                      
                      {/* Message Actions */}
                      <div className="flex items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => copyToClipboard(message.content)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {message.role === 'assistant' && (
                          <>
                            <button className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700">
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700">
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="mb-8">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">C</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
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
        </div>

        {/* Input Area - Claude Style */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-3xl mx-auto p-4">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Message Claude..."
                className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-900 placeholder-gray-500"
                rows={1}
                style={{ maxHeight: '200px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 p-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Claude can make mistakes. Please double-check responses.</span>
              <span>{input.length}/4000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anthropic API Key
                </label>
                <input
                  type="password"
                  value={apiKeys.anthropic}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                  onBlur={() => SecureStorage.setApiKey('anthropic', apiKeys.anthropic)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  placeholder="sk-ant-..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">console.anthropic.com</a>
                </p>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  🔒 Your API key is stored securely in your browser and never sent to our servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close model selector */}
      {showModelSelector && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowModelSelector(false)}
        />
      )}
    </div>
  )
}
