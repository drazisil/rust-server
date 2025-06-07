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

// src/types/nps/LoginRequestMessage.ts
// This file defines the NPS (Network Protocol Specification) Login Request message structure.

/**
 * 0501 // Login Request Message
 * 0121 // Length of the NPS record (from header)
 * 0101 // Message version (1.01)
 * 0000 // Reserved (0x0000)
 * 00000121 // Length of the NPS record (from header)
 * 0005 // Length of the username (5 bytes)
 * 61646d696e // Username: "admin" (5 bytes)
 * 0000 // Reserved (0x0000)
 * 0100 // Length of the session key (256 bytes)
 * 38373430313844413844354437313033
 * 42444536334336444437363939373043
 * 38394631383431334443433737443346
 * 41394332323142373045423332303933
 * 45384635323630443644463432353345
 * 38393231324243343643303735373234
 * 36344534304333383044393342353146
 * 36364443393230353543373531353431
 * 37383035314346353842353834353745
 * 33313533333934443936383144434644
 * 39384239443038353131353637413036
 * 42373832463643353743444531453334
 * 38383342424235424546463731314137
 * 43334345444246334141353441394136
 * 46363039453146313332413438324442
 * 39373835333543454346453233463134
 * 0004
 * 32313736
 * fea31c19
 */

export interface LoginRequestPayload {
    usernameLength: number; // Length of the username (2 bytes)
    username: string; // Username from the login request
    sessionKeyLength: number; // Length of the session key (2 bytes)
    sessionKey: string; // Session key (hex string)
}

export interface LoginRequestMessage {
    msgId: string; // Message ID (first 2 bytes of the header)
    msgLength: number; // Length of the NPS record (from header)
    body: LoginRequestPayload; // Parsed body of the message
}

export function parseLoginRequestMessage(buf: Buffer): LoginRequestMessage | null {
    if (buf.length < 4) return null;

    // NPS header: 4 bytes (2-byte ID, 2-byte length)
    const msgId = '0501'; // Login Request Message
    const msgLength = buf.readUInt16BE(2);
    if (buf.length < msgLength) return null; // Ensure buffer is long enough

    let offset = 4; // Start after the header
    function safeRead(fn: () => any, needed: number): any | null {
        if (offset + needed > buf.length) {
            console.warn(`LoginRequestMessage: Buffer too short for reading ${needed} bytes at offset ${offset}`);
            return null;
        }
        const val = fn();
        offset += needed;
        return val;
    }

    const version = safeRead(() => buf.readUInt16BE(offset), 2);
    if (version === null) return null;
    const reserved1 = safeRead(() => buf.readUInt16BE(offset), 2);
    if (reserved1 === null) return null;
    const checksum = safeRead(() => buf.readUInt32BE(offset), 4);
    if (checksum === null) return null;
    const usernameLength = safeRead(() => buf.readUInt16BE(offset), 2);
    if (usernameLength === null) return null;
    if (offset + usernameLength > buf.length) return null;
    const username = buf.toString('utf8', offset, offset + usernameLength);
    offset += usernameLength;
    const reserved2 = safeRead(() => buf.readUInt16BE(offset), 2);
    if (reserved2 === null) return null;
    const sessionKeyLength = safeRead(() => buf.readUInt16BE(offset), 2);
    if (sessionKeyLength === null) return null;
    if (offset + sessionKeyLength > buf.length) return null;
    const sessionKey = buf.toString('hex', offset, offset + sessionKeyLength);
    offset += sessionKeyLength;
    const gameIdLength = safeRead(() => buf.readUInt16BE(offset), 2);
    if (gameIdLength === null) return null;
    if (offset + gameIdLength > buf.length) return null;
    const gameId = buf.toString('utf8', offset, offset + gameIdLength);
    offset += gameIdLength;
    const reserved3 = safeRead(() => buf.readUInt32BE(offset), 4);
    if (reserved3 === null) return null;
    // After parsing, offset should be equal to buf.length (not msgLength)
    if (offset !== buf.length) {
        console.warn(`LoginRequestMessage: Parsed length ${offset} does not match buffer length ${buf.length}`);
        return null;
    }

    return {
        msgId,
        msgLength,
        body: {
            usernameLength,
            username,
            sessionKeyLength,
            sessionKey,
        },
    };
}