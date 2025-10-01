#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class BuildManager {
  constructor() {
    this.buildDir = path.join(__dirname, 'dist');
    this.downloadsDir = path.join(__dirname, 'downloads');
    this.version = '1.0.0';
  }

  async buildAll() {
    console.log('🚀 Starting AI Assistant Pro build process...\n');

    try {
      // Create downloads directory
      this.createDownloadsDir();

      // Build web application
      await this.buildWebApp();

      // Build desktop application
      await this.buildDesktopApp();

      // Build mobile applications
      await this.buildMobileApps();

      // Build browser extensions
      await this.buildBrowserExtensions();

      // Create distribution packages
      await this.createDistributionPackages();

      console.log('\n✅ All builds completed successfully!');
      console.log(`📦 Distribution packages created in: ${this.downloadsDir}`);
      
    } catch (error) {
      console.error('\n❌ Build failed:', error.message);
      process.exit(1);
    }
  }

  createDownloadsDir() {
    if (!fs.existsSync(this.downloadsDir)) {
      fs.mkdirSync(this.downloadsDir, { recursive: true });
      console.log('📁 Created downloads directory');
    }
  }

  async buildWebApp() {
    console.log('\n🌐 Building web application...');
    
    try {
      // Build the React app
      execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
      
      // Copy to downloads
      const webDistDir = path.join(this.downloadsDir, 'web');
      if (fs.existsSync(webDistDir)) {
        fs.rmSync(webDistDir, { recursive: true });
      }
      
      execSync(`cp -r ${path.join(__dirname, 'dist')} ${webDistDir}`);
      console.log('✅ Web application built successfully');
      
    } catch (error) {
      console.error('❌ Web app build failed:', error.message);
      throw error;
    }
  }

  async buildDesktopApp() {
    console.log('\n🖥️ Building desktop application...');
    
    try {
      // Install electron dependencies
      execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, 'electron') });
      
      // Build for all platforms
      const platforms = ['win', 'mac', 'linux'];
      
      for (const platform of platforms) {
        console.log(`Building for ${platform}...`);
        
        try {
          execSync(`npm run build-${platform}`, { 
            stdio: 'inherit', 
            cwd: path.join(__dirname, 'electron') 
          });
          
          // Copy built files to downloads
          const electronDistDir = path.join(__dirname, 'electron', 'dist-electron');
          const platformDownloadsDir = path.join(this.downloadsDir, 'desktop', platform);
          
          if (fs.existsSync(electronDistDir)) {
            if (fs.existsSync(platformDownloadsDir)) {
              fs.rmSync(platformDownloadsDir, { recursive: true });
            }
            fs.mkdirSync(platformDownloadsDir, { recursive: true });
            execSync(`cp -r ${electronDistDir}/* ${platformDownloadsDir}/`);
          }
          
          console.log(`✅ ${platform} desktop app built successfully`);
          
        } catch (error) {
          console.warn(`⚠️ ${platform} build failed (may need platform-specific tools):`, error.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Desktop app build failed:', error.message);
      throw error;
    }
  }

  async buildMobileApps() {
    console.log('\n📱 Building mobile applications...');
    
    try {
      // Install React Native dependencies
      execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, 'mobile') });
      
      // Build Android APK
      try {
        console.log('Building Android APK...');
        execSync('npm run build-android', { 
          stdio: 'inherit', 
          cwd: path.join(__dirname, 'mobile') 
        });
        
        // Copy APK to downloads
        const androidApkPath = path.join(__dirname, 'mobile', 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
        if (fs.existsSync(androidApkPath)) {
          const downloadsAndroidDir = path.join(this.downloadsDir, 'mobile', 'android');
          fs.mkdirSync(downloadsAndroidDir, { recursive: true });
          fs.copyFileSync(androidApkPath, path.join(downloadsAndroidDir, 'ai-assistant-pro-android.apk'));
          console.log('✅ Android APK built successfully');
        }
        
      } catch (error) {
        console.warn('⚠️ Android build failed (may need Android SDK):', error.message);
      }
      
      // Build iOS (requires macOS and Xcode)
      try {
        console.log('Building iOS app...');
        execSync('npm run build-ios', { 
          stdio: 'inherit', 
          cwd: path.join(__dirname, 'mobile') 
        });
        console.log('✅ iOS app built successfully');
        
      } catch (error) {
        console.warn('⚠️ iOS build failed (requires macOS and Xcode):', error.message);
      }
      
    } catch (error) {
      console.error('❌ Mobile app build failed:', error.message);
      throw error;
    }
  }

  async buildBrowserExtensions() {
    console.log('\n🌐 Building browser extensions...');
    
    try {
      const extensionDir = path.join(__dirname, 'extension');
      const downloadsExtensionDir = path.join(this.downloadsDir, 'extensions');
      
      // Copy extension files
      if (fs.existsSync(downloadsExtensionDir)) {
        fs.rmSync(downloadsExtensionDir, { recursive: true });
      }
      fs.mkdirSync(downloadsExtensionDir, { recursive: true });
      
      execSync(`cp -r ${extensionDir}/* ${downloadsExtensionDir}/`);
      
      // Create zip files for each browser
      const browsers = ['chrome', 'firefox', 'safari'];
      
      for (const browser of browsers) {
        const browserDir = path.join(downloadsExtensionDir, browser);
        const zipFile = path.join(this.downloadsDir, `ai-assistant-pro-${browser}-extension.zip`);
        
        fs.mkdirSync(browserDir, { recursive: true });
        execSync(`cp -r ${extensionDir}/* ${browserDir}/`);
        
        // Create browser-specific manifest if needed
        this.createBrowserSpecificManifest(browser, browserDir);
        
        // Create zip file
        try {
          execSync(`cd ${browserDir} && zip -r ${zipFile} .`);
          console.log(`✅ ${browser} extension built successfully`);
        } catch (error) {
          console.warn(`⚠️ ${browser} extension zip creation failed:`, error.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Browser extension build failed:', error.message);
      throw error;
    }
  }

  createBrowserSpecificManifest(browser, browserDir) {
    const manifestPath = path.join(browserDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    switch (browser) {
      case 'firefox':
        // Firefox uses manifest v2
        manifest.manifest_version = 2;
        manifest.background = {
          scripts: ['background.js']
        };
        break;
        
      case 'safari':
        // Safari has different requirements
        manifest.permissions = manifest.permissions.filter(p => p !== 'identity');
        break;
    }
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  async createDistributionPackages() {
    console.log('\n📦 Creating distribution packages...');
    
    try {
      // Create README for downloads
      const readmeContent = `# AI Assistant Pro - Downloads

## Available Downloads

### 🌐 Web Application
- **Live URL:** https://ai-assistant-axerc984g-robertotos-projects.vercel.app
- **Static Files:** web/ directory

### 🖥️ Desktop Applications
- **Windows:** desktop/win/ directory
- **macOS:** desktop/mac/ directory  
- **Linux:** desktop/linux/ directory

### 📱 Mobile Applications
- **Android APK:** mobile/android/ai-assistant-pro-android.apk
- **iOS:** mobile/ios/ directory (requires Xcode)

### 🌐 Browser Extensions
- **Chrome:** ai-assistant-pro-chrome-extension.zip
- **Firefox:** ai-assistant-pro-firefox-extension.zip
- **Safari:** ai-assistant-pro-safari-extension.zip

## Installation Instructions

1. **Web App:** Open the live URL in your browser
2. **Desktop:** Run the installer for your platform
3. **Mobile:** Install APK (Android) or use Xcode (iOS)
4. **Extensions:** Load unpacked extension in your browser

## Support

- 📧 Email: support@aiassistantpro.com
- 📖 Documentation: https://docs.aiassistantpro.com
- 💬 Community: https://community.aiassistantpro.com

Version: ${this.version}
Build Date: ${new Date().toISOString()}
`;

      fs.writeFileSync(path.join(this.downloadsDir, 'README.md'), readmeContent);
      
      // Create version file
      const versionInfo = {
        version: this.version,
        buildDate: new Date().toISOString(),
        platforms: {
          web: true,
          desktop: {
            windows: fs.existsSync(path.join(this.downloadsDir, 'desktop', 'win')),
            macos: fs.existsSync(path.join(this.downloadsDir, 'desktop', 'mac')),
            linux: fs.existsSync(path.join(this.downloadsDir, 'desktop', 'linux'))
          },
          mobile: {
            android: fs.existsSync(path.join(this.downloadsDir, 'mobile', 'android')),
            ios: fs.existsSync(path.join(this.downloadsDir, 'mobile', 'ios'))
          },
          extensions: {
            chrome: fs.existsSync(path.join(this.downloadsDir, 'ai-assistant-pro-chrome-extension.zip')),
            firefox: fs.existsSync(path.join(this.downloadsDir, 'ai-assistant-pro-firefox-extension.zip')),
            safari: fs.existsSync(path.join(this.downloadsDir, 'ai-assistant-pro-safari-extension.zip'))
          }
        }
      };
      
      fs.writeFileSync(
        path.join(this.downloadsDir, 'version.json'), 
        JSON.stringify(versionInfo, null, 2)
      );
      
      console.log('✅ Distribution packages created successfully');
      
    } catch (error) {
      console.error('❌ Distribution package creation failed:', error.message);
      throw error;
    }
  }
}

// Run the build process
if (require.main === module) {
  const buildManager = new BuildManager();
  buildManager.buildAll().catch(console.error);
}

module.exports = BuildManager;
