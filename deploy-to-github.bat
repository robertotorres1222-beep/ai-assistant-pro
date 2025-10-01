@echo off
REM deploy-to-github.bat - Deploy AI Assistant Pro to GitHub
echo 🚀 Deploying AI Assistant Pro to GitHub...

REM Navigate to the project directory
cd /d "%~dp0"

echo.
echo 📁 Current directory: %CD%
echo.

echo 🔍 Checking Git status...
git status
echo.

echo 📝 Adding all changes...
git add .

echo 💾 Committing changes...
git commit -m "Update AI Assistant Pro - Ready for deployment"

echo 🌐 Pushing to GitHub...
echo.
echo ⚠️  IMPORTANT: Make sure you've already:
echo    1. Created a GitHub repository
echo    2. Added it as remote origin
echo    3. Set up your GitHub credentials
echo.

git push origin main

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCESS! Your project has been pushed to GitHub!
    echo.
    echo 🎯 NEXT STEPS:
    echo 1. Go to https://vercel.com/dashboard
    echo 2. Click "New Project"
    echo 3. Import your GitHub repository
    echo 4. Set environment variables
    echo 5. Deploy!
    echo.
    echo 🚀 Your AI Assistant Pro will be live soon!
) else (
    echo.
    echo ❌ Push failed. Please check:
    echo    - GitHub repository exists
    echo    - Remote origin is set correctly
    echo    - GitHub credentials are configured
    echo    - Internet connection is working
    echo.
    echo 🔧 To set up remote origin, run:
    echo    git remote add origin https://github.com/YOUR_USERNAME/ai-assistant-pro.git
)

echo.
pause
