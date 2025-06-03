// src/auth/checkCredentials.ts

import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcrypt';

/**
 * Dummy in-memory user database. Replace with a real DB or config as needed.
 */
const users: Record<string, string> = {
    'admin': 'admin123',
    'user': 'password',
    // Add more users as needed
};

const USERS_FILE = path.join(__dirname, 'users.json');

function loadUsers(): Record<string, string> {
    if (fs.existsSync(USERS_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        } catch (e) {
            return {};
        }
    }
    return {};
}

function saveUsers(users: Record<string, string>) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

export async function addUser(username: string, password: string): Promise<boolean> {
    if (!username || !password) return false;
    const users = loadUsers();
    if (users[username]) return false; // User already exists
    const hash = await bcrypt.hash(password, 10);
    users[username] = hash;
    saveUsers(users);
    return true;
}

/**
 * Checks if the provided username and password are valid.
 * @param username The username to check
 * @param password The password to check
 * @returns true if valid, false otherwise
 */
export async function checkCredentials(username: string, password: string): Promise<boolean> {
    if (!username || !password) return false;
    const users = loadUsers();
    const hash = users[username];
    if (!hash) return false;
    return bcrypt.compare(password, hash);
}
