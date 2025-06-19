#!/bin/zsh
# Enhanced startup script for First Watch PLC Code Checker
# Ensures Python venv, dependencies, React dev server, and Electron all start correctly

# 0. Kill any process using port 3000 (React dev server)
PORT=3000
PIDS=$(lsof -ti tcp:$PORT)
if [ -n "$PIDS" ]; then
  echo "Killing process(es) on port $PORT (PID(s): $PIDS)"
  echo $PIDS | xargs kill -9
  sleep 1
fi

# 1. Setup Python virtual environment and install dependencies
if [ ! -d "venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt 2>/dev/null || pip install python-dotenv openai requests

echo "Python environment ready."

deactivate

# 2. Install Node.js dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing Node.js dependencies..."
  npm install
fi

# 3. Start React dev server in the background
npm run dev &
REACT_PID=$!

# Ensure React dev server is killed on exit or interruption
trap 'kill $REACT_PID 2>/dev/null' EXIT INT TERM

# 4. Wait for React dev server to be ready
while ! nc -z localhost 3000; do
  echo "Waiting for React dev server..."
  sleep 1
done

echo "React dev server is running. Starting Electron..."

# 5. Start Electron (will block until closed)
npm start

# When Electron closes, the trap will kill the React dev server
