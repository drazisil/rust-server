/// <reference types="node" />
import * as net from 'net';
import { HOST, PORTS } from './config';
import { logger } from './logger';
import { parsePayload } from './types/tcp';
import { getParsedPayloadLogObject } from './types';

const clients: net.Socket[] = [];

function createServer(port: number) {
    const server = net.createServer((socket: net.Socket) => {
        clients.push(socket);
        logger.info({ port, remoteAddress: socket.remoteAddress, remotePort: socket.remotePort }, 'Client connected');

        socket.on('data', (data: Buffer) => {
            const { protocol, payload } = parsePayload(data);
            logger.info(getParsedPayloadLogObject({ port, protocol, payload }), 'Message received');
            // Broadcast the message to all clients
            clients.forEach((client) => {
                if (client !== socket) {
                    client.write(payload + '\n');
                }
            });
        });

        socket.on('end', () => {
            logger.info({ port, remoteAddress: socket.remoteAddress, remotePort: socket.remotePort }, 'Client disconnected');
            // Remove the client from the list
            const idx = clients.indexOf(socket);
            if (idx !== -1) clients.splice(idx, 1);
        });

        socket.on('error', (err: Error) => {
            logger.error({ port, err }, 'Socket error');
        });
    });

    server.listen(port, HOST, () => {
        logger.info({ host: HOST, port }, 'TCP server is running');
    });
    server.on('error', (err: Error) => {
        logger.error({ host: HOST, port, err }, 'Failed to bind');
    });
}

PORTS.forEach((port) => createServer(port));