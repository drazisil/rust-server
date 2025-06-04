// src/auth/checkCredentials.test.ts
import { Sequelize } from 'sequelize';
import { defineUserModel, addUser, checkCredentials } from './checkCredentials';
import { describe, it, expect, beforeAll } from 'vitest';

// Create a fresh in-memory DB and User model for tests
const testSequelize = new Sequelize('sqlite::memory:', { logging: false });
const TestUser = defineUserModel(testSequelize);

beforeAll(async () => {
    await testSequelize.sync({ force: true });
});

describe('checkCredentials', () => {
    const uniqueAdmin = `admin_test_${Date.now()}`;
    const uniqueUser = `user_test_${Date.now()}`;
    const adminCustomerId = `cid_admin_${Date.now()}`;
    const userCustomerId = `cid_user_${Date.now()}`;

    it('returns true for valid admin credentials', async () => {
        await addUser(uniqueAdmin, 'admin123', adminCustomerId, TestUser);
        expect(await checkCredentials(uniqueAdmin, 'admin123', TestUser)).toBe(true);
    });

    it('returns true for valid user credentials', async () => {
        await addUser(uniqueUser, 'password', userCustomerId, TestUser);
        expect(await checkCredentials(uniqueUser, 'password', TestUser)).toBe(true);
    });

    it('returns false for invalid password', async () => {
        expect(await checkCredentials(uniqueAdmin, 'wrongpass', TestUser)).toBe(false);
    });

    it('returns false for invalid username', async () => {
        expect(await checkCredentials('notarealuser', 'admin123', TestUser)).toBe(false);
    });

    it('returns false for missing username', async () => {
        expect(await checkCredentials('', 'admin123', TestUser)).toBe(false);
    });

    it('returns false for missing password', async () => {
        expect(await checkCredentials(uniqueAdmin, '', TestUser)).toBe(false);
    });

    it('returns false for both username and password missing', async () => {
        expect(await checkCredentials('', '', TestUser)).toBe(false);
    });

    it('returns false for non-existent username with valid password', async () => {
        expect(await checkCredentials('frank', 'admin123', TestUser)).toBe(false);
    });

    it('regression: does not allow login for non-existent user with valid password', async () => {
        expect(await checkCredentials('frank', 'admin', TestUser)).toBe(false);
    });
});
