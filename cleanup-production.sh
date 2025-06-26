#!/bin/bash
# Clean up project: remove all files and folders not required for production
# Run this from the project root directory

# Keep list (edit as needed for your project)
KEEP=(
  ".git" ".gitignore" ".env" \
  "src" "public" "package.json" "package-lock.json" "tsconfig.json" \
  "webpack.config.js" "babel.config.js" "tailwind.config.js" \
  "requirements.txt" "openai.key" "README.md" "UBUNTU_SETUP.md" \
  "node_modules" "venv" "ui"
)

# Build find expression to exclude KEEP
FIND_EXPR=""
for item in "${KEEP[@]}"; do
  FIND_EXPR+="! -name '$item' ! -path './$item/*' "
done

# Dry run: list what would be deleted
echo "[Dry Run] Files and folders that would be deleted:"
eval "find . -mindepth 1 -maxdepth 1 $FIND_EXPR"

echo
read -p "Proceed with deletion? (y/N): " confirm
if [[ $confirm =~ ^[Yy]$ ]]; then
  eval "find . -mindepth 1 -maxdepth 1 $FIND_EXPR -exec rm -rf {} +"
  echo "Cleanup complete."
else
  echo "Aborted. No files were deleted."
fi
