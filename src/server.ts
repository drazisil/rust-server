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
import { getParsedPayloadLogObject, parsePayload } from './types';
import * as http from 'http';
import { bootstrapInitialRecords } from './bootstrap';

const logger = createLogger('server');
const clients: net.Socket[] = [];
const EXPRESS_PORT = 8080;

function createServer(port: number) {
    const server = net.createServer((socket: net.Socket) => {
        clients.push(socket);
        logger.info({ port, remoteAddress: socket.remoteAddress, remotePort: socket.remotePort }, 'Client connected');

        socket.on('data', (data: Buffer) => {
            const { protocol, payload, tls, ssl3 } = parsePayload(data);
            // Only log non-HTTP requests before forwarding
            if (protocol !== 'HTTP') {
                logger.info(getParsedPayloadLogObject({ port, protocol, payload, tls, ssl3 }), 'Message received');
            }
            // Forward HTTP requests to Express
            if (protocol === 'HTTP') {
                // Parse the HTTP request line to get method, path, and headers
                const requestString = data.toString('utf8');
                const [requestLine, ...headerLines] = requestString.split(/\r?\n/);
                const [method, path] = requestLine.split(' ');
                // Find the end of headers (empty line)
                const headerEndIndex = requestString.indexOf('\r\n\r\n');
                let headers: Record<string, string> = {};
                for (const line of headerLines) {
                    if (!line.trim()) break;
                    const [key, ...rest] = line.split(':');
                    if (key && rest.length) headers[key.trim().toLowerCase()] = rest.join(':').trim();
                }
                // Extract body if present
                let body: Buffer | undefined = undefined;
                if (headerEndIndex !== -1 && headerEndIndex + 4 < data.length) {
                    body = data.slice(headerEndIndex + 4);
                }
                // Forward to Express using http.request
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
                        // Write the full HTTP response (status line, headers, body) back to the TCP client
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
                    logger.error({ port, err }, 'Express forward error');
                    socket.end();
                });
                if (body) req.write(body);
                req.end();
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