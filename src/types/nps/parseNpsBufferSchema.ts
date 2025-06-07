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


// --- Generic NPS buffer parsing utilities ---

export type NpsFieldType = 'u16' | 'u32' | 'string' | 'hex';
export interface NpsFieldSchema {
    name: string;
    type: NpsFieldType;
    lengthFrom?: string; // for string/hex fields
}

export function parseNpsBufferSchema(
    buf: Buffer,
    offsetStart: number,
    schema: readonly NpsFieldSchema[]
): { parsed: Record<string, any>; offset: number; } | null {
    let offset = offsetStart;
    function safeReadUInt16(): number | null {
        if (offset + 2 > buf.length) return null;
        const val = buf.readUInt16BE(offset);
        offset += 2;
        return val;
    }
    function safeReadUInt32(): number | null {
        if (offset + 4 > buf.length) return null;
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
                if (!field.lengthFrom) return null;
                const len = parsed[field.lengthFrom];
                if (typeof len !== 'number') return null;
                value = safeReadString(len);
                break;
            }
            case 'hex': {
                if (!field.lengthFrom) return null;
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
    return { parsed, offset };
}
