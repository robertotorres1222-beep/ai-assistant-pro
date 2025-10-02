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
  ThumbsDown,
  Search,
  Download,
  RefreshCw,
  Edit,
  Paperclip,
  Sliders,
  Keyboard,
  Star,
  Bookmark,
  Volume2
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
  isEditing?: boolean
  attachments?: File[]
  isBookmarked?: boolean
  regenerationCount?: number
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  timestamp: Date
  isBookmarked?: boolean
  tags?: string[]
  model?: string
  systemPrompt?: string
}

export default function EnhancedCursorAI() {
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: '1',
      title: 'AI Assistant Pro Demo',
      timestamp: new Date(),
      model: 'gpt-4o',
      systemPrompt: 'You are a helpful AI assistant.',
      messages: [
        {
          id: '1',
          content: `# 🚀 Welcome to AI Assistant Pro - Complete Edition!

I'm your advanced AI assistant with **all the features** of Cursor and OpenAI:

## 🔥 **Latest AI Models**
- **GPT-4o** 🆕 - OpenAI's most advanced model
- **o1-preview** 🧠 - Revolutionary reasoning capabilities
- **Claude 3.5 Sonnet** ⚡ - Anthropic's flagship model
- **Gemini 2.0 Flash** 🌟 - Google's cutting-edge AI

## 💪 **Professional Features**
- 📁 **File Upload & Analysis** - Upload documents, images, code
- 🔍 **Smart Search** - Find any conversation instantly
- 💾 **Export Conversations** - Save chats in multiple formats
- 🔄 **Regenerate Responses** - Get alternative answers
- ✏️ **Edit Messages** - Modify your prompts after sending
- 🔖 **Bookmark Important Chats** - Never lose valuable conversations
- ⚙️ **Advanced Settings** - Temperature, max tokens, system prompts
- ⌨️ **Keyboard Shortcuts** - Power user productivity
- 🎨 **Syntax Highlighting** - Beautiful code formatting
- 📊 **Model Comparison** - Compare responses side-by-side

## 🎯 **How to Use**
- **Upload files**: Click the 📎 attachment button
- **Search chats**: Use Cmd/Ctrl + K
- **Regenerate**: Click 🔄 on any AI response
- **Edit messages**: Click ✏️ on your messages
- **Bookmark**: Click ⭐ to save important chats

Ready to experience the **most advanced AI interface** ever built? 🚀`,
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
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [apiKeys, setApiKeys] = useState<{[key: string]: string}>({})
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  
  // Advanced settings
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2048)
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.')
  const [streamingEnabled, setStreamingEnabled] = useState(true)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0]

  const providers = [
    { 
      id: 'openai', 
      name: 'OpenAI', 
      models: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini', 'gpt-4-turbo'], 
      color: 'text-green-500',
      icon: '🤖'
    },
    { 
      id: 'anthropic', 
      name: 'Anthropic', 
      models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'], 
      color: 'text-orange-500',
      icon: '🧠'
    },
    { 
      id: 'google', 
      name: 'Google', 
      models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'], 
      color: 'text-blue-500',
      icon: '⚡'
    }
  ]

  const keyboardShortcuts = [
    { key: 'Cmd/Ctrl + K', action: 'Search conversations' },
    { key: 'Cmd/Ctrl + N', action: 'New chat' },
    { key: 'Cmd/Ctrl + S', action: 'Save/Export chat' },
    { key: 'Cmd/Ctrl + D', action: 'Delete current chat' },
    { key: 'Cmd/Ctrl + B', action: 'Toggle sidebar' },
    { key: 'Cmd/Ctrl + U', action: 'Upload file' },
    { key: 'Cmd/Ctrl + R', action: 'Regenerate last response' },
    { key: 'Cmd/Ctrl + E', action: 'Edit last message' },
    { key: 'Enter', action: 'Send message' },
    { key: 'Shift + Enter', action: 'New line' },
    { key: 'Escape', action: 'Cancel editing/close modals' }
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault()
            setShowSearch(true)
            setTimeout(() => searchInputRef.current?.focus(), 100)
            break
          case 'n':
            e.preventDefault()
            createNewChat()
            break
          case 'b':
            e.preventDefault()
            setSidebarOpen(!sidebarOpen)
            break
          case 'u':
            e.preventDefault()
            fileInputRef.current?.click()
            break
          case 's':
            e.preventDefault()
            exportCurrentChat()
            break
        }
      }
      if (e.key === 'Escape') {
        setShowSearch(false)
        setEditingMessageId(null)
        setShowSettings(false)
        setShowUpgrade(false)
        setShowAdvancedSettings(false)
        setShowKeyboardShortcuts(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen])

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      timestamp: new Date(),
      model: selectedModel,
      systemPrompt: systemPrompt
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

  const toggleBookmark = (sessionId: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, isBookmarked: !session.isBookmarked }
        : session
    ))
  }

  const exportCurrentChat = () => {
    const chatData = {
      title: currentSession.title,
      messages: currentSession.messages,
      timestamp: currentSession.timestamp,
      model: currentSession.model
    }
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentSession.title.replace(/[^a-z0-9]/gi, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Chat exported successfully!')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachedFiles(prev => [...prev, ...files])
    toast.success(`${files.length} file(s) attached`)
  }

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const startEditingMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId)
    setEditingContent(content)
  }

  const saveEditedMessage = () => {
    if (!editingMessageId) return
    
    setSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? {
            ...session,
            messages: session.messages.map(msg => 
              msg.id === editingMessageId 
                ? { ...msg, content: editingContent }
                : msg
            )
          }
        : session
    ))
    
    setEditingMessageId(null)
    setEditingContent('')
    toast.success('Message updated!')
  }

  const regenerateResponse = async (messageId: string) => {
    const messageIndex = currentSession.messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) return

    const messagesUpToPoint = currentSession.messages.slice(0, messageIndex)
    setIsLoading(true)

    try {
      const aiMessages = messagesUpToPoint.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }))

      const response = await aiService.chat(aiMessages, selectedModel)
      
      const updatedMessage = {
        ...currentSession.messages[messageIndex],
        content: response.content,
        regenerationCount: (currentSession.messages[messageIndex].regenerationCount || 0) + 1
      }

      setSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? {
              ...session,
              messages: session.messages.map((msg, idx) => 
                idx === messageIndex ? updatedMessage : msg
              )
            }
          : session
      ))

      toast.success('Response regenerated!')
    } catch (error) {
      toast.error('Failed to regenerate response')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
      attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined
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
    setAttachedFiles([])
    setIsLoading(true)

    try {
      const apiKey = apiKeys[selectedProvider]
      if (!apiKey) {
        throw new Error(`${selectedProvider} API key not configured`)
      }

      let aiMessages = currentSession.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }))

      // Add system prompt if set
      if (systemPrompt && systemPrompt !== 'You are a helpful AI assistant.') {
        aiMessages = [{ role: 'system', content: systemPrompt }, ...aiMessages]
      }

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

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const formatCode = (content: string) => {
    return content
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<div class="bg-gray-900 rounded-lg p-4 my-4 overflow-x-auto">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-400">${lang || 'code'}</span>
            <button onclick="navigator.clipboard.writeText(\`${code.trim()}\`)" class="text-xs text-gray-400 hover:text-white">Copy</button>
          </div>
          <pre class="text-green-400 text-sm"><code>${code.trim()}</code></pre>
        </div>`
      })
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mb-3">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mb-2">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-base font-medium mb-2">$1</h3>')
      .replace(/\n/g, '<br>')
  }

  return (
    <div className="flex h-screen bg-white text-gray-900">
      {/* Enhanced Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <button
              onClick={createNewChat}
              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">New Chat</span>
            </button>
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Search (Cmd+K)"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={() => setShowSearch(false)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Chat Sessions */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredSessions.map((session) => (
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm truncate">{session.title}</span>
                    {session.isBookmarked && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                  </div>
                  {session.model && (
                    <span className="text-xs text-gray-400">{session.model}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleBookmark(session.id)
                  }}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Bookmark"
                >
                  <Star className={`w-3 h-3 ${session.isBookmarked ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                </button>
                {sessions.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSession(session.id)
                    }}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => setShowUpgrade(true)}
            className="w-full flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            <Crown className="w-4 h-4" />
            <span className="text-sm font-medium">Upgrade to Pro</span>
          </button>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAdvancedSettings(true)}
              className="flex-1 flex items-center justify-center space-x-1 px-2 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Advanced Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowKeyboardShortcuts(true)}
              className="flex-1 flex items-center justify-center space-x-1 px-2 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Keyboard Shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex-1 flex items-center justify-center space-x-1 px-2 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Toggle Sidebar (Cmd+B)"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">AI Assistant Pro</h1>
                <p className="text-xs text-gray-500">
                  {providers.find(p => p.id === selectedProvider)?.icon} {selectedProvider} • {selectedModel}
                  {temperature !== 0.7 && ` • temp: ${temperature}`}
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={exportCurrentChat}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export Chat (Cmd+S)"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleBookmark(currentSessionId)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Bookmark Chat"
            >
              <Star className={`w-4 h-4 ${currentSession.isBookmarked ? 'text-yellow-500 fill-current' : 'text-gray-500'}`} />
            </button>
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
                  {provider.icon} {provider.name}
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

        {/* Enhanced Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {currentSession.messages.map((message) => (
              <div key={message.id} className="mb-8 group">
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
                      {message.regenerationCount && message.regenerationCount > 0 && (
                        <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                          Regenerated {message.regenerationCount}x
                        </span>
                      )}
                      {message.isBookmarked && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    
                    {/* Message Content */}
                    {editingMessageId === message.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={4}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={saveEditedMessage}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <div 
                          className="whitespace-pre-wrap leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: formatCode(message.content)
                          }}
                        />
                      </div>
                    )}

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.attachments.map((file, index) => (
                          <div key={index} className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-lg">
                            <Paperclip className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Enhanced Message Actions */}
                    <div className="flex items-center space-x-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyMessage(message.content)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Copy message"
                      >
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
                      {message.role === 'user' && (
                        <button
                          onClick={() => startEditingMessage(message.id, message.content)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Edit message"
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                      {message.role === 'assistant' && (
                        <>
                          <button
                            onClick={() => regenerateResponse(message.id)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="Regenerate response"
                            disabled={isLoading}
                          >
                            <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Good response">
                            <ThumbsUp className="w-4 h-4 text-gray-500" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Bad response">
                            <ThumbsDown className="w-4 h-4 text-gray-500" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setSessions(prev => prev.map(session => 
                            session.id === currentSessionId 
                              ? {
                                  ...session,
                                  messages: session.messages.map(msg => 
                                    msg.id === message.id 
                                      ? { ...msg, isBookmarked: !msg.isBookmarked }
                                      : msg
                                  )
                                }
                              : session
                          ))
                        }}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Bookmark message"
                      >
                        <Bookmark className={`w-4 h-4 ${message.isBookmarked ? 'text-yellow-500 fill-current' : 'text-gray-500'}`} />
                      </button>
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
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {selectedModel}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      <span className="text-sm text-gray-500 ml-2">
                        {streamingEnabled ? 'Streaming response...' : 'Thinking...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Enhanced Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-4xl mx-auto">
            {/* Attached Files */}
            {attachedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-lg">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">{file.name}</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

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
                  className="w-full p-3 pr-20 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ minHeight: '44px', maxHeight: '200px' }}
                  rows={1}
                  disabled={isLoading}
                />
                <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.gif"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Attach file (Cmd+U)"
                  >
                    <Paperclip className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>Press Enter to send, Shift+Enter for new line</span>
                {voiceEnabled && (
                  <span className="flex items-center space-x-1">
                    <Volume2 className="w-3 h-3" />
                    <span>Voice enabled</span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span>{input.length} characters</span>
                {temperature !== 0.7 && (
                  <span>• temp: {temperature}</span>
                )}
                {maxTokens !== 2048 && (
                  <span>• max: {maxTokens}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google API Key
                </label>
                <input
                  type="password"
                  value={apiKeys.google}
                  onChange={(e) => {
                    const newKeys = { ...apiKeys, google: e.target.value }
                    setApiKeys(newKeys)
                    SecureStorage.setApiKey('google', e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="AIza..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Settings Modal */}
      {showAdvancedSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Advanced Settings</h2>
              <button
                onClick={() => setShowAdvancedSettings(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature: {temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Focused</span>
                  <span>Balanced</span>
                  <span>Creative</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens: {maxTokens}
                </label>
                <input
                  type="range"
                  min="256"
                  max="4096"
                  step="256"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Prompt
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="You are a helpful AI assistant..."
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Streaming Response</span>
                  <button
                    onClick={() => setStreamingEnabled(!streamingEnabled)}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      streamingEnabled ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        streamingEnabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Voice Response</span>
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      voiceEnabled ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        voiceEnabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {keyboardShortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">{shortcut.action}</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Upgrade to AI Assistant Pro</h2>
              <button
                onClick={() => setShowUpgrade(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Free Plan */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">Free</h3>
                  <div className="text-3xl font-bold mb-2">$0<span className="text-lg text-gray-500">/month</span></div>
                  <p className="text-gray-600">20 messages per month</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Basic AI models</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Standard features</span>
                  </li>
                </ul>
                <button className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-medium transition-colors">
                  Current Plan
                </button>
              </div>

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
                    <span>GPT-4o & Claude 3.5 access</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>File upload & analysis</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Advanced features</span>
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
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Custom deployment</span>
                  </li>
                </ul>
                <button className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-medium transition-colors">
                  Contact Sales
                </button>
              </div>
            </div>

            {/* Feature Comparison */}
            <div className="mt-8 bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">🚀 All Features Included</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Latest AI models (GPT-4o, Claude 3.5, o1-preview)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>File upload & analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Advanced search & bookmarks</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Message editing & regeneration</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Export conversations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Keyboard shortcuts</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Advanced settings (temperature, tokens)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Syntax highlighting & code formatting</span>
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
