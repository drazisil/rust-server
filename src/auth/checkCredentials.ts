// src/auth/checkCredentials.ts

/**
 * Dummy in-memory user database. Replace with a real DB or config as needed.
 */
const users: Record<string, string> = {
    'admin': 'admin123',
    'user': 'password',
    // Add more users as needed
};

/**
 * Checks if the provided username and password are valid.
 * @param username The username to check
 * @param password The password to check
 * @returns true if valid, false otherwise
 */
export function checkCredentials(username: string, password: string): boolean {
    if (!username || !password) return false;
    return users[username] === password;
}
