import { useState } from 'react'
import { X, Key, Save, Eye, EyeOff } from 'lucide-react'
import { useBackendAIService } from '../services/backendAIService'
import toast from 'react-hot-toast'

interface AISettingsProps {
  onClose: () => void
}

export default function AISettings({ onClose }: AISettingsProps) {
  const { apiKeys, setApiKey, clearApiKeys } = useBackendAIService()
  const [openaiKey, setOpenaiKey] = useState(apiKeys.openai)
  const [anthropicKey, setAnthropicKey] = useState(apiKeys.anthropic)
  const [googleKey, setGoogleKey] = useState(apiKeys.google)
  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false,
    google: false
  })

  const handleSave = () => {
    setApiKey('openai', openaiKey)
    setApiKey('anthropic', anthropicKey)
    setApiKey('google', googleKey)
    toast.success('All API keys updated!')
    onClose()
  }

  const handleClearAll = () => {
    clearApiKeys()
    setOpenaiKey('')
    setAnthropicKey('')
    setGoogleKey('')
    toast.success('All API keys cleared!')
    onClose()
  }

  const toggleKeyVisibility = (provider: keyof typeof showKeys) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }))
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">AI API Configuration</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* OpenAI */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              OpenAI API Key
            </label>
            <div className="relative">
              <input
                type={showKeys.openai ? 'text' : 'password'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => toggleKeyVisibility('openai')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
              >
                {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">OpenAI Platform</a>
            </p>
          </div>

          {/* Anthropic */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Anthropic API Key
            </label>
            <div className="relative">
              <input
                type={showKeys.anthropic ? 'text' : 'password'}
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => toggleKeyVisibility('anthropic')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
              >
                {showKeys.anthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Get your key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Anthropic Console</a>
            </p>
          </div>

          {/* Google AI */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Google AI API Key
            </label>
            <div className="relative">
              <input
                type={showKeys.google ? 'text' : 'password'}
                value={googleKey}
                onChange={(e) => setGoogleKey(e.target.value)}
                placeholder="AI..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => toggleKeyVisibility('google')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
              >
                {showKeys.google ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Get your key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClearAll}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Clear All Keys
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Keys
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Security Note</span>
          </div>
          <p className="text-xs text-blue-200">
            Your API keys are stored locally in your browser and never shared. 
            Make sure to keep them secure and never share them publicly.
          </p>
        </div>
      </div>
    </div>
  )
}
