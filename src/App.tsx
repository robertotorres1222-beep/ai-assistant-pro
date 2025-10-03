import { Routes, Route } from 'react-router-dom'
import BackendAIChat from './components/BackendAIChat'
import SimpleFallback from './components/SimpleFallback'
import './App.css'

function App() {
  return (
    <div className="App">
      <Routes>
          <Route path="/" element={<SimpleFallback />} />
            <Route path="/claude" element={<BackendAIChat className="h-screen" title="Claude Interface" description="Anthropic's Claude AI assistant" provider="anthropic" />} />
            <Route path="/cursor" element={<BackendAIChat className="h-screen" title="Cursor IDE" description="VS Code-like AI coding assistant" provider="openai" />} />
            <Route path="/openai" element={<BackendAIChat className="h-screen" title="OpenAI Chat" description="GPT-4o and advanced AI models" provider="openai" />} />
            <Route path="/google" element={<BackendAIChat className="h-screen" title="Google AI" description="Gemini 2.0 Flash and experimental features" provider="google" />} />
          <Route path="/chat" element={<SimpleFallback />} />
      </Routes>
    </div>
  )
}

export default App