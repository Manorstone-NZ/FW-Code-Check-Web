# Ubuntu Setup Guide for First Watch PLC Code Checker

## Prerequisites
- Ubuntu 20.04 or later
- Python 3.8+
- Node.js 16+ and npm
- Git (optional, for version control)

## 1. Install System Dependencies
```
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nodejs npm
```

## 2. Clone the Repository (if not already done)
```
git clone <your-repo-url>
cd first-watch-plc-code-checker-v2\ ubuntu
```

## 3. Set Up Python Virtual Environment
```np
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
# Install any required Python packages (if requirements.txt exists):
# pip install -r requirements.txt
```

## 4. Install Node.js Dependencies
```
npm ci
# or if you get errors, try:
npm install
```

## 5. Build and Start the Application
```
npm run build
npm start
```

## 6. Running Scripts and Tests
- Use the provided `.sh` scripts for various tasks:
  - `./startup.sh` — full environment setup and launch
  - `./start-app.sh` — start the app
  - `./run-all-tests.sh` — run all tests

## 7. Notes
- If you see permission errors, make scripts executable:
  ```
  chmod +x *.sh
  ```
- If you use a different shell (e.g., zsh), you may need to install it: `sudo apt install zsh`
- For Electron or GUI features, ensure you have a desktop environment and required libraries.

---
For any issues, check the script output or consult the project documentation.
