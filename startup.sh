#!/bin/zsh
# Start both React dev server and Electron app for First Watch PLC Code Checker

# Start React dev server in the background
npm run dev &
REACT_PID=$!

# Ensure React dev server is killed on exit or interruption
trap 'kill $REACT_PID 2>/dev/null' EXIT INT TERM

# Wait for React dev server to be ready
while ! nc -z localhost 3000; do
  echo "Waiting for React dev server..."
  sleep 1
done

echo "React dev server is running. Starting Electron..."

# Start Electron (will block until closed)
npm start

# When Electron closes, the trap will kill the React dev server
