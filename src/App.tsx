import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import InterfaceSwitcher from './components/SimpleInterfaceSwitcher'
import BackendAIChat from './components/BackendAIChat'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<InterfaceSwitcher className="h-screen" />} />
            <Route path="/claude" element={<BackendAIChat className="h-screen" title="Claude Interface" description="Anthropic's Claude AI assistant" provider="anthropic" />} />
            <Route path="/cursor" element={<BackendAIChat className="h-screen" title="Cursor IDE" description="VS Code-like AI coding assistant" provider="openai" />} />
            <Route path="/openai" element={<BackendAIChat className="h-screen" title="OpenAI Chat" description="GPT-4o and advanced AI models" provider="openai" />} />
            <Route path="/google" element={<BackendAIChat className="h-screen" title="Google AI" description="Gemini 2.0 Flash and experimental features" provider="google" />} />
          <Route path="/chat" element={<InterfaceSwitcher className="h-screen" />} />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              border: '1px solid #374151',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App