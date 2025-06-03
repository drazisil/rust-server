/// <reference types="node" />
import * as net from 'net';
import { HOST, PORTS } from './config';
import { logger } from './logger';

const clients: net.Socket[] = [];

function createServer(port: number) {
    const server = net.createServer((socket: net.Socket) => {
        clients.push(socket);
        logger.info({ port, remoteAddress: socket.remoteAddress, remotePort: socket.remotePort }, 'Client connected');

        socket.on('data', (data: Buffer) => {
            const msg = data.toString().trim();
            // Detect protocol using the parser
            let protocol: string | undefined = undefined;
            try {
                const { protocol: detectedProtocol } = require('./types/tcp').parseTcpHeader(data.toString('hex'));
                protocol = detectedProtocol;
            } catch {
                protocol = undefined;
            }
            logger.info({ port, msg, protocol }, 'Message received');
            // Log raw packet data for port 443
            if (port === 443) {
                logger.info({ port, raw: data.toString('hex'), protocol }, 'Raw packet received on port 443');
            }
            // Broadcast the message to all clients
            clients.forEach((client) => {
                if (client !== socket) {
                    client.write(msg + '\n');
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