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
  Sparkles,
  Zap,
  Brain,
  MessageSquare,
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
  ChevronUp
} from 'lucide-react'
import { useAIService, aiService, AIMessage, formatCost, formatTokens, formatTime } from '../services/aiService'
import toast from 'react-hot-toast'

interface OpenAIChatProps {
  className?: string
}

const models = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable model with vision' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Faster and cheaper' },
  { id: 'o1-preview', name: 'o1-preview', description: 'Advanced reasoning' },
  { id: 'o1-mini', name: 'o1-mini', description: 'Faster reasoning' }
]

export default function OpenAIChat({ className = '' }: OpenAIChatProps) {
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
  const [isRecording, setIsRecording] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [temperature, setTemperature] = useState(config.temperature)
  const [maxTokens, setMaxTokens] = useState(config.maxTokens)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  useEffect(() => {
    // Load saved configuration
    const savedConfig = localStorage.getItem('openai-config')
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig)
      setConfig(parsed)
      setTemperature(parsed.temperature)
      setMaxTokens(parsed.maxTokens)
    }
  }, [setConfig])
  
  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return
    
    try {
      let processedMessage = input
      
      // Process attachments
      if (attachments.length > 0) {
        const attachmentPrompts = await Promise.all(
          attachments.map(async (file) => {
            if (file.type.startsWith('image/')) {
              const base64 = await fileToBase64(file)
              const response = await aiService.analyzeImage(base64, 'Describe this image in detail.')
              return `[Image: ${file.name}] ${response.content}`
            } else {
              const text = await file.text()
              return `[File: ${file.name}] ${text.substring(0, 1000)}...`
            }
          })
        )
        processedMessage = `${processedMessage}\n\n${attachmentPrompts.join('\n\n')}`
      }
      
      await aiService.generateResponse(processedMessage, messages, currentModel)
      setInput('')
      setAttachments([])
      
      // Save configuration
      const newConfig = { ...config, temperature, maxTokens }
      localStorage.setItem('openai-config', JSON.stringify(newConfig))
      setConfig(newConfig)
      
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
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments(prev => [...prev, ...files])
  }
  
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }
  
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Message copied!')
  }
  
  const regenerateResponse = async (messageIndex: number) => {
    try {
      const contextMessages = messages.slice(0, messageIndex)
      const userMessage = messages[messageIndex - 1]
      
      if (userMessage?.role === 'user') {
        await aiService.generateResponse(userMessage.content, contextMessages, currentModel)
      }
    } catch (error) {
      toast.error('Failed to regenerate response')
    }
  }
  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  return (
    <div className={`flex flex-col h-screen bg-gray-900 text-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">OpenAI Chat</h1>
            <p className="text-sm text-gray-400">Advanced AI conversations</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Model Selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <span className="text-sm">{models.find(m => m.id === currentModel)?.name}</span>
              {showModelSelector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            <AnimatePresence>
              {showModelSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"
                >
                  {models.map((model) => (
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
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <button
            onClick={clearMessages}
            className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-700 bg-gray-800 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Temperature</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Precise</span>
                  <span>{temperature}</span>
                  <span>Creative</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Max Tokens</label>
                <input
                  type="number"
                  min="100"
                  max="8000"
                  step="100"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role !== 'user' && (
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div className={`max-w-3xl ${message.role === 'user' ? 'order-first' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white ml-auto' 
                    : 'bg-gray-800 text-gray-100'
                }`}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {message.metadata && (
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>{message.metadata.model}</span>
                      <span>{formatTokens(message.metadata.tokens || 0)} tokens</span>
                      <span>{formatCost(message.metadata.cost || 0)}</span>
                      <span>{formatTime(message.metadata.processingTime || 0)}</span>
                    </div>
                  )}
                </div>
                
                {message.role !== 'user' && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => copyMessage(message.content)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => regenerateResponse(index)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="bg-gray-800 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-gray-400 text-sm">AI is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg"
              >
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{file.name}</span>
                <span className="text-xs text-gray-400">({formatFileSize(file.size)})</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message OpenAI..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl resize-none focus:outline-none focus:border-blue-500"
              rows={1}
              style={{
                minHeight: '48px',
                maxHeight: '120px'
              }}
            />
            
            <div className="absolute right-2 bottom-2 flex gap-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`p-2 hover:bg-gray-700 rounded-lg transition-colors ${
                  isRecording ? 'text-red-400' : ''
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <button
            onClick={handleSend}
            disabled={!input.trim() && attachments.length === 0 || isProcessing}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.txt,.pdf,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  )
}
