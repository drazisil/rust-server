/// <reference types="node" />
import * as net from 'net';
import { HOST, PORTS } from './config';

const clients: net.Socket[] = [];

function createServer(port: number) {
    const server = net.createServer((socket: net.Socket) => {
        clients.push(socket);
        console.log(`A client connected on port ${port}:`, socket.remoteAddress, socket.remotePort);

        socket.on('data', (data: Buffer) => {
            const msg = data.toString().trim();
            console.log('Message received:', msg);
            // Broadcast the message to all clients
            clients.forEach((client) => {
                if (client !== socket) {
                    client.write(msg + '\n');
                }
            });
        });

        socket.on('end', () => {
            console.log('Client disconnected:', socket.remoteAddress, socket.remotePort);
            // Remove the client from the list
            const idx = clients.indexOf(socket);
            if (idx !== -1) clients.splice(idx, 1);
        });

        socket.on('error', (err: Error) => {
            console.error('Socket error:', err);
        });
    });

    server.listen(port, HOST, () => {
        console.log(`TCP server is running on ${HOST}:${port}`);
    });
    server.on('error', (err: Error) => {
        console.error(`Failed to bind to ${HOST}:${port} -`, err.message);
    });
}

PORTS.forEach((port) => createServer(port));