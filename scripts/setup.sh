#!/usr/bin/env bash
set -euo pipefail

echo "╔══════════════════════════════════════╗"
echo "║   CityOps AI — Project Setup        ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "📦 Installing backend dependencies..."
cd "$PROJECT_ROOT/backend"
npm install
echo "✅ Backend dependencies installed"
echo ""

echo "📦 Installing frontend dependencies..."
cd "$PROJECT_ROOT/frontend"
npm install
echo "✅ Frontend dependencies installed"
echo ""

echo "📦 Installing shared dependencies..."
cd "$PROJECT_ROOT/shared"
npm install
echo "✅ Shared dependencies installed"
echo ""

# Copy .env.example to .env if .env doesn't exist
if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
  cp "$PROJECT_ROOT/backend/.env.example" "$PROJECT_ROOT/backend/.env"
  echo "📋 Created backend/.env from .env.example"
  echo "   ⚠️  Please update backend/.env with your actual values"
else
  echo "ℹ️  backend/.env already exists, skipping"
fi

if [ ! -f "$PROJECT_ROOT/frontend/.env" ]; then
  if [ -f "$PROJECT_ROOT/frontend/.env.example" ]; then
    cp "$PROJECT_ROOT/frontend/.env.example" "$PROJECT_ROOT/frontend/.env"
    echo "📋 Created frontend/.env from .env.example"
    echo "   ⚠️  Please update frontend/.env with your actual values"
  fi
else
  echo "ℹ️  frontend/.env already exists, skipping"
fi

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   ✅ Setup complete!                ║"
echo "║                                      ║"
echo "║   Next steps:                        ║"
echo "║   1. Update backend/.env             ║"
echo "║   2. Update frontend/.env            ║"
echo "║   3. Run: ./scripts/dev.sh           ║"
echo "╚══════════════════════════════════════╝"
