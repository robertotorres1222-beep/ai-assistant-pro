import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Mic, 
  MicOff, 
  Camera, 
  Image, 
  FileText, 
  Settings, 
  MoreVertical,
  Code,
  Search,
  Download,
  Upload,
  Trash2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Terminal,
  Folder,
  File,
  GitBranch,
  Zap,
  Brain,
  Play,
  Square,
  Maximize2,
  Minimize2,
  X,
  Menu,
  ChevronRight,
  ChevronDown as ChevronDownIcon
} from 'lucide-react'
import { useAIService, aiService, AIMessage, formatCost, formatTokens, formatTime } from '../services/aiService'
import toast from 'react-hot-toast'

interface CursorInterfaceProps {
  className?: string
}

interface FileNode {
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  isOpen?: boolean
}

interface Tab {
  id: string
  name: string
  content: string
  language: string
  isActive: boolean
}

const cursorModels = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable model' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Advanced reasoning' },
  { id: 'o1-preview', name: 'o1-preview', description: 'Superior reasoning' }
]

const fileTree: FileNode[] = [
  {
    name: 'src',
    type: 'folder',
    isOpen: true,
    children: [
      {
        name: 'components',
        type: 'folder',
        isOpen: true,
        children: [
          { name: 'App.tsx', type: 'file' },
          { name: 'Header.tsx', type: 'file' },
          { name: 'Sidebar.tsx', type: 'file' }
        ]
      },
      {
        name: 'services',
        type: 'folder',
        children: [
          { name: 'api.ts', type: 'file' },
          { name: 'auth.ts', type: 'file' }
        ]
      },
      { name: 'index.tsx', type: 'file' },
      { name: 'App.css', type: 'file' }
    ]
  },
  {
    name: 'public',
    type: 'folder',
    children: [
      { name: 'index.html', type: 'file' },
      { name: 'favicon.ico', type: 'file' }
    ]
  },
  { name: 'package.json', type: 'file' },
  { name: 'README.md', type: 'file' }
]

