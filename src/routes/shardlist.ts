// SPDX-License-Identifier: GPL-3.0-or-later
// ShardList route module
import { Router } from 'express';
import { getAllShards } from '../shards';

const shardListRouter = Router();

// Data structure for a shard entry
export interface ShardEntry {
    id: number;
    name: string;
    description: string;
    loginServerIp: string;
    loginServerPort: number;
    lobbyServerIp: string;
    lobbyServerPort: number;
    mcotsServerIp: string;
    statusId: number;
    statusReason: string;
    serverGroupName: string;
    population: number;
    maxPersonasPerUser: number;
    diagnosticServerHost: string;
    diagnosticServerPort: number;
}

// Helper to format a shard entry as the required string
export function formatShardEntry(shard: ShardEntry): string {
    return `[${shard.name}]\n` +
        `      Description=${shard.description}\n` +
        `      ShardId=${shard.id}\n` +
        `      LoginServerIP=${shard.loginServerIp}\n` +
        `      LoginServerPort=${shard.loginServerPort}\n` +
        `      LobbyServerIP=${shard.lobbyServerIp}\n` +
        `      LobbyServerPort=${shard.lobbyServerPort}\n` +
        `      MCOTSServerIP=${shard.mcotsServerIp}\n` +
        `      StatusId=${shard.statusId}\n` +
        `      Status_Reason=${shard.statusReason}\n` +
        `      ServerGroup_Name=${shard.serverGroupName}\n` +
        `      Population=${shard.population}\n` +
        `      MaxPersonasPerUser=${shard.maxPersonasPerUser}\n` +
        `      DiagnosticServerHost=${shard.diagnosticServerHost}\n` +
        `      DiagnosticServerPort=${shard.diagnosticServerPort}`;
}

// ShardList route: returns a static list of shards
shardListRouter.get('/ShardList/', async (req, res) => {
    try {
        const shards = await getAllShards();
        // Convert Sequelize model instances to plain objects if needed
        const shardEntries = shards.map(s => s.toJSON ? s.toJSON() : s);
        const shardListString = shardEntries.map(formatShardEntry).join('\n\n');
        res.status(200).type('text').send(shardListString);
    } catch (err) {
        res.status(500).type('text').send('Failed to fetch shard list');
    }
});

export default shardListRouter;
