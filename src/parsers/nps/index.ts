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

import { parseLoginRequestMessage } from "./LoginRequestMessage";

// src/types/nps/index.ts
// This file defines the NPS (Network Protocol Specification) message structure and parser.

export interface NPSMessage {
    msgId: string; // Message ID (first 2 bytes of the header)
    msgLength: number;     // Length of the NPS record (from header)
    body?: any;        // The parsed body of the message, can be JSON or other structured data
}

const NPS_MESSAGE_PARSER_MAP: {id: number, parser: (buf: Buffer) => NPSMessage | null}[] = [
    // Add parsers for different NPS message IDs here
    // Example:
    { id: 0x501, parser: parseLoginRequestMessage },
]

export function parseNPSRawMessage(buf: Buffer): NPSMessage | null {
    if (buf.length < 4) return null;
    // NPS header: 4 bytes (2-byte ID, 2-byte length)
    const msgId = buf.readUInt16BE(0);
    const msgLength = buf.readUInt16BE(2);
    const body = buf.subarray(4, msgLength);

    return {
        msgId: `Unknown(${msgId})`,
        msgLength,
        body,
    };
}

export function parseNPSMessage(buf: Buffer): NPSMessage | null {
    if (buf.length < 4) return null;
    // NPS header: 4 bytes (2-byte ID, 2-byte length)
    const id = buf.readUInt16BE(0);

    // Use the parser for the specific NPS message ID
    let parser = NPS_MESSAGE_PARSER_MAP.find(p => p.id === id)?.parser;
    if (!parser) {
        parser = parseNPSRawMessage; // Fallback to raw parser if not found
    }
    
    const message = parser(buf);
    if (!message) return null;
    
    return {
        msgId: message.msgId,
        msgLength : message.msgLength,
        body: message.body || {},
    };
}
