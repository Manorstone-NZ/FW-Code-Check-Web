#!/bin/zsh
# Shutdown script for First Watch PLC Code Checker

# Kill Electron app if running
pkill -f electron || true

# Kill React dev server if running (npm run dev)
# Find the process running on port 3000 and kill it
PORT=3000
PID=$(lsof -ti tcp:$PORT)
if [ ! -z "$PID" ]; then
  kill $PID
  echo "Killed process on port $PORT (React dev server)"
fi
