#!/bin/zsh

# Stop any running Electron app (if started in background)
pkill -f electron || true

# Remove the SQLite database (reset all analyses)
rm -f firstwatch.db

# Remove build artifacts for a clean frontend build
rm -rf public/bundle.js public/bundle.js.LICENSE.txt

# Always reinstall dependencies for a clean state
npm ci

# Rebuild the frontend
npm run build

# Always re-initialize the database schema
python3 src/python/analyzer.py --init-db

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
