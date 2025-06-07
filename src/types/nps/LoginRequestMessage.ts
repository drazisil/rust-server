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

    // Helper functions
    function safeReadUInt16(): number | null {
        if (offset + 2 > buf.length) {
            console.warn(`LoginRequestMessage: Buffer too short for reading 2 bytes at offset ${offset}`);
            return null;
        }
        const val = buf.readUInt16BE(offset);
        offset += 2;
        return val;
    }
    function safeReadUInt32(): number | null {
        if (offset + 4 > buf.length) {
            console.warn(`LoginRequestMessage: Buffer too short for reading 4 bytes at offset ${offset}`);
            return null;
        }
        const val = buf.readUInt32BE(offset);
        offset += 4;
        return val;
    }
    function safeReadString(len: number, encoding: BufferEncoding = 'utf8'): string | null {
        if (offset + len > buf.length) return null;
        const val = buf.toString(encoding, offset, offset + len);
        offset += len;
        return val;
    }
    function safeReadHex(len: number): string | null {
        if (offset + len > buf.length) return null;
        const val = buf.toString('hex', offset, offset + len);
        offset += len;
        return val;
    }

    // Field schema for extensibility
    const schema = [
        { name: 'version', type: 'u16' },
        { name: 'reserved1', type: 'u16' },
        { name: 'checksum', type: 'u32' },
        { name: 'usernameLength', type: 'u16' },
        { name: 'username', type: 'string', lengthFrom: 'usernameLength' },
        { name: 'reserved2', type: 'u16' },
        { name: 'sessionKeyLength', type: 'u16' },
        { name: 'sessionKey', type: 'hex', lengthFrom: 'sessionKeyLength' },
        { name: 'gameIdLength', type: 'u16' },
        { name: 'gameId', type: 'string', lengthFrom: 'gameIdLength' },
        { name: 'reserved3', type: 'u32' },
    ] as const;

    // Parse according to schema
    const parsed: Record<string, any> = {};
    for (const field of schema) {
        let value: any = null;
        switch (field.type) {
            case 'u16':
                value = safeReadUInt16();
                break;
            case 'u32':
                value = safeReadUInt32();
                break;
            case 'string': {
                if (!('lengthFrom' in field)) return null;
                const len = parsed[field.lengthFrom];
                if (typeof len !== 'number') return null;
                value = safeReadString(len);
                break;
            }
            case 'hex': {
                if (!('lengthFrom' in field)) return null;
                const len = parsed[field.lengthFrom];
                if (typeof len !== 'number') return null;
                value = safeReadHex(len);
                break;
            }
            default:
                return null;
        }
        if (value === null) return null;
        parsed[field.name] = value;
    }

    // After parsing, offset should be equal to buf.length (not msgLength)
    if (offset !== buf.length) {
        console.warn(`LoginRequestMessage: Parsed length ${offset} does not match buffer length ${buf.length}`);
        return null;
    }

    return {
        msgId,
        msgLength,
        body: {
            usernameLength: parsed.usernameLength,
            username: parsed.username,
            sessionKeyLength: parsed.sessionKeyLength,
            sessionKey: parsed.sessionKey,
        },
    };
}