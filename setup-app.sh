#!/bin/bash
# Script to install Node.js, PM2, and deploy the application on Proxmox Debian/Ubuntu (VM or LXC)

# Exit immediately if a command exits with a non-zero status
set -e

# Helper to run commands as root if not already root
run_cmd() {
  if [ "$EUID" -ne 0 ]; then
    sudo "$@"
  else
    "$@"
  fi
}

echo "============================================="
echo " Deploying TN Part-Timer Portal Web Application "
echo "============================================="

# 1. Install Node.js LTS (Node 20) via NodeSource
if ! command -v node &> /dev/null; then
  echo "--> Node.js not found. Installing Node.js 20 LTS..."
  run_cmd apt install -y curl
  curl -fsSL https://deb.nodesource.com/setup_20.x | run_cmd bash -
  run_cmd apt install -y nodejs
else
  echo "--> Node.js is already installed ($(node -v))"
fi

# 2. Install PM2 globally
if ! command -v pm2 &> /dev/null; then
  echo "--> Installing PM2 globally..."
  run_cmd npm install -g pm2
else
  echo "--> PM2 is already installed ($(pm2 -v))"
fi

# 3. Setup Environment Variables
if [ ! -f .env ]; then
  echo "--> Creating default .env configuration..."
  cat <<EOT > .env
PORT=5005
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=my1p@ssw0rd
DB_NAME=tn_parttime
NODE_ENV=production
EOT
else
  echo "--> .env configuration already exists."
fi

# 4. Install Project Dependencies
echo "--> Installing project dependencies..."
npm install

# 5. Build React Client Frontend
echo "--> Building static frontend assets..."
npm run build

# 6. Start Application in PM2
echo "--> Starting application under PM2..."
pm2 start ecosystem.config.cjs

# 7. Configure PM2 Startup
echo "--> Configuring PM2 startup scripts..."
pm2 save

echo "============================================="
echo " Application deployment completed successfully! "
echo " Access the web portal at: http://<your-server-ip>:5005 "
echo "============================================="
