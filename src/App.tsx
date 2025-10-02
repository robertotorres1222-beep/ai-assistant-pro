import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AIChat from './components/AIChat'
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
          <Route path="/" element={<AIChat className="h-screen" />} />
          <Route path="/chat" element={<AIChat className="h-screen" />} />
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App
