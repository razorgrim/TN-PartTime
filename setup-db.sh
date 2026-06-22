#!/bin/bash
# Script to install and configure MariaDB database on Proxmox Debian/Ubuntu (VM or LXC)

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
echo " Installing and Configuring MariaDB Database "
echo "============================================="

echo "--> Updating system package index..."
run_cmd apt update -y

echo "--> Installing MariaDB server..."
run_cmd apt install -y mariadb-server

echo "--> Enabling and starting MariaDB service..."
run_cmd systemctl enable mariadb
run_cmd systemctl start mariadb

DB_PASSWORD="my1p@ssw0rd"

echo "--> Configuring database authentication and password..."
# Set root password and enforce native password plugin for Node.js mysql2 compatibility
run_cmd mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
run_cmd mysql -e "FLUSH PRIVILEGES;"

echo "--> Creating database 'tn_parttime'..."
run_cmd mysql -u root -p"${DB_PASSWORD}" -e "CREATE DATABASE IF NOT EXISTS tn_parttime;"

echo "============================================="
echo " Database setup completed successfully! "
echo "============================================="
