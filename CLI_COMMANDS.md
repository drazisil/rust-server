# Admin CLI Usage

The admin CLI (`src/admin-cli.ts`) provides commands for managing and interacting with your socket server and user authentication system.

## Usage

```sh
npx ts-node src/admin-cli.ts <command> [arguments...]
```

## Commands

### 1. `ping`

Ping all configured ports on the configured host to check if they are open.

**Usage:**
```sh
npx ts-node src/admin-cli.ts ping
```

---

### 2. `parse <hexstring>`

Parse a hex-encoded payload and display protocol detection and parsing details.

**Usage:**
```sh
npx ts-node src/admin-cli.ts parse <hexstring>
```
- `<hexstring>`: The payload to parse, as a hex string (no spaces).

---

### 3. `adduser <username> <password>`

Add a new user account to the authentication database.

**Usage:**
```sh
npx ts-node src/admin-cli.ts adduser <username> <password>
```
- `<username>`: The username for the new account.
- `<password>`: The password for the new account (will be securely hashed).

**Note:** Fails if the user already exists.

---

### 4. `checkuser <username> <password>`

Check if the given username and password are valid.

**Usage:**
```sh
npx ts-node src/admin-cli.ts checkuser <username> <password>
```
- `<username>`: The username to check.
- `<password>`: The password to check.

**Output:**  
Prints whether the credentials are valid or invalid.

---

### 5. `listusers`

List all usernames currently stored in the authentication database.

**Usage:**
```sh
npx ts-node src/admin-cli.ts listusers
```

**Output:**  
Prints a list of all usernames.

---

## Example

```sh
npx ts-node src/admin-cli.ts adduser alice secret123
npx ts-node src/admin-cli.ts checkuser alice secret123
npx ts-node src/admin-cli.ts listusers
```

---

**Notes:**
- All user data is stored in a persistent SQLite database (`src/auth/users.sqlite`).
- Passwords are securely hashed using bcrypt.
- You must have Node.js and all dependencies installed to use the CLI.

---
