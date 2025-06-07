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

/// <reference types="node" />
import * as net from 'net';
import app from './express-app';
import { createLogger } from './logger';
import { getParsedPayloadLogObject, parsePayload } from './parsers';
import * as http from 'http';
import { bootstrapInitialRecords } from './bootstrap';

const logger = createLogger('server');
const clients: net.Socket[] = [];
const EXPRESS_PORT = 8080;

/**
 * Handles incoming data on a TCP socket, parses the protocol, and processes the message accordingly.
 *
 * - For non-HTTP protocols, logs the message and broadcasts it to all connected clients except the sender.
 * - For HTTP protocol, parses the HTTP request, forwards it to an Express server, and writes the full HTTP response back to the TCP client.
 *
 * @param data - The raw data buffer received from the socket.
 * @param port - The port number on which the data was received.
 * @param socket - The TCP socket instance representing the client connection.
 */
function handleSocketData(data: Buffer, port: number, socket: net.Socket) {
    const { protocol, payload, nps } = parsePayload(data);

    if (protocol === 'HTTP') {
        forwardHttpToExpress(data, socket);
        return;
    }

    // Log and broadcast non-HTTP messages
    logger.info(getParsedPayloadLogObject({ port, protocol, payload, nps }), 'Message received');
    broadcastToClients(payload, socket);
}

function forwardHttpToExpress(data: Buffer, socket: net.Socket) {
    const requestString = data.toString('utf8');
    const [requestLine, ...headerLines] = requestString.split(/\r?\n/);
    const [method, path] = requestLine.split(' ');
    const headerEndIndex = requestString.indexOf('\r\n\r\n');
    let headers: Record<string, string> = {};
    for (const line of headerLines) {
        if (!line.trim()) break;
        const [key, ...rest] = line.split(':');
        if (key && rest.length) headers[key.trim().toLowerCase()] = rest.join(':').trim();
    }
    let body: Buffer | undefined = undefined;
    if (headerEndIndex !== -1 && headerEndIndex + 4 < data.length) {
        body = data.subarray(headerEndIndex + 4);
    }
    const options = {
        hostname: '127.0.0.1',
        port: EXPRESS_PORT,
        path: path || '/',
        method: method || 'GET',
        headers,
    };
    const req = http.request(options, (res) => {
        let responseData: Buffer[] = [];
        res.on('data', (chunk) => responseData.push(chunk));
        res.on('end', () => {
            let responseHeaders = '';
            responseHeaders += `HTTP/${res.httpVersion} ${res.statusCode} ${res.statusMessage}\r\n`;
            for (const [key, value] of Object.entries(res.headers)) {
                if (Array.isArray(value)) {
                    for (const v of value) {
                        responseHeaders += `${key}: ${v}\r\n`;
                    }
                } else if (value !== undefined) {
                    responseHeaders += `${key}: ${value}\r\n`;
                }
            }
            responseHeaders += '\r\n';
            socket.write(responseHeaders);
            socket.write(Buffer.concat(responseData));
        });
    });
    req.on('error', (err) => {
        logger.error({ port: EXPRESS_PORT, err }, 'Express forward error');
        socket.end();
    });
    if (body) req.write(body);
    req.end();
}

function broadcastToClients(payload: Buffer, sender: net.Socket) {
    clients.forEach((client) => {
        if (client !== sender) {
            client.write(payload + '\n');
        }
    });
}

function createServer(port: number) {
    const server = net.createServer((socket: net.Socket) => {
        clients.push(socket);
        logger.info({ port, remoteAddress: socket.remoteAddress, remotePort: socket.remotePort }, 'Client connected');

        socket.on('data', (data: Buffer) => {
            try {
                handleSocketData(data, port, socket);
            } catch (err) {
                logger.error({ port, err }, 'Error handling socket data');
                socket.end();
            }
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

    server.listen(port, '0.0.0.0', () => {
        logger.info({ host: '0.0.0.0', port }, 'TCP server is running');
    });
    server.on('error', (err: Error) => {
        logger.error({ host: '0.0.0.0', port, err }, 'Failed to bind');
    });
}

// If run directly, bootstrap
if (require.main === module) {
    bootstrapInitialRecords().then(() => {
        console.log('Bootstrap complete.');
    });
}

[3000, 8226, 8228, 7003, 43300].forEach((port) => createServer(port));

app.listen(EXPRESS_PORT, () => {
    console.log(`Express server listening on port ${EXPRESS_PORT}`);
});