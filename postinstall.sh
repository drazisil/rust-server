#!/bin/sh
# postinstall.sh: Post-install steps for my-socket-server

# Make CLI executable
chmod +x ./src/admin-cli.ts

# Build TypeScript
npm run build

# If on Linux with systemd, install and start the service
echo "Checking for systemd..."
if [ "$(uname)" = 'Linux' ] && [ -d /etc/systemd/system ]; then
  echo "Installing systemd service..."
  sudo cp ./my-socket-server.service /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable --now my-socket-server
  echo "Systemd service installed and started."
else
  echo "Systemd not detected or not supported. Skipping service install."
fi
