#!/bin/sh
# uninstall.sh: Remove my-socket-server systemd service

SERVICE_FILE="/etc/systemd/system/my-socket-server.service"

if [ "$(uname)" = 'Linux' ] && [ -d /etc/systemd/system ]; then
  echo "Stopping and disabling my-socket-server service..."
  sudo systemctl stop my-socket-server 2>/dev/null || true
  sudo systemctl disable my-socket-server 2>/dev/null || true
  if [ -f "$SERVICE_FILE" ]; then
    echo "Removing $SERVICE_FILE..."
    sudo rm "$SERVICE_FILE"
    sudo systemctl daemon-reload
    echo "my-socket-server service removed."
  else
    echo "Service file not found: $SERVICE_FILE"
  fi
else
  echo "Systemd not detected or not supported. Nothing to uninstall."
fi
