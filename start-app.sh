#!/bin/zsh
# Start both React dev server and Electron app for First Watch PLC Code Checker

# Start React dev server in the background
npm run dev &
REACT_PID=$!

# Wait for React dev server to be ready
while ! nc -z localhost 3000; do
  echo "Waiting for React dev server..."
  sleep 1
done

echo "React dev server is running. Starting Electron..."

# Start Electron (will block until closed)
npm start

# When Electron closes, kill the React dev server
kill $REACT_PID
