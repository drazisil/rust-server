#!/usr/bin/env bash
# create_admin.sh: Create or update the admin user in the oxide database with a bcrypt password
set -e

DB_PATH="data/lotus.db"
USERNAME="admin"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required." >&2
  exit 1
fi
if ! python3 -c "import bcrypt" 2>/dev/null; then
  echo "The Python 'bcrypt' module is required. Install with: pip3 install bcrypt" >&2
  exit 1
fi

read -p "Enter customer ID for admin: " CUSTOMER_ID
if ! [[ "$CUSTOMER_ID" =~ ^[0-9]+$ ]]; then
  echo "Customer ID must be a number." >&2
  exit 1
fi

read -p "Enter password for admin: " -s PASSWORD
printf "\n"
read -p "Confirm password: " -s PASSWORD2
printf "\n"
if [ "$PASSWORD" != "$PASSWORD2" ]; then
  echo "Passwords do not match." >&2
  exit 1
fi

python3 <<EOF
import bcrypt, sqlite3, sys
pw = bcrypt.hashpw('$PASSWORD'.encode(), bcrypt.gensalt()).decode()
con = sqlite3.connect('$DB_PATH')
con.execute('CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password_hash TEXT UNIQUE NOT NULL, customer_id INTEGER UNIQUE NOT NULL)')
con.execute('INSERT OR REPLACE INTO users (username, password_hash, customer_id) VALUES (?, ?, ?)',
            ('$USERNAME', pw, $CUSTOMER_ID))
con.commit()
con.close()
print('Admin user created/updated in $DB_PATH')
EOF
