// SPDX-License-Identifier: GPL-3.0-or-later
// ShardList route module
import { Router } from 'express';

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
shardListRouter.get('/ShardList/', (req, res) => {
    // Example static shard list using ShardEntry structure
    const shards: ShardEntry[] = [
        {
            id: 1,
            name: 'Shard Alpha',
            description: 'The first shard',
            loginServerIp: '192.168.1.10',
            loginServerPort: 2106,
            lobbyServerIp: '192.168.1.11',
            lobbyServerPort: 2206,
            mcotsServerIp: '192.168.1.12',
            statusId: 1,
            statusReason: 'Online',
            serverGroupName: 'GroupA',
            population: 123,
            maxPersonasPerUser: 3,
            diagnosticServerHost: '192.168.1.13',
            diagnosticServerPort: 2306
        },
        {
            id: 2,
            name: 'Shard Beta',
            description: 'The second shard',
            loginServerIp: '192.168.2.10',
            loginServerPort: 2107,
            lobbyServerIp: '192.168.2.11',
            lobbyServerPort: 2207,
            mcotsServerIp: '192.168.2.12',
            statusId: 0,
            statusReason: 'Offline',
            serverGroupName: 'GroupB',
            population: 0,
            maxPersonasPerUser: 2,
            diagnosticServerHost: '192.168.2.13',
            diagnosticServerPort: 2307
        }
    ];
    // Format each shard using the helper
    const shardListString = shards.map(formatShardEntry).join('\n\n');
    res.status(200).type('text').send(shardListString);
});

export default shardListRouter;
