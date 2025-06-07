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

import { parseTlsHandshakePayload } from './tls';
import { parseSsl3HandshakePayload } from './ssl3';
import { parseNPSMessage } from './nps';
import { detectProtocol } from './tcp';

export function logParsedPayload({ protocol, payload, tls, ssl3, nps }: { protocol: string; payload: Buffer; tls?: any; ssl3?: any, nps?: any }) {
    console.log('Detected Protocol:', protocol);
    console.log('Payload (hex):', payload.toString('hex'));
    console.log('Payload (ascii):', payload.toString('ascii'));
    if (protocol === 'TLS' && tls) {
        console.log('TLS Handshake Payload:', JSON.stringify(tls, null, 2));
    } else if (protocol === 'SSL3' && ssl3) {
        console.log('SSL3 Handshake Payload:', JSON.stringify(ssl3, null, 2));
    } else if (protocol === 'NPS' && nps) {
        console.log('NPS Message:', JSON.stringify(nps, null, 2));
    }
}

export function getParsedPayloadLogObject({ port, protocol, payload, tls, ssl3, nps }: { port: number; protocol: string; payload: Buffer; tls?: any; ssl3?: any, nps?: any }) {
    const logObj: any = { port, protocol, payloadHex: payload.toString('hex'), payloadAscii: payload.toString('ascii') };
    if (protocol === 'TLS' && tls) {
        logObj.tls = tls;
    } else if (protocol === 'SSL3' && ssl3) {
        logObj.ssl3 = ssl3;
    } else if (protocol === 'NPS' && nps) {
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

export function parsePayload(hex: string | Buffer): { protocol: string; payload: Buffer; tls?: ReturnType<typeof parseTlsHandshakePayload>; ssl3?: ReturnType<typeof parseSsl3HandshakePayload>, nps?: ReturnType<typeof parseNPSMessage> } {
    const buf = typeof hex === 'string' ? Buffer.from(hex, 'hex') : hex;
    let protocol = detectProtocol(buf);
    let tls, ssl3, nps;
    // SSL 3.0 handshake detection: contentType=0x16, versionMajor=3, versionMinor=0
    if (buf.length > 3 && buf[0] === 0x16 && buf[1] === 0x03 && buf[2] === 0x00) {
        protocol = 'SSL3';
        ssl3 = parseSsl3HandshakePayload(buf) || undefined;
    } else if (protocol === 'TLS') {
        tls = parseTlsHandshakePayload(buf) || undefined;
    } else if (protocol === 'NPS') {
        nps = parseNPSMessage(buf);
    }
    return { protocol, payload: buf, tls, ssl3, nps };
}