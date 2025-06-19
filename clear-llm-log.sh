#!/bin/zsh
# Clear the LLM log file for the main app
LOG_FILE="llm-interactions.log.json"
if [ -f "$LOG_FILE" ]; then
  > "$LOG_FILE"
  echo "Cleared $LOG_FILE."
else
  echo "$LOG_FILE does not exist."
fi
