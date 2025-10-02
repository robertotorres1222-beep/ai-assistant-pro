import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Code, 
  MessageSquare, 
  Brain, 
  Zap, 
  Settings, 
  Monitor,
  Sparkles,
  Cpu,
  Eye,
  Mic,
  Camera,
  Globe,
  Database,
  Shield,
  Rocket
} from 'lucide-react'

interface InterfaceSwitcherProps {
  className?: string
}

interface Interface {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  color: string
  features: string[]
  isNew?: boolean
  isPremium?: boolean
}

export default function InterfaceSwitcher({ className = '' }: InterfaceSwitcherProps) {
  const [selectedInterface, setSelectedInterface] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const interfaces: Interface[] = [
    {
      id: 'claude',
      name: 'Claude Interface',
      description: 'Anthropic\'s Claude with advanced reasoning',
      icon: MessageSquare,
      color: 'from-orange-400 to-red-500',
      features: ['Claude 3.5 Sonnet', 'Advanced reasoning', 'Code analysis', 'Creative writing'],
      isNew: true
    },
    {
      id: 'openai',
      name: 'OpenAI Chat',
      description: 'GPT-4o with vision and o1-preview',
      icon: Brain,
      color: 'from-green-400 to-blue-500',
      features: ['GPT-4o', 'o1-preview', 'Vision capabilities', 'Function calling'],
      isNew: true
    },
    {
      id: 'cursor',
      name: 'Cursor IDE',
      description: 'VS Code-like AI coding assistant',
      icon: Code,
      color: 'from-blue-500 to-purple-600',
      features: ['Code editor', 'AI composer', 'File explorer', 'Terminal integration'],
      isPremium: true
    },
    {
      id: 'software',
      name: 'Desktop App',
      description: 'Full native desktop application',
      icon: Monitor,
      color: 'from-purple-500 to-pink-600',
      features: ['Native performance', 'File system access', 'Menu bar', 'Auto-updater'],
      isPremium: true
    },
    {
      id: 'advanced',
      name: 'Advanced AI',
      description: 'Multi-modal AI with latest models',
      icon: Sparkles,
      color: 'from-cyan-400 to-purple-500',
      features: ['Multi-modal AI', 'Voice & Vision', 'Real-time collaboration', 'Custom agents'],
      isNew: true,
      isPremium: true
    }
  ]

  const handleInterfaceSelect = async (interfaceId: string) => {
    setSelectedInterface(interfaceId)
    setIsLoading(true)
    
    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Navigate to selected interface
    window.location.href = `/${interfaceId}`
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 ${className}`}>
      <div className="max-w-6xl w-full">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center mb-6">
            <motion.div 
              className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl"
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <Brain className="w-10 h-10 text-white" />
            </motion.div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI Assistant Pro
          </h1>
          <p className="text-2xl text-gray-300 mb-2">
            Choose your AI interface
          </p>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Experience the most advanced AI models with cutting-edge interfaces. 
            From conversational AI to professional coding environments.
          </p>
        </motion.div>

        {/* Interface Cards */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {interfaces.map((interface_) => {
            const IconComponent = interface_.icon
            const isSelected = selectedInterface === interface_.id
            
            return (
              <motion.div
                key={interface_.id}
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleInterfaceSelect(interface_.id)}
                className={`group relative bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:bg-gray-800/70 hover:border-gray-600 ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''
                }`}
              >
                {/* Badges */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {interface_.isNew && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      New
                    </span>
                  )}
                  {interface_.isPremium && (
                    <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Premium
                    </span>
                  )}
                </div>

                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${interface_.color} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-300`} />
                
                {/* Loading overlay */}
                <AnimatePresence>
                  {isLoading && isSelected && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                        <span className="text-white text-sm">Loading...</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${interface_.color} rounded-2xl flex items-center justify-center mr-4 shadow-lg`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{interface_.name}</h3>
                      <p className="text-gray-400 text-sm">{interface_.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {interface_.features.map((feature, index) => (
                      <motion.div 
                        key={index} 
                        className="flex items-center text-gray-300"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Zap className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.button 
                    className={`w-full py-4 px-6 bg-gradient-to-r ${interface_.color} text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg transform hover:scale-105`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Launch {interface_.name}
                  </motion.button>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            )
          })}
        </motion.div>

        {/* Advanced Features */}
        <motion.div 
          className="bg-gray-800/30 backdrop-blur-xl border border-gray-700 rounded-3xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            🚀 Advanced AI Capabilities
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Cpu, title: 'Latest Models', desc: 'GPT-4o, Claude 3.5, Gemini 2.0' },
              { icon: Eye, title: 'Vision AI', desc: 'Image analysis and generation' },
              { icon: Mic, title: 'Voice AI', desc: 'Speech recognition and synthesis' },
              { icon: Camera, title: 'Video AI', desc: 'Video analysis and editing' },
              { icon: Globe, title: 'Web Search', desc: 'Real-time information access' },
              { icon: Database, title: 'Knowledge Base', desc: 'Custom knowledge integration' },
              { icon: Shield, title: 'Privacy First', desc: 'Local processing options' },
              { icon: Rocket, title: 'Real-time', desc: 'Live collaboration features' }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                className="text-center p-4 rounded-xl hover:bg-gray-700/30 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <p className="text-gray-500 text-sm">
            🚀 Built with React, TypeScript, Tailwind CSS, and cutting-edge AI models
          </p>
        </motion.div>
      </div>
    </div>
  )
}