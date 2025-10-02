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
  Sparkles,
  Zap,
  Brain,
  Eye,
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
  Globe,
  Database,
  Shield,
  Rocket,
  Cpu,
  Layers
} from 'lucide-react'
import { useAIService, aiService, AIMessage, formatCost, formatTokens, formatTime } from '../services/aiService'
import toast from 'react-hot-toast'

interface AdvancedAIChatProps {
  className?: string
}

const advancedModels = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable with vision', icon: Brain },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Advanced reasoning', icon: MessageSquare },
  { id: 'o1-preview', name: 'o1-preview', description: 'Superior reasoning', icon: Cpu },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0', description: 'Experimental features', icon: Sparkles }
]

const capabilities = [
  { name: 'Multi-modal', icon: Layers, description: 'Text, image, audio, video' },
  { name: 'Voice', icon: Mic, description: 'Speech recognition & synthesis' },
  { name: 'Vision', icon: Eye, description: 'Image analysis & generation' },
  { name: 'Code', icon: Code, description: 'Code generation & analysis' },
  { name: 'Web', icon: Globe, description: 'Real-time web search' },
  { name: 'Memory', icon: Database, description: 'Persistent knowledge' }
]

export default function AdvancedAIChat({ className = '' }: AdvancedAIChatProps) {
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
  const [showSettings, setShowSettings] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(4000)
  const [selectedCapabilities, setSelectedCapabilities] = useState(['Multi-modal', 'Voice', 'Vision'])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return
    
    try {
      let processedMessage = input
      
      // Process attachments with advanced capabilities
      if (attachments.length > 0) {
        const attachmentPrompts = await Promise.all(
          attachments.map(async (file) => {
            if (file.type.startsWith('image/')) {
              const base64 = await fileToBase64(file)
              const response = await aiService.analyzeImage(base64, 'Analyze this image comprehensively.')
              return `[Image Analysis: ${file.name}]\n${response.content}`
            } else if (file.type.startsWith('audio/')) {
              return `[Audio: ${file.name}] - Audio processing would be applied here`
            } else if (file.type.startsWith('video/')) {
              return `[Video: ${file.name}] - Video analysis would be applied here`
            } else {
              const text = await file.text()
              return `[Document: ${file.name}]\n${text.substring(0, 2000)}...`
            }
          })
        )
        processedMessage = `${processedMessage}\n\n${attachmentPrompts.join('\n\n')}`
      }
      
      // Add capability context
      const capabilityContext = selectedCapabilities.map(cap => {
        switch (cap) {
          case 'Voice': return 'Use voice processing capabilities for enhanced understanding.'
          case 'Vision': return 'Apply visual analysis and generation capabilities.'
          case 'Code': return 'Provide code generation, analysis, and debugging assistance.'
          case 'Web': return 'Search the web for real-time information when relevant.'
          case 'Memory': return 'Access and update persistent knowledge base.'
          default: return ''
        }
      }).join(' ')
      
      const finalMessage = `${capabilityContext}\n\n${processedMessage}`
      
      await aiService.generateResponse(finalMessage, messages, currentModel)
      setInput('')
      setAttachments([])
      
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
  
  const toggleCapability = (capability: string) => {
    setSelectedCapabilities(prev => 
      prev.includes(capability) 
        ? prev.filter(c => c !== capability)
        : [...prev, capability]
    )
  }
  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }
  
  return (
    <div className={`flex flex-col h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-xl border-b border-purple-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Advanced AI Chat
            </h1>
            <p className="text-purple-200 text-sm">Multi-modal AI with cutting-edge capabilities</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Model Selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600/30 backdrop-blur-xl border border-purple-400/30 rounded-xl hover:bg-purple-600/50 transition-all"
            >
              <span className="text-sm">{advancedModels.find(m => m.id === currentModel)?.name}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            <AnimatePresence>
              {showModelSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full right-0 mt-2 w-72 bg-gray-900/95 backdrop-blur-xl border border-purple-400/30 rounded-xl shadow-2xl z-50"
                >
                  {advancedModels.map((model) => {
                    const IconComponent = model.icon
                    return (
                      <button
                        key={model.id}
                        onClick={() => {
                          setCurrentModel(model.id)
                          setShowModelSelector(false)
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-purple-600/30 transition-colors ${
                          currentModel === model.id ? 'bg-purple-600/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className="w-5 h-5 text-purple-400" />
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-sm text-purple-200">{model.description}</div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-purple-600/30 backdrop-blur-xl border border-purple-400/30 rounded-xl hover:bg-purple-600/50 transition-all"
          >
            <Settings className="w-5 h-5" />
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
            className="bg-black/20 backdrop-blur-xl border-b border-purple-500/30 overflow-hidden"
          >
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-purple-200">AI Capabilities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {capabilities.map((capability) => {
                    const IconComponent = capability.icon
                    const isSelected = selectedCapabilities.includes(capability.name)
                    return (
                      <button
                        key={capability.name}
                        onClick={() => toggleCapability(capability.name)}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                          isSelected 
                            ? 'bg-purple-600/50 border border-purple-400/50' 
                            : 'bg-gray-800/50 border border-gray-600/50 hover:bg-gray-700/50'
                        }`}
                      >
                        <IconComponent className="w-5 h-5 text-purple-400" />
                        <div className="text-left">
                          <div className="font-medium text-sm">{capability.name}</div>
                          <div className="text-xs text-purple-200">{capability.description}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-purple-200">Temperature</label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-purple-300 mt-1">
                    <span>Precise</span>
                    <span>{temperature}</span>
                    <span>Creative</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-purple-200">Max Tokens</label>
                  <input
                    type="number"
                    min="100"
                    max="8000"
                    step="100"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-purple-400/30 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
              )}
              
              <div className={`max-w-4xl ${message.role === 'user' ? 'order-first' : ''}`}>
                <div className={`rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-xl ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white ml-auto' 
                    : 'bg-gray-900/50 border border-purple-400/30 text-white'
                }`}>
                  <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                  
                  {message.metadata && (
                    <div className="flex items-center gap-4 mt-3 text-xs text-purple-200">
                      <span>{message.metadata.model}</span>
                      <span>{formatTokens(message.metadata.tokens || 0)} tokens</span>
                      <span>{formatCost(message.metadata.cost || 0)}</span>
                      <span>{formatTime(message.metadata.processingTime || 0)}</span>
                    </div>
                  )}
                </div>
                
                {message.role !== 'user' && (
                  <div className="flex items-center gap-2 mt-3">
                    <button className="p-2 hover:bg-purple-600/30 rounded-lg transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-purple-600/30 rounded-lg transition-colors">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-purple-600/30 rounded-lg transition-colors">
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-purple-600/30 rounded-lg transition-colors">
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              {message.role === 'user' && (
                <div className="w-12 h-12 bg-gray-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Brain className="w-7 h-7 text-white" />
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
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="bg-gray-900/50 border border-purple-400/30 rounded-2xl px-6 py-4 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-purple-200 text-sm">Advanced AI is processing...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="px-6 pb-2">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-purple-600/30 backdrop-blur-xl border border-purple-400/30 px-3 py-2 rounded-lg"
              >
                <FileText className="w-4 h-4 text-purple-300" />
                <span className="text-sm text-white">{file.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-purple-300 hover:text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Input */}
      <div className="p-6 bg-black/20 backdrop-blur-xl border-t border-purple-500/30">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask the advanced AI anything... (supports text, images, audio, video, code, and more)"
              className="w-full px-4 py-3 bg-gray-900/50 border border-purple-400/30 rounded-xl resize-none focus:outline-none focus:border-purple-400 text-white placeholder-purple-300 backdrop-blur-xl"
              rows={1}
              style={{
                minHeight: '52px',
                maxHeight: '120px'
              }}
            />
            
            <div className="absolute right-3 bottom-3 flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-purple-600/30 rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4 text-purple-400" />
              </button>
              <button className="p-2 hover:bg-purple-600/30 rounded-lg transition-colors">
                <Camera className="w-4 h-4 text-purple-400" />
              </button>
              <button className="p-2 hover:bg-purple-600/30 rounded-lg transition-colors">
                <Mic className="w-4 h-4 text-purple-400" />
              </button>
            </div>
          </div>
          
          <button
            onClick={handleSend}
            disabled={!input.trim() && attachments.length === 0 || isProcessing}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl transition-all duration-200 flex items-center gap-2 text-white font-medium shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:transform-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,audio/*,video/*,.txt,.pdf,.doc,.docx,.js,.ts,.py,.html,.css,.json,.md"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  )
}