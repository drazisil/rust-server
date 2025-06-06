// SPDX-License-Identifier: GPL-3.0-or-later
// Bootstrap initial records for shards and users using Sequelize models
import { sequelize as shardSequelize, Shard } from './shards';
import { sequelize as userSequelize, User } from './auth/checkCredentials';
import bcrypt from 'bcrypt';
import { EXTERNAL_SERVER_HOST } from './config';

async function ensureShardRecord() {
  await shardSequelize.sync();
  const count = await Shard.count();
  if (count === 0) {
    await Shard.create({
      id: 1985,
      name: 'Hilly Valley',
      description: 'Where it all began',
      loginServerIp: EXTERNAL_SERVER_HOST,
      loginServerPort: 8226,
      lobbyServerIp: EXTERNAL_SERVER_HOST,
      lobbyServerPort: 8228,
      mcotsServerIp: EXTERNAL_SERVER_HOST,
      statusId: 0,
      statusReason: '',
      serverGroupName: 'default',
      population: 0,
      maxPersonasPerUser: 3,
      diagnosticServerHost: EXTERNAL_SERVER_HOST,
      diagnosticServerPort: 80
    }).catch((err) => {
      console.error('Failed to create initial shard record:', err instanceof Error ? err.message : err);
      process.exit(1);
    }).then(() => {
      console.log('Initial shard record created successfully.');
    });
  }
}

async function ensureUserRecord() {
  await userSequelize.sync();
  const count = await User.count();
  if (count === 0) {
    const passwordHash = await bcrypt.hash('admin', 10);
    await User.create({
      username: 'admin',
      passwordHash,
      customerId: '1'
    });
  }
}

export async function bootstrapInitialRecords() {
  await ensureShardRecord();
  await ensureUserRecord();
}

if (require.main === module) {
  bootstrapInitialRecords().then(() => {
    console.log('Bootstrap complete.');
  });
}
