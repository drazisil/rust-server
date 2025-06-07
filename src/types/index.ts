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

import { parseNPSMessage } from './nps';
import { detectProtocol } from './tcp';

export function logParsedPayload({ protocol, payload, nps }: { protocol: string; payload: Buffer; nps?: any }) {
    console.log('Detected Protocol:', protocol);
    console.log('Payload (hex):', payload.toString('hex'));
    console.log('Payload (ascii):', payload.toString('ascii'));
    if (protocol === 'NPS' && nps) {
        console.log('NPS Message:', JSON.stringify(nps, null, 2));
    }
}

export function getParsedPayloadLogObject({ port, protocol, payload, nps }: { port: number; protocol: string; payload: Buffer; nps?: any }) {
    const logObj: any = { port, protocol, payloadHex: payload.toString('hex'), payloadAscii: payload.toString('ascii') };
    if (protocol === 'NPS' && nps) {
        logObj.nps = nps;
    }
    return logObj;
}

export interface Message {
    id: string;
    content: string;
    senderId: string;
    timestamp: Date;
}

export interface User {
    id: string;
    username: string;
    socketId: string;
}

/**
 * Parses a hexadecimal string or Buffer payload and detects its protocol type.
 * Depending on the detected protocol (NPS), it further parses the payload
 * using the appropriate parser and returns the parsed result.
 *
 * @param hex - The payload to parse, provided as a hexadecimal string or Buffer.
 * @returns An object containing:
 * - `protocol`: The detected protocol as a string.
 * - `payload`: The original payload as a Buffer.
 * - `nps`: The parsed NPS message, if applicable.
 */
export function parsePayload(hex: string | Buffer): { protocol: string; payload: Buffer; nps?: ReturnType<typeof parseNPSMessage> } {
    const buf = typeof hex === 'string' ? Buffer.from(hex, 'hex') : hex;
    let protocol = detectProtocol(buf);
    let nps;
    if (protocol === 'NPS') {
        nps = parseNPSMessage(buf);
    }
    return { protocol, payload: buf, nps };
}