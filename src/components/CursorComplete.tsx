import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FileText, FolderOpen, Search, Settings, Play, Square, Mic, MicOff, 
  Camera, Image, Download, Upload, Trash2, Copy, Save, Share, 
  ThumbsUp, ThumbsDown, RefreshCw, Zap, Bot, Code, Terminal,
  ChevronUp, ChevronDown, ChevronLeft, Menu, X, Plus, Minus, Eye, EyeOff,
  Maximize2, Minimize2, RotateCcw, History, Bookmark, Star,
  MessageSquare, Users, Bell, HelpCircle, Github, Twitter,
  Monitor, Smartphone, Tablet, Wifi, WifiOff, Battery, Volume2, Send, Loader2, User
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula, vscDarkPlus, atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useBackendAIService, formatCost, formatTokens, formatTime, checkBackendHealth } from '../services/backendAIService';
import AISettings from './AISettings';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  provider?: string;
  cost?: number;
  tokens?: number;
  processingTime?: number;
}

interface File {
  name: string;
  content: string;
  type: 'file' | 'folder';
  language?: string;
  isOpen?: boolean;
  isActive?: boolean;
}

export default function CursorComplete() {
  const { chat, getAvailableModels, getProviderInfo } = useBackendAIService();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<string>('checking');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [fontSize, setFontSize] = useState<number>(14);
  const [showTerminal, setShowTerminal] = useState<boolean>(false);
  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const [showFileExplorer, setShowFileExplorer] = useState<boolean>(true);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const [files, setFiles] = useState<File[]>([
    { name: 'src/App.tsx', content: '// Your React App', type: 'file', language: 'typescript', isOpen: true, isActive: true },
    { name: 'src/components', content: '', type: 'folder' },
    { name: 'package.json', content: '{"name": "my-app"}', type: 'file', language: 'json' },
    { name: 'README.md', content: '# My Project', type: 'file', language: 'markdown' }
  ]);

  const availableModels = getAvailableModels('openai');
  const [selectedFile, setSelectedFile] = useState<File>(files[0]);

  useEffect(() => {
    if (availableModels.length > 0 && !selectedModel) {
      setSelectedModel(availableModels[0]);
    }
  }, [availableModels, selectedModel]);

  useEffect(() => {
    const checkHealth = async () => {
      const health = await checkBackendHealth();
      if (health) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('disconnected');
      }
    };
    checkHealth();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() === '' || !selectedModel) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiMessages = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await chat(aiMessages, 'openai', selectedModel);
      setMessages((prevMessages) => [...prevMessages, response]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: 'assistant',
          content: `Error: Could not get a response. ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording functionality would go here
  };

  const runCode = () => {
    const output = "Code executed successfully!";
    setTerminalOutput(prev => prev + `\n> ${output}`);
    setShowTerminal(true);
  };

  const renderMessageContent = (content: string) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={theme === 'dark' ? vscDarkPlus : dracula}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  const renderFileExplorer = () => (
    <div style={{
      width: sidebarCollapsed ? '40px' : '250px',
      background: theme === 'dark' ? '#1e1e1e' : '#f3f3f3',
      borderRight: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease'
    }}>
      <div style={{
        padding: '12px',
        borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {!sidebarCollapsed && (
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 'bold',
            color: theme === 'dark' ? '#ccc' : '#333'
          }}>
            EXPLORER
          </span>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            background: 'none',
            border: 'none',
            color: theme === 'dark' ? '#ccc' : '#333',
            cursor: 'pointer'
          }}
        >
          <ChevronLeft size={16} />
        </button>
      </div>
      
      {!sidebarCollapsed && (
        <div style={{ padding: '8px' }}>
          {files.map((file, index) => (
            <div
              key={index}
              onClick={() => {
                if (file.type === 'file') {
                  setSelectedFile(file);
                  setActiveTab('editor');
                }
              }}
              style={{
                padding: '6px 12px',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: theme === 'dark' ? '#ccc' : '#333',
                backgroundColor: selectedFile === file ? 
                  (theme === 'dark' ? '#2a2d2e' : '#e3e3e3') : 'transparent'
              }}
            >
              {file.type === 'folder' ? <FolderOpen size={14} /> : <FileText size={14} />}
              {file.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTopBar = () => (
    <div style={{
      height: '35px',
      background: theme === 'dark' ? '#2d2d30' : '#f0f0f0',
      borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#ff5f56'
        }} />
        <div style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#ffbd2e'
        }} />
        <div style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#27ca3f'
        }} />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => setShowSearch(!showSearch)}
          style={{
            background: 'none',
            border: 'none',
            color: theme === 'dark' ? '#ccc' : '#333',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <Search size={14} />
        </button>
        <button
          onClick={() => setShowSettings(true)}
          style={{
            background: 'none',
            border: 'none',
            color: theme === 'dark' ? '#ccc' : '#333',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <Settings size={14} />
        </button>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          style={{
            background: 'none',
            border: 'none',
            color: theme === 'dark' ? '#ccc' : '#333',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div style={{
      height: '35px',
      background: theme === 'dark' ? '#2d2d30' : '#f0f0f0',
      borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
      display: 'flex',
      alignItems: 'center'
    }}>
      {[
        { id: 'chat', name: 'Chat', icon: MessageSquare },
        { id: 'editor', name: selectedFile?.name || 'Editor', icon: Code },
        { id: 'terminal', name: 'Terminal', icon: Terminal },
        { id: 'git', name: 'Git', icon: Github }
      ].map(tab => {
        const IconComponent = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              height: '100%',
              padding: '0 16px',
              background: activeTab === tab.id ? 
                (theme === 'dark' ? '#1e1e1e' : '#fff') : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? 
                `2px solid ${theme === 'dark' ? '#007acc' : '#007acc'}` : '2px solid transparent',
              color: activeTab === tab.id ? 
                (theme === 'dark' ? '#fff' : '#333') : (theme === 'dark' ? '#ccc' : '#666'),
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px'
            }}
          >
            <IconComponent size={14} />
            {tab.name}
          </button>
        );
      })}
    </div>
  );

  const renderChatInterface = () => (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: theme === 'dark' ? '#1e1e1e' : '#fff'
    }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme === 'dark' ? '#666' : '#999',
            textAlign: 'center'
          }}>
            <Bot size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h2 style={{ fontSize: '24px', marginBottom: '8px', color: theme === 'dark' ? '#ccc' : '#333' }}>
              Welcome to Cursor AI
            </h2>
            <p style={{ fontSize: '16px', marginBottom: '24px' }}>
              Your intelligent coding assistant. Ask me anything about your code!
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              maxWidth: '600px'
            }}>
              {[
                "Explain this code",
                "Fix this bug",
                "Optimize performance",
                "Add error handling"
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInput(suggestion)}
                  style={{
                    padding: '12px 16px',
                    background: theme === 'dark' ? '#2a2d2e' : '#f5f5f5',
                    border: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
                    borderRadius: '8px',
                    color: theme === 'dark' ? '#ccc' : '#333',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textAlign: 'left'
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            {message.role === 'assistant' && (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #007acc, #005a9e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Bot size={16} color="white" />
              </div>
            )}
            
            <div
              style={{
                maxWidth: '70%',
                padding: '16px',
                borderRadius: '12px',
                background: message.role === 'user' ? 
                  (theme === 'dark' ? '#007acc' : '#e3f2fd') : 
                  (theme === 'dark' ? '#2a2d2e' : '#f5f5f5'),
                color: theme === 'dark' ? '#ccc' : '#333',
                border: message.role === 'user' ? 'none' : 
                  `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`
              }}
            >
              {renderMessageContent(message.content)}
              
              {message.role === 'assistant' && (
                <div style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '12px',
                  color: theme === 'dark' ? '#666' : '#999'
                }}>
                  <button style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Copy size={12} />
                    Copy
                  </button>
                  <button style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <ThumbsUp size={12} />
                    Good
                  </button>
                  <button style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <ThumbsDown size={12} />
                    Bad
                  </button>
                </div>
              )}
              
              <div style={{
                marginTop: '8px',
                fontSize: '11px',
                color: theme === 'dark' ? '#666' : '#999'
              }}>
                {new Date(message.timestamp).toLocaleTimeString()}
                {message.cost && message.tokens && (
                  <span style={{ marginLeft: '8px' }}>
                    • {formatTokens(message.tokens)} tokens • {formatCost(message.cost)}
                  </span>
                )}
              </div>
            </div>
            
            {message.role === 'user' && (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: theme === 'dark' ? '#444' : '#ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <User size={16} color={theme === 'dark' ? '#ccc' : '#333'} />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #007acc, #005a9e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Bot size={16} color="white" />
            </div>
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: theme === 'dark' ? '#2a2d2e' : '#f5f5f5',
              border: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: theme === 'dark' ? '#666' : '#999'
              }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                AI is thinking...
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div style={{
        padding: '16px',
        borderTop: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
        background: theme === 'dark' ? '#1e1e1e' : '#fff'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '12px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: theme === 'dark' ? '#666' : '#999'
            }}>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{
                  background: theme === 'dark' ? '#2a2d2e' : '#f5f5f5',
                  border: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
                  color: theme === 'dark' ? '#ccc' : '#333',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              >
                {availableModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              <span>•</span>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: backendStatus === 'connected' ? '#27ca3f' : '#ff5f56'
                }} />
                {backendStatus}
              </span>
            </div>
            
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Cursor AI anything about your code..."
              style={{
                width: '100%',
                minHeight: '60px',
                maxHeight: '200px',
                padding: '12px',
                background: theme === 'dark' ? '#2a2d2e' : '#f9f9f9',
                border: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
                borderRadius: '8px',
                color: theme === 'dark' ? '#ccc' : '#333',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none'
              }}
              disabled={isLoading}
            />
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              style={{
                padding: '12px 16px',
                background: isLoading ? (theme === 'dark' ? '#444' : '#ddd') : '#007acc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              <Send size={16} />
              Send
            </button>
            
            <div style={{
              display: 'flex',
              gap: '4px'
            }}>
              <button
                onClick={toggleRecording}
                style={{
                  padding: '8px',
                  background: isRecording ? '#ff5f56' : (theme === 'dark' ? '#2a2d2e' : '#f5f5f5'),
                  border: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: isRecording ? 'white' : (theme === 'dark' ? '#ccc' : '#333')
                }}
              >
                {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
              <button
                style={{
                  padding: '8px',
                  background: theme === 'dark' ? '#2a2d2e' : '#f5f5f5',
                  border: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: theme === 'dark' ? '#ccc' : '#333'
                }}
              >
                <Camera size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEditor = () => (
    <div style={{
      flex: 1,
      background: theme === 'dark' ? '#1e1e1e' : '#fff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        height: '40px',
        background: theme === 'dark' ? '#2d2d30' : '#f0f0f0',
        borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: '12px'
      }}>
        <button
          onClick={runCode}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: '#27ca3f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          <Play size={12} />
          Run
        </button>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: theme === 'dark' ? '#2a2d2e' : '#f5f5f5',
            border: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
            color: theme === 'dark' ? '#ccc' : '#333',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          <Save size={12} />
          Save
        </button>
        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: theme === 'dark' ? '#666' : '#999'
        }}>
          <span>{selectedFile?.language || 'Plain Text'}</span>
          <span>•</span>
          <span>Line 1, Col 1</span>
        </div>
      </div>
      
      <div style={{
        flex: 1,
        padding: '20px',
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        fontSize: `${fontSize}px`,
        lineHeight: '1.5',
        color: theme === 'dark' ? '#d4d4d4' : '#333',
        background: theme === 'dark' ? '#1e1e1e' : '#fff',
        overflow: 'auto'
      }}>
        <SyntaxHighlighter
          language={selectedFile?.language || 'typescript'}
          style={theme === 'dark' ? vscDarkPlus : atomDark}
          showLineNumbers
        >
          {selectedFile?.content || '// No file selected'}
        </SyntaxHighlighter>
      </div>
    </div>
  );

  const renderTerminal = () => (
    <div style={{
      flex: 1,
      background: theme === 'dark' ? '#1e1e1e' : '#fff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        height: '40px',
        background: theme === 'dark' ? '#2d2d30' : '#f0f0f0',
        borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: theme === 'dark' ? '#ccc' : '#333'
        }}>
          <Terminal size={14} />
          Terminal
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: theme === 'dark' ? '#666' : '#999'
        }}>
          <span>bash</span>
          <span>•</span>
          <span>~/project</span>
        </div>
      </div>
      
      <div
        ref={terminalRef}
        style={{
          flex: 1,
          padding: '12px',
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          fontSize: '13px',
          lineHeight: '1.4',
          color: theme === 'dark' ? '#d4d4d4' : '#333',
          background: theme === 'dark' ? '#0c0c0c' : '#f8f8f8',
          overflow: 'auto',
          whiteSpace: 'pre-wrap'
        }}
      >
        {terminalOutput || '$ Welcome to Cursor Terminal\n$ Type your commands here...'}
      </div>
    </div>
  );

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: theme === 'dark' ? '#1e1e1e' : '#fff',
      color: theme === 'dark' ? '#d4d4d4' : '#333',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {renderTopBar()}
      {renderTabs()}
      
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {showFileExplorer && renderFileExplorer()}
        
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {activeTab === 'chat' && renderChatInterface()}
          {activeTab === 'editor' && renderEditor()}
          {activeTab === 'terminal' && renderTerminal()}
          {activeTab === 'git' && (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme === 'dark' ? '#666' : '#999'
            }}>
              <div style={{ textAlign: 'center' }}>
                <Github size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>Git integration coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showSettings && <AISettings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
