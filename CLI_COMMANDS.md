# Admin CLI Usage

The admin CLI (`src/admin-cli.ts`) provides commands for managing and interacting with your oxide server and user authentication system.

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

### 3. `adduser <username> <password> <customerId>`

Add a new user account to the authentication database.

**Usage:**
```sh
npx ts-node src/admin-cli.ts adduser <username> <password> <customerId>
```
- `<username>`: The username for the new account.
- `<password>`: The password for the new account (will be securely hashed).
- `<customerId>`: The customer ID to associate with this user (required).

**Note:** Fails if the user already exists or input is invalid.

---

### 4. `checkuser <username> <password>`

Check if the given username and password are valid.

**Usage:**
```sh
npx ts-node src/admin-cli.ts checkuser <username> <password>
```
- `<username>`: The username to check.
- `<password>`: The password to check.

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

### 6. `getcustomerid <username>`

Fetch the customerId for a given username (no password required).

**Usage:**
```sh
npx ts-node src/admin-cli.ts getcustomerid <username>
```
- `<username>`: The username whose customerId you want to fetch.

**Output:**  
Prints the customerId for the user, or a not found message if the user does not exist.

---

## Example

```sh
npx ts-node src/admin-cli.ts adduser alice secret123 CUST-001
npx ts-node src/admin-cli.ts checkuser alice secret123
npx ts-node src/admin-cli.ts listusers
npx ts-node src/admin-cli.ts getcustomerid alice
```

---

**Notes:**
- All user data is stored in a persistent SQLite database (`src/auth/users.sqlite`).
- Passwords are securely hashed using bcrypt.
- You must have Node.js and all dependencies installed to use the CLI.

---

# CLI Commands

This project is a C++/CMake server. Common commands:

## Build

```sh
cmake -S . -B build
cmake --build build
```

## Run

```sh
./build/my-socket-server
```

## Clean

```sh
rm -rf build/
```

---

**Note:** All commands are for the C++/CMake version. Node.js/TypeScript commands are obsolete.
