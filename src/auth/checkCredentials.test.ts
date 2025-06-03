// src/auth/checkCredentials.test.ts
import { describe, it, expect } from 'vitest';
import { checkCredentials } from './checkCredentials';

describe('checkCredentials', () => {
    it('returns true for valid admin credentials', () => {
        expect(checkCredentials('admin', 'admin123')).toBe(true);
    });

    it('returns true for valid user credentials', () => {
        expect(checkCredentials('user', 'password')).toBe(true);
    });

    it('returns false for invalid password', () => {
        expect(checkCredentials('admin', 'wrongpass')).toBe(false);
    });

    it('returns false for invalid username', () => {
        expect(checkCredentials('notarealuser', 'admin123')).toBe(false);
    });

    it('returns false for missing username', () => {
        expect(checkCredentials('', 'admin123')).toBe(false);
    });

    it('returns false for missing password', () => {
        expect(checkCredentials('admin', '')).toBe(false);
    });

    it('returns false for both username and password missing', () => {
        expect(checkCredentials('', '')).toBe(false);
    });
});
