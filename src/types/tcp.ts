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

// src/types/tcp.ts

/**
 * Detects the protocol of a given buffer by inspecting its initial bytes.
 *
 * This function attempts to identify common protocols such as HTTP, NPS, and SSH
 * based on the structure and content of the provided buffer. If none of the known patterns match,
 * it returns 'Unknown'.
 *
 * @param buf - The buffer containing the initial bytes of a network packet or stream.
 * @returns The detected protocol as a string: 'HTTP', 'NPS', 'SSH', or 'Unknown'.
 */
export function detectProtocol(buf: Buffer): string {
    // HTTP request (GET/POST/...) in ASCII
    const ascii = buf.toString('ascii');
    if (/^(GET|POST|HEAD|PUT|DELETE|OPTIONS|PATCH|CONNECT|TRACE) /.test(ascii)) {
        return 'HTTP';
    }
    if (buf.length > 4 && buf.readInt16BE(2) === buf.length) {
    // This might be an NPS packet, which has a length field at offset 2
        return 'NPS';
    }
    if (ascii.startsWith('SSH-')) {
        return 'SSH';
    }
    // Default: unknown
    return 'Unknown';
}

export function parsePayload(hex: string | Buffer): {
    protocol: string;
    payload: Buffer;
} {
    const buf = typeof hex === 'string' ? Buffer.from(hex, 'hex') : hex;
    const protocol = detectProtocol(buf);
    return { protocol, payload: buf };
}

export interface SshPayload {
    protocolVersion: string; // e.g. 'SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.3'
    softwareVersion?: string;
    comments?: string;
}

export function parseSshPayload(buf: Buffer): SshPayload | null {
    const ascii = buf.toString('ascii');
    if (ascii.startsWith('SSH-')) {
        // SSH identification string: 'SSH-protoversion-softwareversion [comments]\r\n'
        // See RFC 4253 section 4.2
        const line = ascii.split('\r\n')[0] || ascii.split('\n')[0];
        const [protocolVersion, ...rest] = line.split(' ');
        const [proto, softwareVersion] = protocolVersion.split('-').slice(1);
        const comments = rest.join(' ');
        return {
            protocolVersion: protocolVersion,
            softwareVersion,
            comments: comments || undefined,
        };
    }
    return null;
}
