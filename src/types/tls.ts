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

// src/types/tls.ts

export interface TlsHandshakePayload {
    contentType: number; // Should be 0x16 for handshake
    version: string; // e.g. 'TLS 1.2'
    length: number;
    handshakeType?: number; // e.g. 0x01 for ClientHello
    handshakeTypeName?: string;
}

export function parseTlsHandshakePayload(buf: Buffer): TlsHandshakePayload | null {
    if (buf.length < 5) return null;
    const contentType = buf[0];
    const versionMajor = buf[1];
    const versionMinor = buf[2];
    const length = buf.readUInt16BE(3);
    let version = 'Unknown';
    if (versionMajor === 3) {
        if (versionMinor === 1) version = 'TLS 1.0';
        else if (versionMinor === 2) version = 'TLS 1.1';
        else if (versionMinor === 3) version = 'TLS 1.2';
        else if (versionMinor === 4) version = 'TLS 1.3';
    }
    let handshakeType, handshakeTypeName;
    if (contentType === 0x16 && buf.length > 5) {
        handshakeType = buf[5];
        if (handshakeType === 0x01) handshakeTypeName = 'ClientHello';
        else if (handshakeType === 0x02) handshakeTypeName = 'ServerHello';
        else handshakeTypeName = 'Other';
    }
    return {
        contentType,
        version,
        length,
        handshakeType,
        handshakeTypeName,
    };
}
