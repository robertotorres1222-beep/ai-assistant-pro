import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import InterfaceSwitcher from './components/InterfaceSwitcher'
import EnhancedCursorAI from './components/EnhancedCursorAI'
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
          <Route path="/" element={<InterfaceSwitcher className="h-screen" />} />
          <Route path="/claude" element={<EnhancedCursorAI />} />
          <Route path="/cursor" element={<EnhancedCursorAI />} />
          <Route path="/chat" element={<InterfaceSwitcher className="h-screen" />} />
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
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
