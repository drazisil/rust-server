#!/bin/sh
# uninstall.sh: Remove oxide systemd service

SERVICE_FILE="/etc/systemd/system/oxide.service"

if [ "$(uname)" = 'Linux' ] && [ -d /etc/systemd/system ]; then
  echo "Stopping and disabling oxide service..."
  sudo systemctl stop oxide 2>/dev/null || true
  sudo systemctl disable oxide 2>/dev/null || true
  if [ -f "$SERVICE_FILE" ]; then
    echo "Removing $SERVICE_FILE..."
    sudo rm "$SERVICE_FILE"
    sudo systemctl daemon-reload
    echo "oxide service removed."
  else
    echo "Service file not found: $SERVICE_FILE"
  fi
else
  echo "Systemd not detected or not supported. Nothing to uninstall."
fi
