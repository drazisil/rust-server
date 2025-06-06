// SPDX-License-Identifier: GPL-3.0-or-later
// Shard database model using Sequelize
import { Sequelize } from 'sequelize';
import { defineShardModel } from './shardModel';

// Default: use DB URL from env or fallback to file
const DB_URL = process.env.AUTH_DB_URL || ('sqlite:' + __dirname + '/shards.sqlite');
export const sequelize = new Sequelize(DB_URL, { logging: false });
export const Shard = defineShardModel(sequelize);

async function ensureDbReady() {
    await sequelize.sync();
}

// Export a type for the Shard model class
export type ShardModelType = ReturnType<typeof defineShardModel>;
export type ShardType = InstanceType<ReturnType<typeof defineShardModel>>;

export async function getAllShards(ShardModel: ShardModelType = Shard): Promise<ShardType[]> {
    await ensureDbReady();
    return ShardModel.findAll();
}

export async function getShardById(id: number, ShardModel: ShardModelType = Shard): Promise<ShardType | null> {
    await ensureDbReady();
    return ShardModel.findByPk(id);
}

export async function addShard(shard: Omit<ShardType, 'id'>, ShardModel: ShardModelType = Shard): Promise<ShardType> {
    await ensureDbReady();
    return ShardModel.create(shard as any);
}

export async function updateShard(shard: ShardType, ShardModel: ShardModelType = Shard): Promise<void> {
    await ensureDbReady();
    await ShardModel.update(shard as any, { where: { id: shard.id } });
}

export async function deleteShard(id: number, ShardModel: ShardModelType = Shard): Promise<void> {
    await ensureDbReady();
    await ShardModel.destroy({ where: { id } });
}
