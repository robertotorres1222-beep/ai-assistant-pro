import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import InterfaceSwitcher from './components/InterfaceSwitcher'
import ClaudeInterface from './components/ClaudeInterface'
import CursorInterface from './components/CursorInterface'
import OpenAIChat from './components/OpenAIChat'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<InterfaceSwitcher className="h-screen" />} />
          <Route path="/claude" element={<ClaudeInterface className="h-screen" />} />
          <Route path="/cursor" element={<CursorInterface className="h-screen" />} />
          <Route path="/openai" element={<OpenAIChat className="h-screen" />} />
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
