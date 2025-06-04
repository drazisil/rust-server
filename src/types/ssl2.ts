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

// src/types/ssl2.ts
// SSL 2.0 Handshake structures and parser (see: https://www-archive.mozilla.org/projects/security/pki/nss/ssl/draft02.html)

export interface Ssl2HandshakePayload {
    recordLength: number; // Length of the SSL2 record (from header)
    msgType?: number;     // Handshake message type (if present)
    msgTypeName?: string; // Human-readable handshake type
    versionMajor?: number;
    versionMinor?: number;
    version?: string;
    body?: Buffer;        // The handshake message body
}

const SSL2_HANDSHAKE_TYPE_MAP: Record<number, string> = {
    1: 'ClientHello',
    2: 'ClientMasterKey',
    3: 'ClientFinished',
    4: 'ServerHello',
    5: 'ServerVerify',
    6: 'ServerFinished',
    7: 'RequestCertificate',
    8: 'ClientCertificate',
};

export function parseSsl2HandshakePayload(buf: Buffer): Ssl2HandshakePayload | null {
    if (buf.length < 3) return null;
    // SSL2 header: 2 or 3 bytes. If MSB of first byte is set, 2-byte header (no padding), else 3-byte header (with padding)
    let headerLength = 2;
    let recordLength = 0;
    if ((buf[0] & 0x80) === 0x80) {
        // 2-byte header, MSB set
        recordLength = ((buf[0] & 0x7f) << 8) | buf[1];
    } else {
        // 3-byte header, MSB not set
        headerLength = 3;
        recordLength = ((buf[0] & 0x3f) << 8) | buf[1];
        // buf[2] is padding length (not used here)
    }
    if (buf.length < headerLength + 1) return { recordLength };
    const msgType = buf[headerLength];
    const msgTypeName = SSL2_HANDSHAKE_TYPE_MAP[msgType] || 'Other';
    let versionMajor, versionMinor, version;
    // For ClientHello and ServerHello, version is present at a fixed offset
    if ((msgType === 1 || msgType === 4) && buf.length >= headerLength + 3) {
        versionMajor = buf[headerLength + 1];
        versionMinor = buf[headerLength + 2];
        if (versionMajor === 2 && versionMinor === 0) version = 'SSL 2.0';
        else if (versionMajor === 3 && versionMinor === 0) version = 'SSL 3.0';
        else version = 'Unknown';
    }
    // Handshake body is the rest
    let body;
    if (buf.length >= headerLength + 1) {
        body = buf.slice(headerLength + 1, headerLength + 1 + recordLength - 1);
    }
    return {
        recordLength,
        msgType,
        msgTypeName,
        versionMajor,
        versionMinor,
        version,
        body,
    };
}
