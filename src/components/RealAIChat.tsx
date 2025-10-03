import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Settings, Zap, Cpu, Brain } from 'lucide-react'
import { useAIStore, realAIService, formatCost, formatTokens, formatTime } from '../services/realAIService'
import AISettings from './AISettings'
import toast from 'react-hot-toast'

interface RealAIChatProps {
  className?: string
  title: string
  description: string
  provider: 'openai' | 'anthropic' | 'google'
}

export default function RealAIChat({ className = '', title, description, provider }: RealAIChatProps) {
  const { messages, isProcessing, addMessage, setProcessing } = useAIStore()
  const [input, setInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [selectedModel, setSelectedModel] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const availableModels = realAIService.getAvailableModels()
  const providerModels = availableModels.find(p => p.provider === provider)?.models || []

  useEffect(() => {
    if (providerModels.length > 0 && !selectedModel) {
      setSelectedModel(providerModels[0])
    }
  }, [providerModels, selectedModel])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedModel) return

    const userMessage = {
      role: 'user' as const,
      content: input,
      timestamp: new Date().toISOString()
    }

    addMessage(userMessage)
    setInput('')
    setProcessing(true)

    try {
      const response = await realAIService.generateResponse(input, messages, selectedModel, provider)
      // Response is automatically added to store by the service
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response'
      
      addMessage({
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date().toISOString()
      })
      
      toast.error(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getProviderIcon = () => {
    switch (provider) {
      case 'openai': return <Brain className="w-6 h-6 text-green-400" />
      case 'anthropic': return <Cpu className="w-6 h-6 text-orange-400" />
      case 'google': return <Zap className="w-6 h-6 text-blue-400" />
      default: return <Bot className="w-6 h-6 text-blue-400" />
    }
  }

  const getProviderColor = () => {
    switch (provider) {
      case 'openai': return 'from-green-400 to-blue-500'
      case 'anthropic': return 'from-orange-400 to-red-500'
      case 'google': return 'from-blue-400 to-purple-500'
      default: return 'from-blue-500 to-purple-600'
    }
  }

  return (
    <div className={`flex flex-col h-screen bg-gray-900 text-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shadow-md">
        <div className="flex items-center gap-3">
          {getProviderIcon()}
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Model Selector */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {providerModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            {getProviderIcon()}
            <p className="text-lg mt-4">Start a conversation with {title}</p>
            <p className="text-sm text-gray-600 mt-2">Configure your API keys in settings to begin</p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${getProviderColor()} flex items-center justify-center`}>
                {getProviderIcon()}
              </div>
            )}
            
            <div
              className={`p-3 rounded-lg max-w-3xl ${
                message.role === 'user'
                  ? 'bg-blue-700 text-white rounded-br-none'
                  : 'bg-gray-700 text-gray-100 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {message.metadata && (
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span>{message.metadata.model}</span>
                  <span>{formatTokens(message.metadata.tokens)} tokens</span>
                  <span>{formatCost(message.metadata.cost)}</span>
                  <span>{formatTime(message.metadata.processingTime)}</span>
                </div>
              )}
              
              <div className="text-xs text-gray-400 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
            
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex items-center justify-start space-x-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${getProviderColor()} flex items-center justify-center`}>
              {getProviderIcon()}
            </div>
            <div className="p-3 rounded-lg bg-gray-700 text-gray-100 rounded-bl-none">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <textarea
            className="flex-1 p-3 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
            rows={1}
            placeholder={`Ask ${title} anything...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isProcessing}
          />
          <button
            className="p-3 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSendMessage}
            disabled={isProcessing || !input.trim() || !selectedModel}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {!selectedModel && (
          <div className="mt-2 text-xs text-yellow-400">
            Please select a model to start chatting
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && <AISettings onClose={() => setShowSettings(false)} />}
    </div>
  )
}
