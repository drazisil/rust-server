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

import { createServer, Socket } from 'node:net';
import app from './express-app';
import { createLogger } from './logger';
import { getParsedPayloadLogObject, parsePayload } from './parsers';
import { request } from 'node:http';
import { bootstrapInitialRecords } from './bootstrap';
import { NPSMessage } from './parsers/nps';
import { handleNpsMessage } from './nps-handler';

const logger = createLogger('server');
const clients: Map<string, Socket> = new Map();
const EXPRESS_PORT = 8080;

/**
 * Data Transfer Object for NPS messages received over TCP sockets.
 * This interface represents the structure of a message received from a client socket,
 * including the unique identifier for the socket, the raw payload buffer, and an optional parsed NPS message.
 */
export interface NPSMessageDTO {
    /** Unique identifier for the client socket (address:port) */
    id: string;
    /** Any error that occurred during processing, if applicable */
    error?: Error;
    /** The parsed payload buffer (may be same as data) */
    payload?: Buffer;
    /** Optional: parsed NPS message, if applicable */
    nps?: NPSMessage;
}

/**
 * Handles incoming data on a TCP socket, parses the protocol, and processes the message accordingly.
 *
 * - For non-HTTP protocols, logs the message and broadcasts it to all connected clients except the sender.
 * - For HTTP protocol, parses the HTTP request, forwards it to an Express server, and writes the full HTTP response back to the TCP client.
 *
 * @param id - A unique identifier for the socket connection, typically the remote address and port.
 * @param data - The raw data buffer received from the socket.
 * @param port - The port number on which the data was received.
 * @param socket - The TCP socket instance representing the client connection.
 */
function handleSocketData(id: string, data: Buffer, port: number, socket: Socket) {
    const { protocol, payload, nps } = parsePayload(data);

    if (protocol === 'HTTP') {
        forwardHttpToExpress(data, socket);
        return;
    }

    // Log and broadcast non-HTTP messages
    logger.info(getParsedPayloadLogObject({ port, protocol, payload, nps }), 'Message received');

    // Create a DTO for the NPS message
    const dto: NPSMessageDTO = {
        id,
        payload,
        nps: nps ? nps : undefined
    };

    logger.info({ port, id, nps: dto.nps }, 'Parsed NPS message');

    // Handle NPS messages
    const responseDto = handleNpsMessage(dto);

    // Handle any responses
    if (typeof responseDto === 'object' && responseDto.payload) {
        // If a response is needed, write it back to the socket
        logger.info({ port, id }, 'Sending response for NPS message');
        // Ensure the payload is a Buffer
        if (!(responseDto.payload instanceof Buffer)) {
            logger.warn({ port, id }, 'Response payload is not a Buffer, converting to Buffer');
            responseDto.payload = Buffer.from(responseDto.payload);
        }
        const responseBuffer = Buffer.from(responseDto.payload);
        socket.write(responseBuffer);
    } else {
        // Che for any errors in the response DTO
        if (responseDto && responseDto.error) {
            logger.error({ port, id, error: responseDto.error }, 'Error processing NPS message');
            return;
        }

        // If no response is needed, just log the received message
        logger.info({ port, id }, 'No response for NPS message');
    }
}

/**
 * Forwards a raw HTTP request received over a socket to an Express server,
 * acting as a simple HTTP proxy. Parses the incoming HTTP request from the socket,
 * reconstructs the request, and sends it to the Express server running on the specified port.
 * The response from the Express server is then written back to the original socket.
 *
 * @param data - The raw HTTP request data received from the client socket.
 * @param socket - The socket through which the original HTTP request was received and to which the response will be sent.
 *
 * @remarks
 * - Assumes the Express server is running locally on `127.0.0.1` and listening on `EXPRESS_PORT`.
 * - Handles both request headers and body.
 * - Forwards the response headers and body from the Express server back to the client.
 * - Logs errors and closes the socket on failure.
 */
function forwardHttpToExpress(data: Buffer, socket: Socket) {
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
    const req = request(options, (res) => {
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

/**
 * Initializes a TCP server that listens on the specified port and manages client connections.
 *
 * @param port - The port number on which the TCP server will listen.
 *
 * The server handles the following events for each client socket:
 * - 'data': Processes incoming data using `handleSocketData`. If an error occurs, logs the error and closes the socket.
 * - 'end': Logs client disconnection and removes the client from the active clients list.
 * - 'error': Logs socket errors.
 *
 * The server itself also listens for:
 * - 'error': Logs errors that occur while binding the server to the port.
 *
 * All connections and events are logged using the `logger` instance.
 */
function initializeTcpServers(port: number) {
    const server = createServer((socket: Socket) => {
        // Generate a unique identifier for the client
        const socketId = `${socket.remoteAddress}:${socket.remotePort}`;

        clients.set(socketId, socket);
        logger.info({ port, remoteAddress: socket.remoteAddress, remotePort: socket.remotePort }, 'Client connected');

        socket.on('data', (data: Buffer) => {
            try {
                handleSocketData(socketId, data, port, socket);
            } catch (err) {
                logger.error({ port, err }, 'Error handling socket data');
                socket.end();
            }
        });

        socket.on('end', () => {
            logger.info({ port, remoteAddress: socket.remoteAddress, remotePort: socket.remotePort }, 'Client disconnected');
            clients.delete(socketId);
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

[3000, 8226, 8228, 7003, 43300].forEach((port) => initializeTcpServers(port));

app.listen(EXPRESS_PORT, () => {
    console.log(`Express server listening on port ${EXPRESS_PORT}`);
});