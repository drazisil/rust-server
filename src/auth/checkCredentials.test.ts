// src/auth/checkCredentials.test.ts
import { checkCredentials } from './checkCredentials';

// Use Vitest's async test support
import { describe, it, expect } from 'vitest';

describe('checkCredentials', () => {
    const uniqueAdmin = `admin_test_${Date.now()}`;
    const uniqueUser = `user_test_${Date.now()}`;

    it('returns true for valid admin credentials', async () => {
        // Add user first to ensure hash exists
        await import('./checkCredentials').then(m => m.addUser(uniqueAdmin, 'admin123'));
        expect(await checkCredentials(uniqueAdmin, 'admin123')).toBe(true);
    });

    it('returns true for valid user credentials', async () => {
        await import('./checkCredentials').then(m => m.addUser(uniqueUser, 'password'));
        expect(await checkCredentials(uniqueUser, 'password')).toBe(true);
    });

    it('returns false for invalid password', async () => {
        expect(await checkCredentials(uniqueAdmin, 'wrongpass')).toBe(false);
    });

    it('returns false for invalid username', async () => {
        expect(await checkCredentials('notarealuser', 'admin123')).toBe(false);
    });

    it('returns false for missing username', async () => {
        expect(await checkCredentials('', 'admin123')).toBe(false);
    });

    it('returns false for missing password', async () => {
        expect(await checkCredentials(uniqueAdmin, '')).toBe(false);
    });

    it('returns false for both username and password missing', async () => {
        expect(await checkCredentials('', '')).toBe(false);
    });

    it('returns false for non-existent username with valid password', async () => {
        // Regression: frank is not in users.json, but admin's password is valid for admin only
        expect(await checkCredentials('frank', 'admin123')).toBe(false);
    });

    it('regression: does not allow login for non-existent user with valid password', async () => {
        expect(await checkCredentials('frank', 'admin')).toBe(false);
    });
});