export default function CursorInterface({ className = '' }: CursorInterfaceProps) {
  const { 
    messages, 
    isProcessing, 
    currentModel, 
    setCurrentModel, 
    config, 
    setConfig,
    clearMessages 
  } = useAIService()
  
  const [input, setInput] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const [showTerminal, setShowTerminal] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: '1',
      name: 'App.tsx',
      content: `import React from 'react'
import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>Hello World</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}

export default App`,
      language: 'typescript',
      isActive: true
    }
  ])
  const [activeTabId, setActiveTabId] = useState('1')
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['$ Welcome to Cursor Terminal'])
  const [terminalInput, setTerminalInput] = useState('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  useEffect(() => {
    terminalRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [terminalOutput])
  
  const handleSend = async () => {
    if (!input.trim()) return
    
    try {
      await aiService.generateResponse(input, messages, currentModel)
      setInput('')
    } catch (error) {
      toast.error('Failed to send message')
      console.error(error)
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  const handleTerminalKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setTerminalOutput(prev => [...prev, `$ ${terminalInput}`])
      
      // Simulate command execution
      setTimeout(() => {
        setTerminalOutput(prev => [...prev, `Command executed: ${terminalInput}`])
        setTerminalInput('')
      }, 500)
    }
  }
  
  const openFile = (fileName: string) => {
    const newTab: Tab = {
      id: Date.now().toString(),
      name: fileName,
      content: `// ${fileName}\n\n// File content would be loaded here...`,
      language: getLanguageFromFileName(fileName),
      isActive: true
    }
    
    setTabs(prev => prev.map(tab => ({ ...tab, isActive: false })).concat(newTab))
    setActiveTabId(newTab.id)
  }
  
  const getLanguageFromFileName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'css': 'css',
      'html': 'html',
      'json': 'json',
      'md': 'markdown'
    }
    return languageMap[ext || ''] || 'text'
  }
  
  const closeTab = (tabId: string) => {
    const newTabs = tabs.filter(tab => tab.id !== tabId)
    if (newTabs.length > 0) {
      const activeTab = newTabs[newTabs.length - 1]
      activeTab.isActive = true
      setActiveTabId(activeTab.id)
    }
    setTabs(newTabs)
  }
  
  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node, index) => (
      <div key={index} style={{ paddingLeft: `${level * 16}px` }}>
        <div 
          className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded"
          onClick={() => {
            if (node.type === 'file') {
              openFile(node.name)
            } else {
              node.isOpen = !node.isOpen
              // Force re-render by updating state
            }
          }}
        >
          {node.type === 'folder' ? (
            <>
              {node.isOpen ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <Folder className="w-4 h-4 text-blue-500" />
            </>
          ) : (
            <>
              <div className="w-4 h-4" />
              <File className="w-4 h-4 text-gray-500" />
            </>
          )}
          <span className="text-sm">{node.name}</span>
        </div>
        {node.type === 'folder' && node.isOpen && node.children && renderFileTree(node.children, level + 1)}
      </div>
    ))
  }
  
  return (
    <div className={`flex flex-col h-screen bg-gray-900 text-white ${className}`}>
      {/* Top Menu Bar */}
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Code className="w-6 h-6 text-blue-400" />
            <span className="font-semibold">Cursor</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
              >
                <span className="text-sm">{cursorModels.find(m => m.id === currentModel)?.name}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {showModelSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"
                  >
                    {cursorModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setCurrentModel(model.id)
                          setShowModelSelector(false)
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors ${
                          currentModel === model.id ? 'bg-gray-700' : ''
                        }`}
                      >
                        <div className="font-medium">{model.name}</div>
                        <div className="text-sm text-gray-400">{model.description}</div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-700 rounded transition-colors">
            <GitBranch className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <Terminal className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 250, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-gray-800 border-r border-gray-700 overflow-hidden"
            >
              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">EXPLORER</h3>
                <div className="space-y-1">
                  {renderFileTree(fileTree)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Content Area */}
        <div className="flex flex-col flex-1">
          {/* Editor Tabs */}
          <div className="bg-gray-800 border-b border-gray-700">
            <div className="flex items-center">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`flex items-center gap-2 px-4 py-2 border-r border-gray-700 cursor-pointer ${
                    tab.isActive ? 'bg-gray-900' : 'bg-gray-800 hover:bg-gray-750'
                  }`}
                  onClick={() => {
                    setTabs(prev => prev.map(t => ({ ...t, isActive: t.id === tab.id })))
                    setActiveTabId(tab.id)
                  }}
                >
                  <span className="text-sm">{tab.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      closeTab(tab.id)
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Editor */}
          <div className="flex-1 bg-gray-900 p-4">
            <textarea
              value={tabs.find(t => t.isActive)?.content || ''}
              onChange={(e) => {
                const activeTab = tabs.find(t => t.isActive)
                if (activeTab) {
                  setTabs(prev => prev.map(tab => 
                    tab.id === activeTab.id ? { ...tab, content: e.target.value } : tab
                  ))
                }
              }}
              className="w-full h-full bg-transparent text-white font-mono text-sm resize-none outline-none"
              placeholder="Start coding..."
            />
          </div>
          
          {/* AI Chat Panel */}
          <div className="h-64 bg-gray-800 border-t border-gray-700 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold">AI Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1 hover:bg-gray-700 rounded">
                  <Zap className="w-4 h-4" />
                </button>
                <button className="p-1 hover:bg-gray-700 rounded">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.slice(-5).map((message, index) => (
                <div
                  key={index}
                  className={`text-sm ${
                    message.role === 'user' ? 'text-blue-400' : 'text-gray-300'
                  }`}
                >
                  <span className="font-semibold">{message.role === 'user' ? 'You' : 'AI'}:</span>
                  <span className="ml-2">{message.content.substring(0, 200)}...</span>
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  <span>AI is thinking...</span>
                </div>
              )}
            </div>
            
            <div className="p-3 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask AI to help with your code..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isProcessing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Terminal */}
      <AnimatePresence>
        {showTerminal && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 200, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-black border-t border-gray-700 overflow-hidden"
          >
            <div className="flex items-center justify-between p-2 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span className="text-sm font-semibold">Terminal</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1 hover:bg-gray-800 rounded">
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button className="p-1 hover:bg-gray-800 rounded">
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowTerminal(false)}
                  className="p-1 hover:bg-gray-800 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="h-full overflow-y-auto p-2 font-mono text-sm">
              {terminalOutput.map((line, index) => (
                <div key={index} className="text-green-400">
                  {line}
                </div>
              ))}
              
              <div className="flex items-center gap-2">
                <span className="text-green-400">$</span>
                <input
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyPress={handleTerminalKeyPress}
                  className="flex-1 bg-transparent text-white outline-none"
                  placeholder="Enter command..."
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div ref={messagesEndRef} />
    </div>
  )
}