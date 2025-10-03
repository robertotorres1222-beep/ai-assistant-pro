import { Code, MessageSquare, Brain, Bot, Zap } from 'lucide-react'

interface InterfaceSwitcherProps {
  className?: string
}

export default function InterfaceSwitcher({ className = '' }: InterfaceSwitcherProps) {
  const interfaces = [
    {
      id: 'claude',
      name: 'Claude',
      description: 'Anthropic\'s Claude interface',
      icon: MessageSquare,
      color: 'from-orange-400 to-red-500'
    },
    {
      id: 'cursor',
      name: 'Cursor',
      description: 'VS Code-like AI coding assistant',
      icon: Code,
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'Advanced OpenAI chat interface',
      icon: Bot,
      color: 'from-green-400 to-blue-500'
    },
    {
      id: 'google',
      name: 'Google AI',
      description: 'Gemini 2.0 Flash experimental',
      icon: Zap,
      color: 'from-yellow-400 to-orange-500'
    }
  ]

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 ${className}`}>
      <div className="max-w-4xl w-full">
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
            Professional AI assistant with multiple interfaces
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {interfaces.map((interface_) => {
            const IconComponent = interface_.icon
            return (
              <div
                key={interface_.id}
                onClick={() => window.location.href = `/${interface_.id}`}
                className="group relative bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-gray-800/70 hover:border-gray-600"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${interface_.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />

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

                  <button className={`w-full py-3 px-6 bg-gradient-to-r ${interface_.color} text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg transform hover:scale-105`}>
                    Launch {interface_.name}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <p className="text-gray-500 text-sm">
            🚀 Built with React, TypeScript, and Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  )
}
