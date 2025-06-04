// SPDX-License-Identifier: GPL-3.0-or-later
// Shard database model using Sequelize
import { Sequelize } from 'sequelize';
import { defineShardModel } from './shardModel';

// Default: use DB URL from env or fallback to file
const DB_URL = process.env.AUTH_DB_URL || ('sqlite:' + __dirname + '/users.sqlite');
export const sequelize = new Sequelize(DB_URL, { logging: false });
export const Shard = defineShardModel(sequelize);

async function ensureDbReady() {
    await sequelize.sync();
}

export type ShardType = typeof Shard.prototype;

export async function getAllShards(): Promise<ShardType[]> {
    await ensureDbReady();
    return Shard.findAll();
}

export async function getShardById(id: number): Promise<ShardType | null> {
    await ensureDbReady();
    return Shard.findByPk(id);
}

export async function addShard(shard: Omit<ShardType, 'id'>): Promise<ShardType> {
    await ensureDbReady();
    return Shard.create(shard as any);
}

export async function updateShard(shard: ShardType): Promise<void> {
    await ensureDbReady();
    await Shard.update(shard as any, { where: { id: shard.id } });
}

export async function deleteShard(id: number): Promise<void> {
    await ensureDbReady();
    await Shard.destroy({ where: { id } });
}
