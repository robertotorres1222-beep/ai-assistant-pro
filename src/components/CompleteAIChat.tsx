import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2, Settings, Bot, User, ChevronDown, Brain, Code, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
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

interface AIInterface {
  id: string;
  name: string;
  description: string;
  provider: 'openai' | 'anthropic' | 'google';
  icon: React.ComponentType<any>;
  color: string;
}

export default function CompleteAIChat() {
  const { chat, getAvailableModels, getProviderInfo } = useBackendAIService();
  const [currentInterface, setCurrentInterface] = useState<string>('home');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<string>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const interfaces: AIInterface[] = [
    {
      id: 'claude',
      name: 'Claude',
      description: 'Anthropic\'s Claude interface',
      provider: 'anthropic',
      icon: MessageSquare,
      color: '#fb923c'
    },
    {
      id: 'cursor',
      name: 'Cursor',
      description: 'VS Code-like AI coding assistant',
      provider: 'openai',
      icon: Code,
      color: '#3b82f6'
    },
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'Advanced OpenAI chat interface',
      provider: 'openai',
      icon: Bot,
      color: '#10b981'
    },
    {
      id: 'google',
      name: 'Google AI',
      description: 'Gemini 2.0 Flash experimental',
      provider: 'google',
      icon: Zap,
      color: '#f59e0b'
    }
  ];

  const currentAI = interfaces.find(ai => ai.id === currentInterface);
  const providerInfo = currentAI ? getProviderInfo(currentAI.provider) : null;
  const availableModels = providerInfo ? providerInfo.models : [];
  const [selectedModel, setSelectedModel] = useState<string>(availableModels[0] || '');

  useEffect(() => {
    if (availableModels.length > 0 && !selectedModel) {
      setSelectedModel(availableModels[0]);
    }
  }, [availableModels, selectedModel]);

  // Check backend health on component mount
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
    if (input.trim() === '' || !selectedModel || !currentAI) return;

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
      const response = await chat(aiMessages, currentAI.provider, selectedModel);
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

  const renderMessageContent = (content: string) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={dracula}
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

  const renderHomeInterface = () => (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '2rem'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '800px'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          background: 'linear-gradient(45deg, #60a5fa, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          AI Assistant Pro
        </h1>
        
        <p style={{
          fontSize: '1.25rem',
          marginBottom: '2rem',
          opacity: 0.9
        }}>
          Professional AI Assistant with Multiple Interfaces
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          {interfaces.map((ai) => {
            const IconComponent = ai.icon;
            return (
              <div
                key={ai.id}
                style={{
                  background: 'rgba(31, 41, 55, 0.8)',
                  borderRadius: '1rem',
                  padding: '2rem',
                  border: '1px solid #374151',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.borderColor = ai.color
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.borderColor = '#374151'
                }}
                onClick={() => setCurrentInterface(ai.id)}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    background: `linear-gradient(45deg, ${ai.color}, ${ai.color}dd)`,
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '1rem'
                  }}>
                    <IconComponent size={24} color="white" />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      marginBottom: '0.25rem',
                      color: ai.color
                    }}>
                      {ai.name}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      opacity: 0.8
                    }}>
                      {ai.description}
                    </p>
                  </div>
                </div>

                <button
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: `linear-gradient(45deg, ${ai.color}, ${ai.color}dd)`,
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentInterface(ai.id);
                  }}
                >
                  Launch {ai.name}
                </button>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: '3rem',
          padding: '1.5rem',
          background: 'rgba(31, 41, 55, 0.6)',
          borderRadius: '1rem',
          border: '1px solid #374151'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: '#60a5fa'
          }}>
            ✨ Features
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            fontSize: '0.875rem',
            opacity: 0.9
          }}>
            <div>🤖 Latest AI Models</div>
            <div>🔒 Secure API Keys</div>
            <div>⚡ Real-time Chat</div>
            <div>🎨 Professional UI</div>
          </div>
        </div>

        <p style={{
          marginTop: '2rem',
          fontSize: '0.875rem',
          opacity: 0.7
        }}>
          🚀 Built with React, TypeScript, and Tailwind CSS
        </p>
      </div>
    </div>
  );

  const renderChatInterface = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#111827',
      color: '#f9fafb'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        background: '#1f2937',
        borderBottom: '1px solid #374151',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {currentAI && (
            <>
              <currentAI.icon size={24} style={{ color: currentAI.color, marginRight: '0.75rem' }} />
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                  {currentAI.name} Interface
                </h1>
                <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                  {currentAI.description}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.25rem' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: backendStatus === 'connected' ? '#10b981' : 
                                   backendStatus === 'disconnected' ? '#ef4444' : '#f59e0b',
                    marginRight: '0.5rem'
                  }} />
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    Backend: {backendStatus === 'connected' ? 'Connected' : 
                             backendStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            style={{
              appearance: 'none',
              background: '#374151',
              border: '1px solid #4b5563',
              color: 'white',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
            }}
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={isLoading}
          >
            {availableModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer'
            }}
          >
            <Settings size={20} />
          </button>
          <button
            onClick={() => setCurrentInterface('home')}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {messages.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#6b7280'
          }}>
            <MessageSquare size={64} style={{ marginBottom: '1rem' }} />
            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
              Start a conversation with {currentAI?.name}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              Selected Model: {selectedModel}
            </p>
            {backendStatus !== 'connected' && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '0.5rem'
              }}>
                <p style={{ color: '#fca5a5', fontSize: '0.875rem' }}>
                  Backend not connected. Please check your Railway deployment.
                </p>
              </div>
            )}
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            {msg.role === 'assistant' && (
              <div style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                background: '#2563eb',
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
                padding: '0.75rem',
                borderRadius: '0.5rem',
                maxWidth: '48rem',
                background: msg.role === 'user' ? '#1d4ed8' : '#374151',
                color: 'white'
              }}
            >
              {renderMessageContent(msg.content)}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.25rem',
                fontSize: '0.75rem',
                color: '#9ca3af'
              }}>
                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                {msg.cost !== undefined && msg.tokens !== undefined && msg.processingTime !== undefined && (
                  <span style={{ marginLeft: '0.5rem' }}>
                    Cost: {formatCost(msg.cost)} | Tokens: {formatTokens(msg.tokens)} | Time: {formatTime(msg.processingTime)}
                  </span>
                )}
              </div>
            </div>
            {msg.role === 'user' && (
              <div style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                background: '#4b5563',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <User size={16} color="white" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '50%',
              background: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Bot size={16} color="white" />
            </div>
            <div style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              background: '#374151',
              color: 'white'
            }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '1rem',
        background: '#1f2937',
        borderTop: '1px solid #374151',
        display: 'flex',
        alignItems: 'center'
      }}>
        <textarea
          style={{
            flex: 1,
            padding: '0.75rem',
            borderRadius: '0.5rem',
            background: '#374151',
            color: '#f3f4f6',
            border: '1px solid #4b5563',
            resize: 'none',
            marginRight: '0.75rem',
            fontFamily: 'inherit'
          }}
          rows={1}
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={isLoading}
        />
        <button
          style={{
            padding: '0.75rem',
            background: '#2563eb',
            borderRadius: '0.5rem',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            opacity: isLoading ? 0.5 : 1
          }}
          onClick={handleSendMessage}
          disabled={isLoading}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {currentInterface === 'home' ? renderHomeInterface() : renderChatInterface()}
      {showSettings && <AISettings onClose={() => setShowSettings(false)} />}
    </>
  );
}
