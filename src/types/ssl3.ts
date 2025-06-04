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

// src/types/ssl3.ts
// SSL 3.0 Handshake structures and parser (RFC 6101)

export interface Ssl3HandshakePayload {
    contentType: number; // Should be 0x16 for handshake
    version: string; // e.g. 'SSL 3.0'
    length: number; // Record layer fragment length
    handshakeType?: number; // e.g. 0x01 for ClientHello
    handshakeTypeName?: string;
    handshakeLength?: number; // Length of handshake message body
    handshakeBody?: Buffer; // The raw handshake message body
}

const SSL3_HANDSHAKE_TYPE_MAP: Record<number, string> = {
    0x00: 'HelloRequest',
    0x01: 'ClientHello',
    0x02: 'ServerHello',
    0x0b: 'Certificate',
    0x0c: 'ServerKeyExchange',
    0x0d: 'CertificateRequest',
    0x0e: 'ServerHelloDone',
    0x0f: 'CertificateVerify',
    0x10: 'ClientKeyExchange',
    0x14: 'Finished',
};

export function parseSsl3HandshakePayload(buf: Buffer): Ssl3HandshakePayload | null {
    if (buf.length < 5) return null;
    const contentType = buf[0];
    const versionMajor = buf[1];
    const versionMinor = buf[2];
    const length = buf.readUInt16BE(3);
    let version = 'Unknown';
    if (versionMajor === 3 && versionMinor === 0) version = 'SSL 3.0';
    else if (versionMajor === 3 && versionMinor === 1) version = 'TLS 1.0';
    else if (versionMajor === 3 && versionMinor === 2) version = 'TLS 1.1';
    else if (versionMajor === 3 && versionMinor === 3) version = 'TLS 1.2';
    else if (versionMajor === 3 && versionMinor === 4) version = 'TLS 1.3';

    let handshakeType: number | undefined;
    let handshakeTypeName: string | undefined;
    let handshakeLength: number | undefined;
    let handshakeBody: Buffer | undefined;

    // Only parse handshake if contentType is handshake and enough data for handshake header
    if (contentType === 0x16 && buf.length >= 9) {
        handshakeType = buf[5];
        handshakeTypeName = SSL3_HANDSHAKE_TYPE_MAP[handshakeType] || 'Other';
        // Handshake length is 3 bytes, big-endian
        handshakeLength = (buf[6] << 16) | (buf[7] << 8) | buf[8];
        // Handshake body starts at offset 9
        if (buf.length >= 9 + handshakeLength) {
            handshakeBody = buf.slice(9, 9 + handshakeLength);
        }
    }

    return {
        contentType,
        version,
        length,
        handshakeType,
        handshakeTypeName,
        handshakeLength,
        handshakeBody,
    };
}
