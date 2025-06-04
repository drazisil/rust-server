// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2025 The Oxide Authors
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

// src/auth/checkCredentials.test.ts
import { Sequelize } from 'sequelize';
import { defineUserModel, addUser, checkCredentials } from './checkCredentials';
import { describe, it, expect, beforeAll } from 'vitest';

// Create a fresh in-memory DB and User model for tests
const testSequelize = new Sequelize('sqlite://:memory:', { logging: false });
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

describe('getCustomerIdByUsername', () => {
    const testUser = `customerid_test_${Date.now()}`;
    const testCustomerId = `cid_test_${Date.now()}`;

    it('returns the correct customerId for an existing user', async () => {
        await addUser(testUser, 'testpass', testCustomerId, TestUser);
        const cid = await import('./checkCredentials').then(m => m.getCustomerIdByUsername(testUser, TestUser));
        expect(cid).toBe(testCustomerId);
    });

    it('returns null for a non-existent user', async () => {
        const cid = await import('./checkCredentials').then(m => m.getCustomerIdByUsername('notarealuser', TestUser));
        expect(cid).toBeNull();
    });
});
