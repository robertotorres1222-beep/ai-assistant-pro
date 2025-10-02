import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Code, 
  File, 
  Folder, 
  Search, 
  Settings, 
  Terminal, 
  GitBranch, 
  Zap, 
  Brain,
  Menu,
  X,
  Maximize2,
  Minimize2,
  Square,
  Play,
  Save,
  Download,
  Upload,
  Copy,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Plus,
  Minus
} from 'lucide-react'

interface CursorSoftwareProps {
  className?: string
}

interface FileNode {
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  isOpen?: boolean
  content?: string
  language?: string
}

interface Tab {
  id: string
  name: string
  content: string
  language: string
  isActive: boolean
  isModified: boolean
}

export default function CursorSoftware({ className = '' }: CursorSoftwareProps) {
  const [showSidebar, setShowSidebar] = useState(true)
  const [showExplorer, setShowExplorer] = useState(true)
  const [showTerminal, setShowTerminal] = useState(false)
  const [showGit, setShowGit] = useState(false)
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['$ Welcome to Cursor Terminal'])
  const [terminalInput, setTerminalInput] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)

  useEffect(() => {
    // Initialize with sample file tree
    const sampleTree: FileNode[] = [
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
              { 
                name: 'App.tsx', 
                type: 'file',
                content: `import React from 'react'
import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>Welcome to Cursor</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}

export default App`,
                language: 'typescript'
              },
              { 
                name: 'Header.tsx', 
                type: 'file',
                content: `import React from 'react'

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="header">
      <h1>{title}</h1>
    </header>
  )
}`,
                language: 'typescript'
              }
            ]
          },
          {
            name: 'services',
            type: 'folder',
            children: [
              { 
                name: 'api.ts', 
                type: 'file',
                content: `export const API_BASE_URL = 'https://api.example.com'

export async function fetchData(endpoint: string) {
  const response = await fetch(\`\${API_BASE_URL}/\${endpoint}\`)
  return response.json()
}`,
                language: 'typescript'
              }
            ]
          },
          { 
            name: 'index.tsx', 
            type: 'file',
            content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`,
            language: 'typescript'
          }
        ]
      },
      {
        name: 'public',
        type: 'folder',
        children: [
          { 
            name: 'index.html', 
            type: 'file',
            content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
            language: 'html'
          }
        ]
      },
      { 
        name: 'package.json', 
        type: 'file',
        content: `{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "typescript": "^5.0.0"
  }
}`,
        language: 'json'
      }
    ]
    
    setFileTree(sampleTree)
  }, [])

  const openFile = (file: FileNode) => {
    if (file.type === 'file' && file.content) {
      const newTab: Tab = {
        id: Date.now().toString(),
        name: file.name,
        content: file.content,
        language: file.language || 'text',
        isActive: true,
        isModified: false
      }
      
      setTabs(prev => {
        const updatedTabs = prev.map(tab => ({ ...tab, isActive: false }))
        return [...updatedTabs, newTab]
      })
      setActiveTabId(newTab.id)
      setShowWelcome(false)
    }
  }

  const closeTab = (tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId)
      if (newTabs.length > 0) {
        const activeTab = newTabs[newTabs.length - 1]
        activeTab.isActive = true
        setActiveTabId(activeTab.id)
      } else {
        setActiveTabId(null)
        setShowWelcome(true)
      }
      return newTabs
    })
  }

  const updateTabContent = (tabId: string, content: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, content, isModified: true } : tab
    ))
  }

  const toggleFileTree = (node: FileNode, path: string[]) => {
    const updateNode = (nodes: FileNode[], currentPath: string[]): FileNode[] => {
      if (currentPath.length === 0) return nodes
      
      return nodes.map(n => {
        if (n.name === currentPath[0]) {
          if (currentPath.length === 1) {
            return { ...n, isOpen: !n.isOpen }
          } else {
            return { ...n, children: updateNode(n.children || [], currentPath.slice(1)) }
          }
        }
        return n
      })
    }
    
    setFileTree(prev => updateNode(prev, path))
  }

  const renderFileTree = (nodes: FileNode[], level = 0, path: string[] = []) => {
    return nodes.map((node, index) => (
      <div key={`${path.join('/')}/${node.name}`}>
        <div 
          className="flex items-center gap-2 py-1 px-2 hover:bg-gray-700 cursor-pointer rounded text-sm"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFileTree(node, [...path, node.name])
            } else {
              openFile(node)
            }
          }}
        >
          {node.type === 'folder' ? (
            <>
              {node.isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <Folder className="w-4 h-4 text-blue-400" />
            </>
          ) : (
            <>
              <div className="w-4 h-4" />
              <File className="w-4 h-4 text-gray-400" />
            </>
          )}
          <span className="text-gray-300">{node.name}</span>
        </div>
        {node.type === 'folder' && node.isOpen && node.children && 
          renderFileTree(node.children, level + 1, [...path, node.name])
        }
      </div>
    ))
  }

  const activeTab = tabs.find(tab => tab.id === activeTabId)

  return (
    <div className={`flex flex-col h-screen bg-gray-900 text-white ${className}`}>
      {/* Title Bar */}
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-400" />
            <span className="font-semibold">Cursor</span>
          </div>
          <span className="text-gray-400">•</span>
          <span className="text-sm text-gray-300">Untitled Workspace</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-gray-700 rounded">
            <Minus className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded">
            <Square className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="flex items-center p-1 bg-gray-800 border-b border-gray-700 text-sm">
        <div className="flex items-center gap-4 px-2">
          <span className="hover:bg-gray-700 px-2 py-1 rounded cursor-pointer">File</span>
          <span className="hover:bg-gray-700 px-2 py-1 rounded cursor-pointer">Edit</span>
          <span className="hover:bg-gray-700 px-2 py-1 rounded cursor-pointer">View</span>
          <span className="hover:bg-gray-700 px-2 py-1 rounded cursor-pointer">Go</span>
          <span className="hover:bg-gray-700 px-2 py-1 rounded cursor-pointer">Run</span>
          <span className="hover:bg-gray-700 px-2 py-1 rounded cursor-pointer">Terminal</span>
          <span className="hover:bg-gray-700 px-2 py-1 rounded cursor-pointer">Help</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
        <button className="p-2 hover:bg-gray-700 rounded">
          <Play className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded">
          <Save className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-gray-600" />
        <button className="p-2 hover:bg-gray-700 rounded">
          <GitBranch className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded">
          <Search className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        <button className="p-2 hover:bg-gray-700 rounded">
          <Brain className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded">
          <Zap className="w-4 h-4" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 250 }}
              exit={{ width: 0 }}
              className="bg-gray-800 border-r border-gray-700 overflow-hidden flex flex-col"
            >
              {/* Sidebar Tabs */}
              <div className="flex border-b border-gray-700">
                <button 
                  onClick={() => setShowExplorer(true)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm ${
                    showExplorer ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Folder className="w-4 h-4" />
                  Explorer
                </button>
                <button 
                  onClick={() => setShowGit(true)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm ${
                    showGit ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <GitBranch className="w-4 h-4" />
                  Git
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto">
                {showExplorer && (
                  <div className="p-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase">Explorer</h3>
                      <button className="p-1 hover:bg-gray-700 rounded">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {renderFileTree(fileTree)}
                  </div>
                )}
                
                {showGit && (
                  <div className="p-2">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Git</h3>
                    <div className="text-sm text-gray-300">
                      <div className="p-2 hover:bg-gray-700 rounded cursor-pointer">Changes</div>
                      <div className="p-2 hover:bg-gray-700 rounded cursor-pointer">Commits</div>
                      <div className="p-2 hover:bg-gray-700 rounded cursor-pointer">Branches</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex flex-col flex-1">
          {/* Editor Tabs */}
          {tabs.length > 0 && (
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
                    {tab.isModified && <div className="w-2 h-2 bg-orange-400 rounded-full" />}
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
          )}

          {/* Editor Area */}
          <div className="flex-1 bg-gray-900">
            {showWelcome ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Code className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-400 mb-2">Welcome to Cursor</h2>
                  <p className="text-gray-500">Open a file to start coding</p>
                </div>
              </div>
            ) : activeTab ? (
              <textarea
                value={activeTab.content}
                onChange={(e) => updateTabContent(activeTab.id, e.target.value)}
                className="w-full h-full bg-transparent text-white font-mono text-sm resize-none outline-none p-4"
                placeholder="Start coding..."
                spellCheck={false}
              />
            ) : null}
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between px-4 py-1 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span>Ln 1, Col 1</span>
              <span>Spaces: 2</span>
              <span>UTF-8</span>
              {activeTab && <span>{activeTab.language}</span>}
            </div>
            <div className="flex items-center gap-4">
              <span>Git: main</span>
              <button 
                onClick={() => setShowTerminal(!showTerminal)}
                className="hover:text-white"
              >
                Terminal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal */}
      <AnimatePresence>
        {showTerminal && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 200 }}
            exit={{ height: 0 }}
            className="bg-black border-t border-gray-700 overflow-hidden"
          >
            <div className="flex items-center justify-between p-2 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span className="text-sm font-semibold">Terminal</span>
              </div>
              <button 
                onClick={() => setShowTerminal(false)}
                className="p-1 hover:bg-gray-800 rounded"
              >
                <X className="w-4 h-4" />
              </button>
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
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      setTerminalOutput(prev => [...prev, `$ ${terminalInput}`])
                      setTerminalOutput(prev => [...prev, `Command executed: ${terminalInput}`])
                      setTerminalInput('')
                    }
                  }}
                  className="flex-1 bg-transparent text-white outline-none"
                  placeholder="Enter command..."
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}