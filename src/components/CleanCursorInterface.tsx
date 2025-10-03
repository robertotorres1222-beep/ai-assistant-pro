import React, { useState, useRef } from 'react';
import { 
  MessageCircle, 
  Code, 
  Terminal, 
  Search, 
  Settings, 
  ChevronRight,
  X,
  Bot,
  Send,
  Mic,
  MicOff,
  Sparkles,
  Zap,
  DollarSign,
  Crown
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const CleanCursorInterface: React.FC = () => {
  const [activePanel, setActivePanel] = useState<'chat' | 'code' | 'terminal' | 'search' | 'settings'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate AI response for demo
      setTimeout(() => {
        const response = `I understand you're asking about "${userMessage.content}". This is a demo response from Kursa AI. In the full version, I would provide intelligent assistance with your coding questions, explanations, and project help.`;
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response,
          role: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const renderChatInterface = () => (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Kursa AI</h2>
            <p className="text-sm text-gray-500">Ready to help</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleRecording}
            className={`p-2 rounded-lg transition-colors ${
              isRecording 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to Kursa AI</h3>
            <p className="text-gray-500 max-w-md">
              Your intelligent coding assistant. Ask me anything about code, get explanations, or request help with your projects.
            </p>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg max-w-md">
              <h4 className="font-medium text-blue-900 mb-2">🚀 Demo Mode Active</h4>
              <p className="text-sm text-blue-700">
                Add your API keys in Settings to unlock real AI responses from OpenAI, Claude, Google, and more!
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Kursa AI anything..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Press Enter to send</span>
          <span>Powered by advanced AI</span>
        </div>
      </div>
    </div>
  );

  const renderCodeInterface = () => (
    <div className="h-full bg-gray-900 text-gray-100 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Code className="w-5 h-5" />
        <span className="text-sm font-medium">Code Editor</span>
      </div>
      <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm">
        <div className="text-gray-400">// Welcome to Kursa AI Code Editor</div>
        <div className="text-gray-400">// Start typing your code here...</div>
        <div className="text-gray-400 mt-2">// Add API keys in Settings to enable real AI code assistance</div>
      </div>
    </div>
  );

  const renderTerminalInterface = () => (
    <div className="h-full bg-gray-900 text-green-400 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Terminal className="w-5 h-5" />
        <span className="text-sm font-medium">Terminal</span>
      </div>
      <div className="bg-black rounded-lg p-4 font-mono text-sm">
        <div>$ Welcome to Kursa AI Terminal</div>
        <div>$ Ready for commands...</div>
        <div>$ Add API keys in Settings for AI-powered terminal assistance</div>
      </div>
    </div>
  );

  const renderSearchInterface = () => (
    <div className="h-full bg-white p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Search className="w-5 h-5" />
        <span className="text-sm font-medium">Search</span>
      </div>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search files, functions, or code..."
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="text-gray-500 text-sm">No results yet. Start typing to search.</div>
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">🔍 AI-Powered Search</h4>
          <p className="text-sm text-blue-700">
            Add API keys in Settings to enable intelligent code search and navigation.
          </p>
        </div>
      </div>
    </div>
  );

  const renderSettingsModal = () => (
    showSettings && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-900 mb-2">🚀 Add API Keys</h4>
              <p className="text-sm text-blue-700 mb-3">
                Unlock real AI responses from the best providers:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>OpenAI GPT-4 (Premium)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Anthropic Claude (Premium)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Google Gemini (Free tier available)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>Groq (Free tier available)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key
              </label>
              <input
                type="password"
                placeholder="sk-..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anthropic API Key
              </label>
              <input
                type="password"
                placeholder="sk-ant-..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Gemini API Key
              </label>
              <input
                type="password"
                placeholder="AIza..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('API keys saved! (Demo mode - keys not actually stored)');
                  setShowSettings(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* macOS-style Title Bar */}
      <div className="bg-gray-200 flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <div className="text-sm font-medium text-gray-700">Kursa AI</div>
        <div className="w-12"></div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              {!sidebarCollapsed && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900">Kursa AI</span>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className={`w-4 h-4 transition-transform ${
                  sidebarCollapsed ? 'rotate-0' : 'rotate-180'
                }`} />
              </button>
            </div>

            <nav className="space-y-2">
              {[
                { id: 'chat', icon: MessageCircle, label: 'Chat' },
                { id: 'code', icon: Code, label: 'Code' },
                { id: 'terminal', icon: Terminal, label: 'Terminal' },
                { id: 'search', icon: Search, label: 'Search' },
                { id: 'settings', icon: Settings, label: 'Settings' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActivePanel(item.id as any)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    activePanel === item.id
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                </button>
              ))}
            </nav>

            {!sidebarCollapsed && (
              <div className="mt-8 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Crown className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Pro Features</span>
                </div>
                <p className="text-xs text-blue-700">
                  Add API keys to unlock real AI responses and advanced features.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {activePanel === 'chat' && renderChatInterface()}
          {activePanel === 'code' && renderCodeInterface()}
          {activePanel === 'terminal' && renderTerminalInterface()}
          {activePanel === 'search' && renderSearchInterface()}
          {activePanel === 'settings' && (
            <div className="h-full bg-white p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">🚀 Get Started</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Your Kursa AI is ready! Add API keys to unlock real AI responses.
                </p>
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add API Keys
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {renderSettingsModal()}
    </div>
  );
};

export default CleanCursorInterface;
