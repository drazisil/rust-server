/// <reference types="node" />
import * as net from 'net';
import express from 'express';
import { HOST, PORTS } from './config';
import { logger } from './logger';
import { getParsedPayloadLogObject, parsePayload } from './types';

const clients: net.Socket[] = [];
const app = express();
app.use(express.json());

// Example route for demonstration
app.all('*', (req, res) => {
    res.status(200).send('Request forwarded to Express server.');
});

const EXPRESS_PORT = 8080;
app.listen(EXPRESS_PORT, () => {
    console.log(`Express server listening on port ${EXPRESS_PORT}`);
});

function createServer(port: number) {
    const server = net.createServer((socket: net.Socket) => {
        clients.push(socket);
        logger.info({ port, remoteAddress: socket.remoteAddress, remotePort: socket.remotePort }, 'Client connected');

        socket.on('data', (data: Buffer) => {
            const { protocol, payload, tls, ssl3 } = parsePayload(data);
            logger.info(getParsedPayloadLogObject({ port, protocol, payload, tls, ssl3 }), 'Message received');
            // Forward HTTP requests to Express
            if (protocol === 'HTTP') {
                // Forward the raw HTTP request to Express
                // Create a fake socket and pipe the data
                const client = net.createConnection({ port: EXPRESS_PORT }, () => {
                    client.write(data);
                });
                socket.pipe(client).pipe(socket);
                client.on('error', (err) => {
                    logger.error({ port, err }, 'Express forward error');
                    socket.end();
                });
                return;
            }
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