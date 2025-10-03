import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, FolderOpen, Search, Settings, Play, Mic, MicOff, 
  Camera, Copy, Save, ThumbsUp, ThumbsDown, Bot, Code, Terminal,
  ChevronUp, ChevronDown, ChevronLeft, Menu, X, Plus, Minus,
  Maximize2, Minimize2, MessageSquare, Github, Send, Loader2, User,
  Zap, Brain, Sparkles, Star, Shield, Lock, Key
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
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

export default function DashAI() {
  const { chat, getAvailableModels, getProviderInfo } = useBackendAIService();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<string>('checking');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [theme] = useState<'dark'>('dark');
  const [showTerminal, setShowTerminal] = useState<boolean>(false);
  const [terminalOutput, setTerminalOutput] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const availableModels = getAvailableModels('openai');

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

  const renderMessageContent = (content: string) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
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

  const renderTopBar = () => (
    <div style={{
      height: '40px',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      borderBottom: '1px solid #2d3748',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
          boxShadow: '0 0 10px rgba(255, 107, 107, 0.5)'
        }} />
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #feca57, #ff9ff3)',
          boxShadow: '0 0 10px rgba(254, 202, 87, 0.5)'
        }} />
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #48dbfb, #0abde3)',
          boxShadow: '0 0 10px rgba(72, 219, 251, 0.5)'
        }} />
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: backendStatus === 'connected' ? '#00ff88' : '#ff4757',
            boxShadow: `0 0 10px ${backendStatus === 'connected' ? 'rgba(0,255,136,0.5)' : 'rgba(255,71,87,0.5)'}`
          }} />
          <span style={{
            fontSize: '12px',
            color: '#e2e8f0',
            fontWeight: '500'
          }}>
            {backendStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <button
          onClick={() => setShowSettings(true)}
          style={{
            padding: '8px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '8px',
            color: '#e2e8f0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Key size={16} />
        </button>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div style={{
      height: '50px',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
      borderBottom: '1px solid #2d3748',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: '8px'
    }}>
      {[
        { id: 'chat', name: 'Kursa Chat', icon: MessageSquare, color: '#00d4ff' },
        { id: 'code', name: 'Code Assistant', icon: Code, color: '#ff6b6b' },
        { id: 'terminal', name: 'Terminal', icon: Terminal, color: '#feca57' }
      ].map(tab => {
        const IconComponent = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              height: '40px',
              padding: '0 20px',
              background: activeTab === tab.id ? 
                `linear-gradient(135deg, ${tab.color}20, ${tab.color}10)` : 'transparent',
              border: 'none',
              borderRadius: '12px',
              color: activeTab === tab.id ? tab.color : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              borderBottom: activeTab === tab.id ? `3px solid ${tab.color}` : '3px solid transparent'
            }}
          >
            <IconComponent size={18} />
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
      background: 'linear-gradient(135deg, #0f0f23 0%, #16213e 100%)'
    }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {messages.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            padding: '40px'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '30px',
              boxShadow: '0 20px 40px rgba(0,212,255,0.3)'
            }}>
              <Brain size={48} color="white" />
            </div>
            
            <h1 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #00d4ff 0%, #ff6b6b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '16px'
            }}>
              Kursa
            </h1>
            
            <p style={{
              fontSize: '18px',
              color: '#94a3b8',
              marginBottom: '40px',
              maxWidth: '600px',
              lineHeight: '1.6'
            }}>
              Your intelligent coding companion. Ask me anything about programming, 
              get help with debugging, or explore new technologies.
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px',
              maxWidth: '800px'
            }}>
              {[
                { text: "Explain this code", icon: Code, color: "#ff6b6b" },
                { text: "Fix this bug", icon: Zap, color: "#feca57" },
                { text: "Optimize performance", icon: Sparkles, color: "#00d4ff" },
                { text: "Add error handling", icon: Shield, color: "#ff9ff3" }
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInput(suggestion.text)}
                  style={{
                    padding: '20px',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${suggestion.color}30`,
                    borderRadius: '16px',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    fontSize: '16px',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${suggestion.color}20`;
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 10px 30px ${suggestion.color}30`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <suggestion.icon size={20} color={suggestion.color} />
                  {suggestion.text}
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
              gap: '16px',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            {message.role === 'assistant' && (
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 15px rgba(0,212,255,0.3)'
              }}>
                <Bot size={20} color="white" />
              </div>
            )}
            
            <div
              style={{
                maxWidth: '75%',
                padding: '20px',
                borderRadius: '20px',
                background: message.role === 'user' ? 
                  'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)' : 
                  'rgba(255,255,255,0.05)',
                color: message.role === 'user' ? 'white' : '#e2e8f0',
                border: message.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                boxShadow: message.role === 'user' ? 
                  '0 10px 30px rgba(0,212,255,0.3)' : 
                  '0 4px 15px rgba(0,0,0,0.1)'
              }}
            >
              {renderMessageContent(message.content)}
              
              {message.role === 'assistant' && (
                <div style={{
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  fontSize: '12px',
                  color: '#94a3b8'
                }}>
                  <button style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease'
                  }}>
                    <Copy size={14} />
                    Copy
                  </button>
                  <button style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease'
                  }}>
                    <ThumbsUp size={14} />
                    Good
                  </button>
                  <button style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease'
                  }}>
                    <ThumbsDown size={14} />
                    Bad
                  </button>
                </div>
              )}
              
              <div style={{
                marginTop: '12px',
                fontSize: '11px',
                color: message.role === 'user' ? 'rgba(255,255,255,0.8)' : '#64748b'
              }}>
                {new Date(message.timestamp).toLocaleTimeString()}
                {message.cost && message.tokens && (
                  <span style={{ marginLeft: '12px' }}>
                    • {formatTokens(message.tokens)} tokens • {formatCost(message.cost)}
                  </span>
                )}
              </div>
            </div>
            
            {message.role === 'user' && (
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 15px rgba(255,107,107,0.3)'
              }}>
                <User size={20} color="white" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 15px rgba(0,212,255,0.3)'
            }}>
              <Bot size={20} color="white" />
            </div>
            <div style={{
              padding: '20px',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#94a3b8'
              }}>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Kursa is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div style={{
        padding: '24px 30px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.2)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '16px',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '12px',
              color: '#94a3b8'
            }}>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#e2e8f0',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {availableModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '4px',
              backdropFilter: 'blur(10px)'
            }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Kursa anything about your code..."
                style={{
                  flex: 1,
                  minHeight: '50px',
                  maxHeight: '150px',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'none',
                  outline: 'none'
                }}
                disabled={isLoading}
              />
              
              <div style={{
                display: 'flex',
                gap: '8px',
                padding: '0 8px'
              }}>
                <button
                  onClick={toggleRecording}
                  style={{
                    padding: '8px',
                    background: isRecording ? '#ff4757' : 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: isRecording ? 'white' : '#94a3b8',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  style={{
                    padding: '12px 16px',
                    background: isLoading ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: isLoading ? 0.6 : 1,
                    transition: 'all 0.3s ease',
                    boxShadow: isLoading ? 'none' : '0 4px 15px rgba(0,212,255,0.3)'
                  }}
                >
                  <Send size={16} />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f0f23 0%, #16213e 100%)',
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden'
    }}>
      {renderTopBar()}
      {renderTabs()}
      {renderChatInterface()}
      
      {showSettings && <AISettings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
