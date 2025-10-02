import { Code, MessageSquare, Brain, Zap, Settings } from 'lucide-react'

interface InterfaceSwitcherProps {
  className?: string
}

export default function InterfaceSwitcher({ className = '' }: InterfaceSwitcherProps) {

  const interfaces = [
    {
      id: 'claude' as const,
      name: 'Claude',
      description: 'Anthropic\'s Claude interface replica',
      icon: MessageSquare,
      color: 'from-orange-400 to-red-500',
      features: ['Conversational AI', 'Smart responses', 'Clean design', 'Model selection']
    },
    {
      id: 'cursor' as const,
      name: 'Cursor',
      description: 'VS Code-like AI coding assistant',
      icon: Code,
      color: 'from-blue-500 to-purple-600',
      features: ['Code editor', 'File explorer', 'AI composer', 'Terminal integration']
    }
  ]

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 ${className}`}>
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            AI Assistant Pro
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Choose your preferred AI interface
          </p>
          <p className="text-gray-400">
            Exact replicas of Claude and Cursor with full AI capabilities
          </p>
        </div>

        {/* Interface Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {interfaces.map((interface_) => {
            const IconComponent = interface_.icon
            return (
              <div
                key={interface_.id}
                onClick={() => window.location.href = `/${interface_.id}`}
                className="group relative bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-gray-800/70 hover:border-gray-600"
              >
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${interface_.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className={`w-12 h-12 bg-gradient-to-br ${interface_.color} rounded-xl flex items-center justify-center mr-4 shadow-lg`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{interface_.name}</h3>
                      <p className="text-gray-400 text-sm">{interface_.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {interface_.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-gray-300">
                        <Zap className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button className={`w-full py-3 px-6 bg-gradient-to-r ${interface_.color} text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg transform hover:scale-105`}>
                    Launch {interface_.name}
                  </button>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            )
          })}
        </div>

        {/* Features Comparison */}
        <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            ✨ Both Interfaces Include
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Latest AI Models</h3>
              <p className="text-gray-400 text-sm">GPT-4o, Claude 3.5 Sonnet, o1-preview, and more</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Code className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Advanced Features</h3>
              <p className="text-gray-400 text-sm">Code generation, analysis, debugging, and more</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Secure & Private</h3>
              <p className="text-gray-400 text-sm">Your API keys stored locally and encrypted</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            🚀 Built with React, TypeScript, and Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  )
}
