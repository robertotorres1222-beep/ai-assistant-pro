
export default function SimpleFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '2rem'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '800px'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          background: 'linear-gradient(45deg, #60a5fa, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          AI Assistant Pro
        </h1>
        
        <p style={{
          fontSize: '1.25rem',
          marginBottom: '2rem',
          opacity: 0.9
        }}>
          Professional AI Assistant with Multiple Interfaces
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          {[
            { name: 'Claude', desc: 'Anthropic AI', color: '#fb923c' },
            { name: 'Cursor', desc: 'VS Code-like AI', color: '#3b82f6' },
            { name: 'OpenAI', desc: 'GPT-4o & Advanced', color: '#10b981' },
            { name: 'Google AI', desc: 'Gemini 2.0 Flash', color: '#f59e0b' }
          ].map((ai) => (
            <div
              key={ai.name}
              style={{
                background: 'rgba(31, 41, 55, 0.8)',
                borderRadius: '1rem',
                padding: '2rem',
                border: '1px solid #374151',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.borderColor = ai.color
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.borderColor = '#374151'
              }}
            >
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: ai.color
              }}>
                {ai.name}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                opacity: 0.8,
                marginBottom: '1rem'
              }}>
                {ai.desc}
              </p>
              <button
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: `linear-gradient(45deg, ${ai.color}, ${ai.color}dd)`,
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                Launch {ai.name}
              </button>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '3rem',
          padding: '1.5rem',
          background: 'rgba(31, 41, 55, 0.6)',
          borderRadius: '1rem',
          border: '1px solid #374151'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: '#60a5fa'
          }}>
            ✨ Features
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            fontSize: '0.875rem',
            opacity: 0.9
          }}>
            <div>🤖 Latest AI Models</div>
            <div>🔒 Secure API Keys</div>
            <div>⚡ Real-time Chat</div>
            <div>🎨 Professional UI</div>
          </div>
        </div>

        <p style={{
          marginTop: '2rem',
          fontSize: '0.875rem',
          opacity: 0.7
        }}>
          🚀 Built with React, TypeScript, and Tailwind CSS
        </p>
      </div>
    </div>
  )
}
