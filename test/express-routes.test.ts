// SPDX-License-Identifier: GPL-3.0-or-later
import request from 'supertest';
import app from '../src/express-app';
import { describe, it, expect, beforeAll } from 'vitest';
import { defineShardModel } from '../src/auth/shardModel.js';
import { Sequelize } from 'sequelize';

// You may want to mock DB or seed test data for /AuthLogin and /ShardList

describe('Express routes', () => {
  describe('GET /AuthLogin', () => {
    it('should return 400 with correct error format if username or password is missing', async () => {
      const res = await request(app).get('/AuthLogin');
      expect(res.status).toBe(400);
      expect(res.text).toMatch(/reasoncode=INV-100/);
      expect(res.text).toMatch(/reasontext=Opps!/);
      expect(res.text).toMatch(/reasonurl=https:\/\/winehq.com/);
    });
    // Add more tests for valid/invalid login if you have test users
  });

  describe('GET /ShardList/', () => {
    // Create a fresh in-memory DB and User model for tests
    const testSequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false
    });
    const TestShard = defineShardModel(testSequelize);

    beforeAll(async () => {
      await testSequelize.sync({ force: true });

      // Seed a test shard if none exist
      await TestShard.create({
        id: 1,
        name: 'Test Shard',
        description: 'A test shard',
        loginServerIp: '127.0.0.1',
        loginServerPort: 1234,
        lobbyServerIp: '127.0.0.1',
        lobbyServerPort: 1235,
        mcotsServerIp: '127.0.0.1',
        statusId: 1,
        statusReason: 'Online',
        serverGroupName: 'TestGroup',
        population: 1,
        maxPersonasPerUser: 1,
        diagnosticServerHost: '127.0.0.1',
        diagnosticServerPort: 1236
      });
    });
    it('should return 200 and a text response', async () => {
      const res = await request(app).get('/ShardList/');
      expect(res.status).toBe(200);
      expect(res.type).toMatch(/text/);
      expect(res.text).toMatch(/\[.*\]([\s\S]*ShardId=)/); // crude check for shard format
    });
  });

  describe('Fallback route', () => {
    it('should return 200 for unknown routes', async () => {
      const res = await request(app).get('/not-a-real-route');
      expect(res.status).toBe(200);
      expect(res.text).toMatch(/Request forwarded to Express server/);
    });
  });
});
