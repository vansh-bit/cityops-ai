#!/usr/bin/env bash
set -euo pipefail

echo "╔══════════════════════════════════════╗"
echo "║   CityOps AI — Dev Servers          ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Trap to kill background processes on exit
cleanup() {
  echo ""
  echo "🛑 Shutting down dev servers..."
  kill 0 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

echo "🚀 Starting backend dev server..."
cd "$PROJECT_ROOT/backend" && npm run dev &
BACKEND_PID=$!

echo "🚀 Starting frontend dev server..."
cd "$PROJECT_ROOT/frontend" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "═══════════════════════════════════════"
echo "  Backend:  http://localhost:3001"
echo "  Frontend: http://localhost:5173"
echo "  Health:   http://localhost:3001/api/v1/health"
echo "═══════════════════════════════════════"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for all background processes
wait
