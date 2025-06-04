#!/usr/bin/env ts-node
import { Command } from 'commander';
import net from 'net';
import { HOST, PORTS } from './config';
import { getParsedPayloadLogObject, parsePayload, logParsedPayload } from './types';
import { addUser, checkCredentials, getCustomerIdByUsername } from './auth/checkCredentials';
import { Sequelize, DataTypes, Model } from 'sequelize';

const program = new Command();
program
  .name('admin-cli.ts')
  .description('Admin CLI for my-socket-server')
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
