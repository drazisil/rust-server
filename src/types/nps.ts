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

// src/types/nps.ts
// This file defines the NPS (Network Protocol Specification) message structure and parser.

export interface NPSMessage {
    msgId: number; // Message ID (first 2 bytes of the header)
    msgLength: number;     // Length of the NPS record (from header)
    body?: Buffer;        // The handshake message body
}

export function parseNPSMessage(buf: Buffer): NPSMessage | null {
    if (buf.length < 4) return null;
    // NPS header: 4 bytes (2-byte ID, 2-byte length)
    const msgId = buf.readUInt16BE(0);
    const msgLength = buf.readUInt16BE(2);
    const body = buf.subarray(4, msgLength);

    return {
        msgId,
        msgLength,
        body,
    };
}
