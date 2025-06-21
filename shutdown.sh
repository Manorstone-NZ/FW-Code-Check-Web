#!/bin/zsh
# Enhanced shutdown script for First Watch PLC Code Checker

echo "🛑 Shutting down First Watch PLC Code Checker..."

# Kill Electron app if running
echo "   Stopping Electron application..."
pkill -f "electron" 2>/dev/null && echo "   ✅ Electron stopped" || echo "   ℹ️  Electron not running"

# Kill React dev server if running (npm run dev)
echo "   Stopping React development server..."
PORT=3000
PIDS=$(lsof -ti tcp:$PORT 2>/dev/null)
if [ -n "$PIDS" ]; then
  echo $PIDS | xargs kill -9 2>/dev/null
  echo "   ✅ React dev server stopped (port $PORT)"
else
  echo "   ℹ️  React dev server not running"
fi

# Kill any npm processes
echo "   Stopping npm processes..."
pkill -f "npm start" 2>/dev/null && echo "   ✅ npm processes stopped" || echo "   ℹ️  No npm processes running"
pkill -f "npm run dev" 2>/dev/null && echo "   ✅ npm dev processes stopped" || echo "   ℹ️  No npm dev processes running"

# Optional: Stop Ollama if it was started by our script
# Uncomment the next line if you want to stop Ollama as well
# pkill -f "ollama serve" 2>/dev/null && echo "   ✅ Ollama stopped" || echo "   ℹ️  Ollama not running"

echo "✅ Shutdown complete!"
