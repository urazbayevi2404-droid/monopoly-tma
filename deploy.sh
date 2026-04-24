#!/bin/bash

# === Deploy to Vercel ===
# This script builds and deploys the project to Vercel

echo "🚀 Building monopoly-tma..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build succeeded!"
echo ""
echo "📦 To deploy to Vercel:"
echo "1. Install Vercel CLI: npm i -g vercel"
echo "2. Run: vercel"
echo "3. Follow the prompts"
echo ""
echo "OR manually:"
echo "1. Push to GitHub: git push origin main"
echo "2. Go to vercel.com"
echo "3. Import project from GitHub"
echo "4. Add environment variables from .env"
echo "5. Deploy!"
