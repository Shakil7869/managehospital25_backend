#!/bin/bash

# MediAI Backend Setup & Start Script

echo "🚀 MediAI HealthOS Backend Setup"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"

# Navigate to backend directory
cd "$(dirname "$0")/backend" || exit 1

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "⚠️  IMPORTANT: Please update your Firebase credentials in backend/.env"
echo "   Follow the guide in FIREBASE_MONGODB_SETUP.md"
echo ""

# Check if .env exists and has credentials
if ! grep -q "FIREBASE_PRIVATE_KEY=.*-----" backend/.env 2>/dev/null; then
    echo "⚠️  WARNING: Firebase credentials not yet configured in .env"
    echo "   Copy your Firebase service account JSON and update .env file"
fi

echo ""
echo "🎯 Starting MediAI Backend Server..."
echo ""

# Start the server
npm run dev
