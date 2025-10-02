import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2, Settings, Bot, User, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useBackendAIService, formatCost, formatTokens, formatTime, checkBackendHealth } from '../services/backendAIService';
import AISettings from './AISettings';

interface BackendAIChatProps {
  className?: string;
  title: string;
  description: string;
  provider: 'openai' | 'anthropic' | 'google';
}

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

export default function BackendAIChat({ className = '', title, description, provider }: BackendAIChatProps) {
  const { chat, getAvailableModels, getProviderInfo } = useBackendAIService();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<string>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const providerInfo = getProviderInfo(provider);
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
      const response = await chat(aiMessages, provider, selectedModel);
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

  return (
    <div className={`flex flex-col h-screen bg-gray-900 text-gray-100 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shadow-md">
        <div className="flex items-center">
          <Bot className="w-6 h-6 text-blue-400 mr-3" />
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            <span className="ml-3 text-sm text-gray-400 hidden sm:inline">{description}</span>
            <div className="flex items-center mt-1">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                backendStatus === 'connected' ? 'bg-green-500' : 
                backendStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
              }`} />
              <span className="text-xs text-gray-500">
                Backend: {backendStatus === 'connected' ? 'Connected' : 
                         backendStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <select
              className="appearance-none bg-gray-700 border border-gray-600 text-white py-2 px-3 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="w-16 h-16 mb-4" />
            <p className="text-lg">Start a conversation with {title}</p>
            <p className="text-sm text-gray-600">Selected Model: {selectedModel}</p>
            {backendStatus !== 'connected' && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">
                  Backend not connected. Please check your Railway deployment.
                </p>
              </div>
            )}
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`p-3 rounded-lg max-w-3xl ${
                msg.role === 'user'
                  ? 'bg-blue-700 text-white rounded-br-none'
                  : 'bg-gray-700 text-gray-100 rounded-bl-none'
              }`}
            >
              {renderMessageContent(msg.content)}
              <div className="flex justify-between items-center mt-1 text-xs text-gray-400">
                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                {msg.cost !== undefined && msg.tokens !== undefined && msg.processingTime !== undefined && (
                  <span className="ml-2">
                    Cost: {formatCost(msg.cost)} | Tokens: {formatTokens(msg.tokens)} | Time: {formatTime(msg.processingTime)}
                  </span>
                )}
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center justify-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="p-3 rounded-lg bg-gray-700 text-gray-100 rounded-bl-none">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 flex items-center">
        <textarea
          className="flex-1 p-3 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:border-blue-500 resize-none mr-3 custom-scrollbar"
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
          className="p-3 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSendMessage}
          disabled={isLoading}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {showSettings && <AISettings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
