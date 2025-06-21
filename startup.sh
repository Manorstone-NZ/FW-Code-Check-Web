#!/bin/zsh
# Enhanced startup script for First Watch PLC Code Checker
# Ensures Python venv, dependencies, React dev server, and Electron all start correctly

echo "🚀 Starting First Watch PLC Code Checker..."

# 0. Kill any existing processes
echo "🧹 Cleaning up existing processes..."
PORT=3000
PIDS=$(lsof -ti tcp:$PORT 2>/dev/null)
if [ -n "$PIDS" ]; then
  echo "   Killing process(es) on port $PORT (PID(s): $PIDS)"
  echo $PIDS | xargs kill -9
  sleep 1
fi

# Kill any existing electron processes
pkill -f "electron" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true

# 1. Setup Python virtual environment and install dependencies
echo "🐍 Setting up Python environment..."
if [ ! -d "venv" ]; then
  echo "   Creating Python virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate

# Upgrade pip and install Python dependencies
echo "   Installing Python dependencies..."
pip install --upgrade pip --quiet
if [ -f "requirements.txt" ]; then
  pip install -r requirements.txt --quiet
else
  pip install python-dotenv openai requests pyyaml --quiet
fi

echo "   ✅ Python environment ready."
deactivate

# 2. Install Node.js dependencies if needed
echo "📦 Setting up Node.js dependencies..."
if [ ! -d "node_modules" ]; then
  echo "   Installing Node.js dependencies..."
  npm install --silent
else
  echo "   ✅ Node.js dependencies already installed."
fi

# 3. Check if Ollama is running (optional dependency)
echo "🤖 Checking Ollama status..."
if command -v ollama >/dev/null 2>&1; then
  if ollama list >/dev/null 2>&1; then
    echo "   ✅ Ollama is running and accessible."
  else
    echo "   ⚠️  Ollama installed but not running. Starting Ollama service..."
    ollama serve >/dev/null 2>&1 &
    sleep 2
  fi
else
  echo "   ⚠️  Ollama not installed. Only OpenAI models will be available."
fi

# 4. Start React dev server in the background
echo "⚛️  Starting React development server..."
npm run dev > /dev/null 2>&1 &
REACT_PID=$!

# Ensure React dev server is killed on exit or interruption
trap 'echo "🛑 Shutting down..."; kill $REACT_PID 2>/dev/null; pkill -f "ollama serve" 2>/dev/null; exit' EXIT INT TERM

# 5. Wait for React dev server to be ready
echo "   Waiting for React dev server to start..."
TIMEOUT=30
COUNTER=0
while ! nc -z localhost 3000 2>/dev/null; do
  if [ $COUNTER -ge $TIMEOUT ]; then
    echo "   ❌ React dev server failed to start within $TIMEOUT seconds"
    exit 1
  fi
  echo "   ..."
  sleep 1
  COUNTER=$((COUNTER + 1))
done

echo "   ✅ React dev server is running on http://localhost:3000"

# 6. Final setup checks
echo "🔧 Performing final checks..."
if [ ! -f "firstwatch.db" ]; then
  echo "   Creating database..."
  touch firstwatch.db
fi

if [ ! -f "openai.key" ]; then
  echo "   ⚠️  No OpenAI key found. Create 'openai.key' file with your API key."
fi

echo "✅ All systems ready! Starting Electron..."

# 7. Start Electron (will block until closed)
npm start

# When Electron closes, the trap will kill the React dev server
