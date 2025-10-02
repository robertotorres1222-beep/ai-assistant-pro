import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ModernAIChat from './components/ModernAIChat'
import { initializeSecurity } from './utils/security'
import { useEffect } from 'react'
import './App.css'

function App() {
  useEffect(() => {
    // Initialize security features
    initializeSecurity()
  }, [])

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<ModernAIChat />} />
          <Route path="/chat" element={<ModernAIChat />} />
        </Routes>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              backdropFilter: 'blur(12px)',
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
