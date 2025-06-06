#!/usr/bin/env ts-node
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

import { Command } from 'commander';
import net from 'net';
import { HOST, PORTS } from './config';
import { getParsedPayloadLogObject, parsePayload, logParsedPayload } from './types';
import { addUser, checkCredentials, getCustomerIdByUsername } from './auth/checkCredentials';
import { Sequelize, DataTypes, Model } from 'sequelize';
import inquirer from 'inquirer';
import { defineShardModel } from './shardModel';
import { addShard } from './shards';


const program = new Command();
program
  .name('admin-cli.ts')
  .description('Admin CLI for oxide')
  .version('1.0.0');

function pingPort(host: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1000);
        socket.once('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.once('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.once('error', () => {
            socket.destroy();
            resolve(false);
        });
        socket.connect(port, host);
    });
}

program
  .command('ping')
  .description('Ping all configured ports')
  .action(async () => {
    console.log(`Pinging ports on ${HOST}: ${PORTS.join(', ')}`);
    for (const port of PORTS) {
      const isOpen = await pingPort(HOST, port);
      console.log(`Port ${port}: ${isOpen ? 'OPEN' : 'CLOSED'}`);
    }
  });

program
  .command('parse <hexstring>')
  .description('Parse a hex-encoded payload')
  .action((hexstring) => {
    try {
      const { protocol, payload, tls, ssl3 } = parsePayload(hexstring);
      logParsedPayload({ protocol, payload, tls, ssl3 });
    } catch (e) {
      if (e instanceof Error) {
        console.error('Failed to parse payload:', e.message);
      } else {
        console.error('Failed to parse payload:', e);
      }
      process.exit(1);
    }
  });

// Re-create the User model for CLI access
const sequelize = new Sequelize('sqlite:' + __dirname + '/auth/users.sqlite', { logging: false });
class User extends Model {
    declare username: string;
    declare passwordHash: string;
    declare customerId: string;
}
User.init(
    {
        username: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
        },
        passwordHash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        customerId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: false,
    }
);

program
  .command('adduser <username> <password> <customerId>')
  .description('Add a new user')
  .action(async (username, password, customerId) => {
    const success = await addUser(username, password, customerId, User);
    if (success) {
      console.log(`User '${username}' added successfully.`);
    } else {
      console.error(`Failed to add user '${username}'. User may already exist or input is invalid.`);
      process.exit(1);
    }
  });

program
  .command('checkuser <username> <password>')
  .description('Check if credentials are valid')
  .action(async (username, password) => {
    const valid = await checkCredentials(username, password, User);
    if (valid) {
      console.log(`Credentials for '${username}' are valid.`);
    } else {
      console.log(`Credentials for '${username}' are INVALID.`);
      process.exit(1);
    }
  });

program
  .command('listusers')
  .description('List all usernames')
  .action(async () => {
    await sequelize.sync();
    const users = await User.findAll({ attributes: ['username'] });
    if (users.length === 0) {
      console.log('No users found.');
    } else {
      console.log('Users:');
      users.forEach((u: any) => console.log(' -', u.username));
    }
  });

program
  .command('getcustomerid <username>')
  .description('Get the customerId for a username')
  .action(async (username) => {
    const customerId = await getCustomerIdByUsername(username, User);
    if (!customerId) {
      console.log(`User '${username}' not found.`);
      process.exit(1);
    } else {
      console.log(`Customer ID for '${username}': ${customerId}`);
    }
  });

// Use the same DB file as the main app for shards
const shardSequelize = new Sequelize('sqlite:' + __dirname + '/users.sqlite', { logging: false });
const Shard = defineShardModel(shardSequelize);

program
  .command('addshard')
  .description('Add a new shard (interactive)')
  .action(async () => {
    await shardSequelize.sync();
    const answers = await inquirer.prompt([
      { name: 'name', message: 'Shard name:', type: 'input', validate: (v: any) => !!v },
      { name: 'description', message: 'Description:', type: 'input', default: '' },
      { name: 'loginServerIp', message: 'Login server IP:', type: 'input', validate: (v: any) => !!v },
      { name: 'loginServerPort', message: 'Login server port:', type: 'number', validate: (v: any) => typeof v === 'number' && v > 0 },
      { name: 'lobbyServerIp', message: 'Lobby server IP:', type: 'input', validate: (v: any) => !!v },
      { name: 'lobbyServerPort', message: 'Lobby server port:', type: 'number', validate: (v: any) => typeof v === 'number' && v > 0 },
      { name: 'mcotsServerIp', message: 'MCOTS server IP:', type: 'input', validate: (v: any) => !!v },
      { name: 'statusId', message: 'Status ID:', type: 'number', default: 1 },
      { name: 'statusReason', message: 'Status reason:', type: 'input', default: 'Online' },
      { name: 'serverGroupName', message: 'Server group name:', type: 'input', default: '' },
      { name: 'population', message: 'Population:', type: 'number', default: 1 },
      { name: 'maxPersonasPerUser', message: 'Max personas per user:', type: 'number', default: 1 },
      { name: 'diagnosticServerHost', message: 'Diagnostic server host:', type: 'input', default: '' },
      { name: 'diagnosticServerPort', message: 'Diagnostic server port:', type: 'number', default: 0 },
    ]);
    const shardData = {
      name: answers.name,
      description: answers.description,
      loginServerIp: answers.loginServerIp,
      loginServerPort: 8228, // Default port for login server
      lobbyServerIp: answers.lobbyServerIp,
      lobbyServerPort: 7003, // Default port for lobby server
      mcotsServerIp: answers.mcotsServerIp,
      statusId: Number(answers.statusId),
      statusReason: answers.statusReason,
      serverGroupName: answers.serverGroupName,
      population: Number(answers.population),
      maxPersonasPerUser: Number(answers.maxPersonasPerUser),
      diagnosticServerHost: answers.diagnosticServerHost,
      diagnosticServerPort: 80, // Default port for diagnostic server
    };
    try {
      await Shard.create(shardData as any);
      console.log('Shard added successfully.');
    } catch (e) {
      console.error('Failed to add shard:', e instanceof Error ? e.message : e);
      process.exit(1);
    }
  });

program
  .exitOverride((err) => {
    if (err.code === 'commander.unknownCommand') {
      // Print error message for unknown command (commander style)
      const input = process.argv[2];
      if (input) {
        console.error(`error: unknown command '${input}'`);
      }
      program.outputHelp();
      process.exit(1);
    }
    throw err;
  });

program.parseAsync(process.argv);
