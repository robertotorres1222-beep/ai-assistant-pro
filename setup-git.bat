@echo off
REM setup-git.bat - Automated Git Setup for AI Assistant Pro
echo 🚀 Setting up Git deployment for AI Assistant Pro...

REM Navigate to the project directory
cd /d "%~dp0"

echo.
echo 📁 Current directory: %CD%
echo.

echo 🔧 Step 1: Initializing Git repository...
git init
if %errorlevel% neq 0 (
    echo ❌ Git not found! Please install Git first.
    echo Download from: https://git-scm.com/downloads
    pause
    exit /b 1
)

echo ✅ Git repository initialized

echo.
echo 📝 Step 2: Adding all files to Git...
git add .
echo ✅ Files added to Git

echo.
echo 💾 Step 3: Creating initial commit...
git commit -m "Initial commit - AI Assistant Pro with all features"
if %errorlevel% neq 0 (
    echo ⚠️ No changes to commit (repository might already be initialized)
)

echo ✅ Initial commit created

echo.
echo 🌿 Step 4: Setting main branch...
git branch -M main
echo ✅ Main branch set

echo.
echo 🔗 Step 5: Ready to connect to GitHub!
echo.
echo 📋 NEXT STEPS:
echo 1. Go to https://github.com
echo 2. Create a new repository named "ai-assistant-pro"
echo 3. Copy the repository URL
echo 4. Run this command with your repository URL:
echo    git remote add origin https://github.com/YOUR_USERNAME/ai-assistant-pro.git
echo    git push -u origin main
echo.
echo 🎯 Your project is ready for GitHub deployment!

pause
