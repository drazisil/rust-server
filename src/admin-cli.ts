#!/usr/bin/env ts-node
import net from 'net';
import { HOST, PORTS } from './config';
import { getParsedPayloadLogObject, parsePayload, logParsedPayload } from './types';
import { addUser, checkCredentials, getCustomerIdByUsername } from './auth/checkCredentials';
import { Sequelize, DataTypes, Model } from 'sequelize';

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

async function pingAll() {
    console.log(`Pinging ports on ${HOST}: ${PORTS.join(', ')}`);
    for (const port of PORTS) {
        const isOpen = await pingPort(HOST, port);
        console.log(`Port ${port}: ${isOpen ? 'OPEN' : 'CLOSED'}`);
    }
}

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

const [,, cmd, ...args] = process.argv;

function printHelp() {
    console.log(`Usage: admin-cli.ts <command> [arguments...]

Commands:
  ping                                 Ping all configured ports
  parse <hexstring>                    Parse a hex-encoded payload
  adduser <username> <password> <customerId>  Add a new user
  checkuser <username> <password>      Check if credentials are valid
  listusers                            List all usernames
  getcustomerid <username>             Get the customerId for a username
  help                                 Show this help message
`);
}

if (cmd === 'help' || cmd === '--help' || cmd === '-h' || !cmd) {
    printHelp();
    process.exit(0);
} else if ((cmd === 'ping' && (args[0] === '-h' || args[0] === '--help')) ||
           (cmd === 'parse' && (!args[0] || args[0] === '-h' || args[0] === '--help')) ||
           (cmd === 'adduser' && (args[0] === '-h' || args[0] === '--help')) ||
           (cmd === 'checkuser' && (args[0] === '-h' || args[0] === '--help')) ||
           (cmd === 'listusers' && (args[0] === '-h' || args[0] === '--help')) ||
           (cmd === 'getcustomerid' && (args[0] === '-h' || args[0] === '--help'))) {
    // Per-command help
    switch (cmd) {
        case 'ping':
            console.log('Usage: admin-cli.ts ping\n  Ping all configured ports');
            break;
        case 'parse':
            console.log('Usage: admin-cli.ts parse <hexstring>\n  Parse a hex-encoded payload');
            break;
        case 'adduser':
            console.log('Usage: admin-cli.ts adduser <username> <password> <customerId>\n  Add a new user');
            break;
        case 'checkuser':
            console.log('Usage: admin-cli.ts checkuser <username> <password>\n  Check if credentials are valid');
            break;
        case 'listusers':
            console.log('Usage: admin-cli.ts listusers\n  List all usernames');
            break;
        case 'getcustomerid':
            console.log('Usage: admin-cli.ts getcustomerid <username>\n  Get the customerId for a username');
            break;
    }
    process.exit(0);
} else if (cmd === 'ping') {
    pingAll();
} else if (cmd === 'parse' && args[0]) {
    try {
        const { protocol, payload, tls, ssl3 } = parsePayload(args[0]);
        logParsedPayload({ protocol, payload, tls, ssl3 });
    } catch (e) {
        if (e instanceof Error) {
            console.error('Failed to parse payload:', e.message);
        } else {
            console.error('Failed to parse payload:', e);
        }
    }
} else if (cmd === 'adduser' && args[0] && args[1] && args[2]) {
    const username = args[0];
    const password = args[1];
    const customerId = args[2];
    addUser(username, password, customerId).then((success) => {
        if (success) {
            console.log(`User '${username}' added successfully.`);
        } else {
            console.error(`Failed to add user '${username}'. User may already exist or input is invalid.`);
        }
    });
} else if (cmd === 'checkuser' && args[0] && args[1]) {
    const username = args[0];
    const password = args[1];
    checkCredentials(username, password).then((valid) => {
        if (valid) {
            console.log(`Credentials for '${username}' are valid.`);
        } else {
            console.log(`Credentials for '${username}' are INVALID.`);
        }
    });
} else if (cmd === 'listusers') {
    (async () => {
        await sequelize.sync();
        const users = await User.findAll({ attributes: ['username'] });
        if (users.length === 0) {
            console.log('No users found.');
        } else {
            console.log('Users:');
            users.forEach((u: any) => console.log(' -', u.username));
        }
    })();
} else if (cmd === 'getcustomerid' && args[0]) {
    const username = args[0];
    (async () => {
        const customerId = await getCustomerIdByUsername(username, User);
        if (!customerId) {
            console.log(`User '${username}' not found.`);
        } else {
            console.log(`Customer ID for '${username}': ${customerId}`);
        }
    })();
} else {
    printHelp();
    process.exit(1);
}
