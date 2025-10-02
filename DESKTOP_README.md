# 🚀 AI Assistant Pro - Desktop Software

A professional desktop application that replicates Cursor's functionality with advanced AI capabilities.

## ✨ Features

### 🖥️ **Desktop Application**
- **Native Desktop Experience** - Full Electron-based desktop app
- **Professional UI** - Cursor-inspired interface with dark theme
- **Menu Bar Integration** - Native macOS/Windows/Linux menus
- **File System Access** - Direct file operations and project management
- **Keyboard Shortcuts** - Professional development shortcuts

### 🤖 **AI Capabilities**
- **Multiple AI Providers** - OpenAI, Anthropic, Google AI
- **Latest Models** - GPT-4o, Claude 3.5 Sonnet, o1-preview, Gemini 2.0
- **AI Composer** - Generate code with ⌘K
- **AI Chat** - Interactive chat with ⌘L
- **Code Completion** - Intelligent code suggestions
- **Code Explanation** - Understand complex code

### 🛠️ **Development Tools**
- **File Explorer** - Project file management
- **Code Editor** - Full-featured text editor
- **Tab Management** - Multiple file tabs
- **Search & Replace** - Find and replace functionality
- **Status Bar** - Line/column info, zoom, theme
- **Settings Panel** - API key management

## 🚀 Quick Start

### **Installation**
```bash
# Clone the repository
git clone https://github.com/yourusername/ai-assistant-pro.git
cd ai-assistant-pro

# Install dependencies
npm install

# Run desktop application
npm run desktop
```

### **Build Desktop App**
```bash
# Build for current platform
npm run desktop:build

# Package for distribution
npm run desktop:pack
```

## ⌨️ **Keyboard Shortcuts**

### **File Operations**
- `⌘N` - New File
- `⌘O` - Open File
- `⌘S` - Save File
- `⌘W` - Close Tab

### **AI Features**
- `⌘K` - AI Composer (generate code)
- `⌘L` - AI Chat
- `⌘E` - Explain selected code
- `⌘G` - Generate code from description
- `⌘Space` - Code completion

### **Navigation**
- `⌘,` - Settings
- `⌘?` - Keyboard shortcuts
- `⌘T` - New tab
- `⌘W` - Close tab

## 🔧 **Configuration**

### **API Keys Setup**
1. Open Settings (`⌘,`)
2. Add your API keys:
   - **OpenAI**: Get from [platform.openai.com](https://platform.openai.com/api-keys)
   - **Anthropic**: Get from [console.anthropic.com](https://console.anthropic.com/)
   - **Google**: Get from [makersuite.google.com](https://makersuite.google.com/app/apikey)

### **Supported File Types**
- **Code**: `.js`, `.ts`, `.jsx`, `.tsx`, `.py`, `.java`, `.cpp`, `.c`, `.cs`
- **Web**: `.html`, `.css`, `.scss`, `.sass`, `.less`
- **Data**: `.json`, `.xml`, `.yaml`, `.toml`
- **Docs**: `.md`, `.txt`, `.rst`
- **Config**: `.json`, `.yaml`, `.toml`, `.ini`

## 🏗️ **Architecture**

### **Frontend (React + TypeScript)**
- **Components**: Modular React components
- **State Management**: React hooks and context
- **Styling**: Tailwind CSS with custom themes
- **Routing**: React Router for navigation

### **Backend (Electron)**
- **Main Process**: Window management, menu bar, file operations
- **Preload Script**: Secure IPC communication
- **File System**: Direct file access with security

### **AI Integration**
- **Multi-Provider**: OpenAI, Anthropic, Google AI
- **Dynamic API Keys**: User-configured API keys
- **Streaming Support**: Real-time AI responses
- **Security**: Encrypted API key storage

## 📦 **Build & Distribution**

### **Development**
```bash
# Start development server
npm run dev

# Start desktop app in development
npm run desktop
```

### **Production Build**
```bash
# Build web assets
npm run build

# Build desktop app
npm run desktop:build
```

### **Platform-Specific Builds**
```bash
# macOS
npm run desktop:build -- --mac

# Windows
npm run desktop:build -- --win

# Linux
npm run desktop:build -- --linux
```

## 🔒 **Security Features**

- **API Key Encryption** - Local encrypted storage
- **Input Validation** - Secure input handling
- **Rate Limiting** - API usage protection
- **Audit Logging** - Security event tracking
- **Sandboxed Environment** - Secure Electron setup

## 🎨 **Themes & Customization**

### **Available Themes**
- **Dark Theme** (Default) - Professional dark interface
- **Light Theme** - Clean light interface
- **Auto Theme** - System preference

### **Customization Options**
- **Font Size** - Adjustable editor font size
- **Zoom Level** - UI scaling
- **Color Schemes** - Custom color themes
- **Layout** - Adjustable panel sizes

## 🚀 **Advanced Features**

### **AI Composer**
- **Code Generation** - Generate entire functions
- **Code Refactoring** - Improve existing code
- **Documentation** - Auto-generate docs
- **Testing** - Create test cases

### **File Management**
- **Project Explorer** - Tree view file browser
- **File Search** - Find files quickly
- **Recent Files** - Quick access to recent files
- **File Operations** - Create, rename, delete files

### **Code Intelligence**
- **Syntax Highlighting** - Language-specific highlighting
- **Code Folding** - Collapsible code blocks
- **Bracket Matching** - Visual bracket pairs
- **Line Numbers** - Professional line numbering

## 📱 **Cross-Platform Support**

- **macOS** - Native macOS app with proper integration
- **Windows** - Full Windows desktop application
- **Linux** - AppImage and package support

## 🔄 **Updates & Maintenance**

### **Auto-Updates**
- **Electron Updater** - Automatic app updates
- **Version Checking** - Check for new versions
- **Update Notifications** - User-friendly update prompts

### **Performance**
- **Lazy Loading** - Optimized component loading
- **Memory Management** - Efficient resource usage
- **Caching** - Smart caching for better performance

## 🆘 **Troubleshooting**

### **Common Issues**
1. **App won't start** - Check Node.js version (18+)
2. **API errors** - Verify API keys in settings
3. **File access issues** - Check file permissions
4. **Performance issues** - Close unused tabs

### **Debug Mode**
```bash
# Run with debug logging
DEBUG=* npm run desktop
```

## 📞 **Support**

- **Documentation**: [docs.aiassistantpro.com](https://docs.aiassistantpro.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-assistant-pro/issues)
- **Discord**: [Community Discord](https://discord.gg/aiassistantpro)

## 🎯 **Roadmap**

### **Upcoming Features**
- **Terminal Integration** - Built-in terminal
- **Git Integration** - Version control support
- **Plugin System** - Extensible architecture
- **Collaboration** - Real-time collaboration
- **Cloud Sync** - Settings and projects sync

---

**Built with ❤️ using React, TypeScript, Electron, and Tailwind CSS**


