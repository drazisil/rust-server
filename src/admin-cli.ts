#!/usr/bin/env ts-node
import net from 'net';
import { HOST, PORTS } from './config';
import { parsePayload } from './types/tcp';
import { parseTlsHandshakePayload } from './types/tls';

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

const [,, cmd, ...args] = process.argv;

if (cmd === 'ping') {
    pingAll();
} else if (cmd === 'parse' && args[0]) {
    try {
        const { protocol, payload } = parsePayload(args[0]);
        console.log('Detected Protocol:', protocol);
        console.log('Payload (hex):', payload.toString('hex'));
        console.log('Payload (ascii):', payload.toString('ascii'));
        if (protocol === 'TLS') {
            const tls = parseTlsHandshakePayload(payload);
            if (tls) {
                console.log('TLS Handshake Payload:', JSON.stringify(tls, null, 2));
            } else {
                console.log('Could not parse TLS handshake payload.');
            }
        }
    } catch (e) {
        if (e instanceof Error) {
            console.error('Failed to parse payload:', e.message);
        } else {
            console.error('Failed to parse payload:', e);
        }
    }
} else {
    console.log('Usage: admin-cli.ts ping | parse <hexstring>');
}
