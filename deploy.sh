#!/bin/bash

# AI Assistant Pro - Deployment Script
# This script deploys the application to various platforms

set -e

echo "🚀 AI Assistant Pro Deployment Script"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm"
        exit 1
    fi
    
    print_success "Dependencies check passed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
    cd backend && npm install && cd ..
    print_success "Dependencies installed"
}

# Build the application
build_application() {
    print_status "Building application..."
    npm run build
    print_success "Application built successfully"
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    vercel --prod
    print_success "Deployed to Vercel"
}

# Deploy to Netlify
deploy_netlify() {
    print_status "Deploying to Netlify..."
    
    if ! command -v netlify &> /dev/null; then
        print_status "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    netlify deploy --prod --dir=dist
    print_success "Deployed to Netlify"
}

# Deploy to GitHub Pages
deploy_github_pages() {
    print_status "Deploying to GitHub Pages..."
    
    # Create gh-pages branch and deploy
    npm install -g gh-pages
    gh-pages -d dist
    print_success "Deployed to GitHub Pages"
}

# Build Electron app
build_electron() {
    print_status "Building Electron application..."
    npm run electron:dist
    print_success "Electron app built"
}

# Deploy to Docker
deploy_docker() {
    print_status "Building Docker image..."
    
    cd backend
    docker build -t ai-assistant-pro-backend .
    
    print_status "Running Docker container..."
    docker run -d -p 3001:3001 --name ai-assistant-pro ai-assistant-pro-backend
    
    print_success "Docker deployment completed"
}

# Setup environment variables
setup_env() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        print_warning "Creating .env file from example..."
        cp .env.example .env
        print_warning "Please edit .env file with your API keys before deploying"
    fi
    
    if [ ! -f backend/.env ]; then
        print_warning "Creating backend .env file..."
        cp .env.example backend/.env
        print_warning "Please edit backend/.env file with your API keys before deploying"
    fi
}

# Main deployment function
main() {
    local platform=$1
    
    case $platform in
        "vercel")
            check_dependencies
            install_dependencies
            build_application
            deploy_vercel
            ;;
        "netlify")
            check_dependencies
            install_dependencies
            build_application
            deploy_netlify
            ;;
        "github")
            check_dependencies
            install_dependencies
            build_application
            deploy_github_pages
            ;;
        "electron")
            check_dependencies
            install_dependencies
            build_electron
            ;;
        "docker")
            check_dependencies
            install_dependencies
            deploy_docker
            ;;
        "all")
            check_dependencies
            install_dependencies
            build_application
            build_electron
            print_success "All builds completed. Choose deployment platform:"
            echo "  - Vercel: ./deploy.sh vercel"
            echo "  - Netlify: ./deploy.sh netlify"
            echo "  - GitHub Pages: ./deploy.sh github"
            echo "  - Docker: ./deploy.sh docker"
            ;;
        "setup")
            check_dependencies
            install_dependencies
            setup_env
            print_success "Setup completed. Edit .env files with your API keys."
            ;;
        *)
            echo "Usage: $0 {vercel|netlify|github|electron|docker|all|setup}"
            echo ""
            echo "Commands:"
            echo "  vercel   - Deploy to Vercel"
            echo "  netlify  - Deploy to Netlify"
            echo "  github   - Deploy to GitHub Pages"
            echo "  electron - Build Electron desktop app"
            echo "  docker   - Deploy with Docker"
            echo "  all      - Build everything"
            echo "  setup    - Initial setup"
            echo ""
            echo "Examples:"
            echo "  $0 setup    # Initial setup"
            echo "  $0 vercel   # Deploy to Vercel"
            echo "  $0 electron # Build desktop app"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
