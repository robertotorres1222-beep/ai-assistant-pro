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
  ChevronUp,
  Brain,
  Lightbulb,
  Target,
  Users
} from 'lucide-react'
import { useAIService, aiService, AIMessage, formatCost, formatTokens, formatTime } from '../services/aiService'
import toast from 'react-hot-toast'

interface ClaudeInterfaceProps {
  className?: string
}

const claudeModels = [
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Most capable Claude model' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fast and efficient' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Previous generation' }
]

const thinkingModes = [
  { id: 'balanced', name: 'Balanced', description: 'Balanced approach' },
  { id: 'creative', name: 'Creative', description: 'More creative and imaginative' },
  { id: 'precise', name: 'Precise', description: 'More accurate and factual' }
]

export default function ClaudeInterface({ className = '' }: ClaudeInterfaceProps) {
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
  const [thinkingMode, setThinkingMode] = useState('balanced')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(4000)
  const [showThinkingProcess, setShowThinkingProcess] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  useEffect(() => {
    // Load saved configuration
    const savedConfig = localStorage.getItem('claude-config')
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig)
      setConfig(parsed)
      setTemperature(parsed.temperature)
      setMaxTokens(parsed.maxTokens)
      setThinkingMode(parsed.thinkingMode || 'balanced')
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
      
      // Add thinking mode context
      const modeContext = {
        balanced: 'Please provide a balanced response that is both helpful and accurate.',
        creative: 'Please be more creative and imaginative in your response.',
        precise: 'Please be as accurate and factual as possible in your response.'
      }
      
      const finalMessage = `${modeContext[thinkingMode]}\n\n${processedMessage}`
      
      await aiService.generateResponse(finalMessage, messages, currentModel)
      setInput('')
      setAttachments([])
      
      // Save configuration
      const newConfig = { ...config, temperature, maxTokens, thinkingMode }
      localStorage.setItem('claude-config', JSON.stringify(newConfig))
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
    <div className={`flex flex-col h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-orange-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Claude Interface</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Anthropic's advanced AI assistant</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Thinking Mode Selector */}
          <div className="relative">
            <button
              onClick={() => setShowThinkingProcess(!showThinkingProcess)}
              className="flex items-center gap-2 px-3 py-2 bg-orange-100 dark:bg-gray-700 rounded-lg hover:bg-orange-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Brain className="w-4 h-4" />
              <span className="text-sm">Thinking</span>
              {showThinkingProcess ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Model Selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center gap-2 px-3 py-2 bg-orange-100 dark:bg-gray-700 rounded-lg hover:bg-orange-200 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="text-sm">{claudeModels.find(m => m.id === currentModel)?.name}</span>
              {showModelSelector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            <AnimatePresence>
              {showModelSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-orange-200 dark:border-gray-700 rounded-lg shadow-xl z-50"
                >
                  {claudeModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setCurrentModel(model.id)
                        setShowModelSelector(false)
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors ${
                        currentModel === model.id ? 'bg-orange-50 dark:bg-gray-700' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{model.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{model.description}</div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-orange-100 dark:bg-gray-700 rounded-lg hover:bg-orange-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <button
            onClick={clearMessages}
            className="p-2 bg-orange-100 dark:bg-gray-700 rounded-lg hover:bg-orange-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Thinking Process Panel */}
      <AnimatePresence>
        {showThinkingProcess && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-orange-200 dark:border-gray-700 bg-orange-50/50 dark:bg-gray-800/50 overflow-hidden"
          >
            <div className="p-4">
              <div className="grid grid-cols-3 gap-4">
                {thinkingModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setThinkingMode(mode.id)}
                    className={`p-3 rounded-lg text-left transition-colors ${
                      thinkingMode === mode.id 
                        ? 'bg-orange-200 dark:bg-gray-700 text-orange-900 dark:text-white' 
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium">{mode.name}</div>
                    <div className="text-sm opacity-75">{mode.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-orange-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Temperature</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Precise</span>
                  <span>{temperature}</span>
                  <span>Creative</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Max Tokens</label>
                <input
                  type="number"
                  min="100"
                  max="8000"
                  step="100"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-orange-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role !== 'user' && (
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
              )}
              
              <div className={`max-w-4xl ${message.role === 'user' ? 'order-first' : ''}`}>
                <div className={`rounded-2xl px-6 py-4 shadow-lg ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white ml-auto' 
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-orange-200 dark:border-gray-700'
                }`}>
                  <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                  
                  {message.metadata && (
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>{message.metadata.model}</span>
                      <span>{formatTokens(message.metadata.tokens || 0)} tokens</span>
                      <span>{formatCost(message.metadata.cost || 0)}</span>
                      <span>{formatTime(message.metadata.processingTime || 0)}</span>
                    </div>
                  )}
                </div>
                
                {message.role !== 'user' && (
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => copyMessage(message.content)}
                      className="p-2 hover:bg-orange-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => regenerateResponse(index)}
                      className="p-2 hover:bg-orange-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-orange-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-orange-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              {message.role === 'user' && (
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-4 shadow-lg border border-orange-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Claude is thinking...</span>
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
                className="flex items-center gap-2 bg-orange-100 dark:bg-gray-800 px-3 py-2 rounded-lg"
              >
                <FileText className="w-4 h-4 text-orange-600 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">({formatFileSize(file.size)})</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Input */}
      <div className="p-4 border-t border-orange-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message Claude..."
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-orange-200 dark:border-gray-700 rounded-xl resize-none focus:outline-none focus:border-orange-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={1}
              style={{
                minHeight: '52px',
                maxHeight: '120px'
              }}
            />
            
            <div className="absolute right-3 bottom-3 flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-orange-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4 text-orange-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`p-2 hover:bg-orange-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                  isRecording ? 'text-red-500' : ''
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <button
            onClick={handleSend}
            disabled={!input.trim() && attachments.length === 0 || isProcessing}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed rounded-xl transition-all duration-200 flex items-center gap-2 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
          >
            <Send className="w-5 h-5" />
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