#!/bin/zsh
# Setup Python virtual environment and install required packages for First Watch PLC Code Checker

VENV_DIR="venv"

if [ ! -d "$VENV_DIR" ]; then
  echo "Creating virtual environment..."
  python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"

pip install --upgrade pip
pip install python-dotenv openai

echo "\nVirtual environment setup complete. To activate later, run:"
echo "  source $VENV_DIR/bin/activate"
echo "\nTo check OpenAI API connectivity, run:"
echo "  python3 src/python/analyzer.py --check-openai"
