import React, { useState, useRef, useEffect } from 'react'
import { 
  Send,
  Plus,
  MessageSquare,
  X,
  Menu,
  Copy,
  File,
  Folder,
  FolderOpen,
  Search,
  GitBranch,
  Terminal,
  Code,
  Sparkles,
  Brain
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

interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  children?: FileItem[]
  isOpen?: boolean
  content?: string
}

interface CursorInterfaceProps {
  className?: string
}

export default function CursorInterface({ className = '' }: CursorInterfaceProps) {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gpt-4o')
  const [showSettings, setShowSettings] = useState(false)
  const [apiKeys, setApiKeys] = useState<{[key: string]: string}>({})
  const [openFiles, setOpenFiles] = useState<string[]>(['welcome.md'])
  const [activeFile, setActiveFile] = useState('welcome.md')
  const [showComposer, setShowComposer] = useState(false)
  const [composerInput, setComposerInput] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)

  // Cursor's models
  const models = [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', badge: 'Latest' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', badge: 'Fast' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', badge: 'Smart' },
    { id: 'o1-preview', name: 'o1-preview', provider: 'OpenAI', badge: 'Reasoning' }
  ]

  // Mock file structure
  const [fileStructure] = useState<FileItem[]>([
    {
      id: '1',
      name: 'src',
      type: 'folder',
      isOpen: true,
      children: [
        { id: '2', name: 'components', type: 'folder', isOpen: false, children: [
          { id: '3', name: 'App.tsx', type: 'file' },
          { id: '4', name: 'Header.tsx', type: 'file' }
        ]},
        { id: '5', name: 'utils', type: 'folder', isOpen: false, children: [
          { id: '6', name: 'helpers.ts', type: 'file' }
        ]},
        { id: '7', name: 'index.tsx', type: 'file' }
      ]
    },
    { id: '8', name: 'package.json', type: 'file' },
    { id: '9', name: 'README.md', type: 'file' },
    { id: '10', name: 'welcome.md', type: 'file', content: `# Welcome to Cursor AI Assistant Pro

This is an exact replica of Cursor's interface with full AI capabilities.

## Features
- 🤖 **AI Chat** - Chat with GPT-4o, Claude, and other models
- 📝 **AI Composer** - Generate and edit code with AI
- 🔍 **Intelligent Search** - Find anything in your codebase
- 🧠 **Context Awareness** - AI understands your entire project
- ⚡ **Fast Performance** - Optimized for speed and efficiency

## Getting Started
1. Configure your API keys in settings
2. Start chatting with AI in the right sidebar
3. Use Cmd+K to open the composer
4. Explore your files in the left sidebar

Happy coding! 🚀` }
  ])

  // Cursor's welcome message
  const initialWelcomeMessage: Message = {
    id: 'welcome',
    content: `Hi! I'm your AI coding assistant. I can help you write, debug, and understand code. I have access to your codebase and can provide contextual assistance.

**What I can do:**
- Write and refactor code
- Debug and fix issues  
- Explain complex concepts
- Generate documentation
- Optimize performance
- And much more!

How can I help you today?`,
    role: 'assistant',
    timestamp: new Date(),
    model: 'GPT-4o',
    provider: 'OpenAI'
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

    const storedSessions = localStorage.getItem('cursorChatSessions')
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
        id: 'cursor-chat-' + Date.now(),
        title: 'New Chat',
        messages: [initialWelcomeMessage],
        createdAt: new Date()
      }
      setChatSessions([newSession])
      setCurrentChatId(newSession.id)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cursorChatSessions', JSON.stringify(chatSessions))
  }, [chatSessions])

  const currentChat = chatSessions.find(session => session.id === currentChatId)
  const messages = currentChat ? currentChat.messages : []

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: 'cursor-chat-' + Date.now(),
      title: 'New Chat',
      messages: [initialWelcomeMessage],
      createdAt: new Date()
    }
    setChatSessions(prev => [newSession, ...prev])
    setCurrentChatId(newSession.id)
    setInput('')
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const currentModel = models.find(m => m.id === selectedModel)
    const providerKey = currentModel?.provider.toLowerCase() === 'openai' ? 'openai' : 'anthropic'
    const apiKey = apiKeys[providerKey]
    
    if (!apiKey) {
      toast.error(`Please configure your ${currentModel?.provider} API key in settings first!`)
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
      if (currentChat && currentChat.title === 'New Chat') {
        const title = userMessage.content.split('\n')[0].substring(0, 30)
        setChatSessions(prevSessions => 
          prevSessions.map(session => 
            session.id === currentChatId 
              ? { ...session, title: title.length > 27 ? title + '...' : title } 
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

  const handleComposerSend = async () => {
    if (!composerInput.trim() || isLoading) return
    
    // For now, just show a toast - in real Cursor this would generate code
    toast.success('Composer request sent! (This is a demo)')
    setComposerInput('')
    setShowComposer(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setShowComposer(true)
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
      .replace(/`(.*?)`/g, '<code class="bg-gray-800 text-green-400 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-900 text-gray-100 p-3 rounded-lg my-2 overflow-x-auto border border-gray-700"><code class="text-sm font-mono">$1</code></pre>')
      .replace(/\n/g, '<br>')
  }

  const renderFileTree = (items: FileItem[], depth = 0) => {
    return items.map(item => (
      <div key={item.id}>
        <div 
          className={`flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer text-sm ${
            activeFile === item.name ? 'bg-gray-700 text-blue-400' : 'text-gray-300'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (item.type === 'file') {
              setActiveFile(item.name)
              if (!openFiles.includes(item.name)) {
                setOpenFiles(prev => [...prev, item.name])
              }
            }
          }}
        >
          {item.type === 'folder' ? (
            item.isOpen ? <FolderOpen className="w-4 h-4 mr-2" /> : <Folder className="w-4 h-4 mr-2" />
          ) : (
            <File className="w-4 h-4 mr-2" />
          )}
          <span>{item.name}</span>
        </div>
        {item.type === 'folder' && item.isOpen && item.children && (
          <div>
            {renderFileTree(item.children, depth + 1)}
          </div>
        )}
      </div>
    ))
  }

  const currentFile = fileStructure.find(f => f.name === activeFile) || 
                     fileStructure.flatMap(f => f.children || []).find(f => f.name === activeFile)

  return (
    <div className={`flex h-screen bg-gray-900 text-gray-100 ${className}`}>
      {/* Left Sidebar - File Explorer */}
      <div className={`${leftSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-200 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="p-3 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                <Code className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-100">Cursor</span>
            </div>
            <button 
              onClick={() => setLeftSidebarOpen(false)}
              className="p-1 hover:bg-gray-700 rounded text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex space-x-1">
            <button className="flex-1 p-2 bg-gray-700 rounded text-xs text-gray-300 hover:bg-gray-600">
              <Search className="w-4 h-4 mx-auto" />
            </button>
            <button className="flex-1 p-2 bg-gray-700 rounded text-xs text-gray-300 hover:bg-gray-600">
              <GitBranch className="w-4 h-4 mx-auto" />
            </button>
            <button className="flex-1 p-2 bg-gray-700 rounded text-xs text-gray-300 hover:bg-gray-600">
              <Terminal className="w-4 h-4 mx-auto" />
            </button>
          </div>
        </div>

        {/* File Tree */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-xs text-gray-400 mb-2 px-2">EXPLORER</div>
          {renderFileTree(fileStructure)}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Tab Bar */}
        <div className="flex items-center bg-gray-800 border-b border-gray-700 min-h-[40px]">
          {!leftSidebarOpen && (
            <button
              onClick={() => setLeftSidebarOpen(true)}
              className="p-2 hover:bg-gray-700 text-gray-400"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
          
          <div className="flex-1 flex items-center">
            {openFiles.map(file => (
              <div
                key={file}
                className={`flex items-center px-3 py-2 border-r border-gray-700 cursor-pointer text-sm ${
                  activeFile === file ? 'bg-gray-900 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                onClick={() => setActiveFile(file)}
              >
                <File className="w-4 h-4 mr-2" />
                <span>{file}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenFiles(prev => prev.filter(f => f !== file))
                    if (activeFile === file && openFiles.length > 1) {
                      setActiveFile(openFiles.find(f => f !== file) || '')
                    }
                  }}
                  className="ml-2 p-0.5 hover:bg-gray-600 rounded text-gray-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-2 px-3">
            <button
              onClick={() => setShowComposer(true)}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>⌘K</span>
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 bg-gray-900 p-4 overflow-y-auto">
          {activeFile === 'welcome.md' ? (
            <div className="max-w-4xl mx-auto">
              <div 
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: formatMessage(currentFile?.content || '') }}
              />
            </div>
          ) : (
            <div className="font-mono text-sm text-gray-300">
              <div className="mb-4 text-gray-500">// {activeFile}</div>
              <div className="space-y-2">
                <div><span className="text-purple-400">import</span> <span className="text-green-400">React</span> <span className="text-purple-400">from</span> <span className="text-yellow-400">'react'</span></div>
                <div></div>
                <div><span className="text-purple-400">function</span> <span className="text-blue-400">App</span>() {`{`}</div>
                <div className="ml-4"><span className="text-purple-400">return</span> (</div>
                <div className="ml-8">&lt;<span className="text-red-400">div</span> <span className="text-green-400">className</span>=<span className="text-yellow-400">"App"</span>&gt;</div>
                <div className="ml-12">&lt;<span className="text-red-400">h1</span>&gt;Hello Cursor!&lt;/<span className="text-red-400">h1</span>&gt;</div>
                <div className="ml-8">&lt;/<span className="text-red-400">div</span>&gt;</div>
                <div className="ml-4">)</div>
                <div>{`}`}</div>
                <div></div>
                <div><span className="text-purple-400">export</span> <span className="text-purple-400">default</span> <span className="text-blue-400">App</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Ln 1, Col 1</span>
            <span>UTF-8</span>
            <span>TypeScript React</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>✓ Prettier</span>
            <span>⚡ Cursor</span>
          </div>
        </div>
      </div>

      {/* Right Sidebar - AI Chat */}
      <div className={`${rightSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-200 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden`}>
        {/* Chat Header */}
        <div className="p-3 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-gray-100">AI Chat</span>
            </div>
            <div className="flex items-center space-x-1">
              <button 
                onClick={handleNewChat}
                className="p-1 hover:bg-gray-700 rounded text-gray-400"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setRightSidebarOpen(false)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Model Selector */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-blue-500"
          >
            {models.map(model => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-100'
              }`}>
                <div 
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  <button
                    onClick={() => copyToClipboard(message.content)}
                    className="p-1 hover:bg-gray-600 rounded text-gray-400"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-3 border-t border-gray-700">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI anything..."
              className="w-full resize-none bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 pr-10 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
              rows={1}
              style={{ maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 p-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Press ⌘K for Composer • {input.length}/2000
          </div>
        </div>
      </div>

      {/* Show sidebar buttons when collapsed */}
      {!rightSidebarOpen && (
        <button
          onClick={() => setRightSidebarOpen(true)}
          className="fixed right-4 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white shadow-lg"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}

      {/* Composer Modal */}
      {showComposer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-100">AI Composer</h2>
              </div>
              <button
                onClick={() => setShowComposer(false)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <textarea
                ref={composerRef}
                value={composerInput}
                onChange={(e) => setComposerInput(e.target.value)}
                placeholder="Describe what you want to build or modify..."
                className="w-full h-32 resize-none bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              
              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-gray-500">
                  AI will generate code based on your description
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowComposer(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleComposerSend}
                    disabled={!composerInput.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={apiKeys.openai}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                  onBlur={() => SecureStorage.setApiKey('openai', apiKeys.openai)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
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
                  onChange={(e) => setApiKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                  onBlur={() => SecureStorage.setApiKey('anthropic', apiKeys.anthropic)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="sk-ant-..."
                />
              </div>
              
              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  🔒 Your API keys are stored securely in your browser.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
