// src/types/tcp.ts
export interface TcpHeader {
    sourcePort: number;
    destPort: number;
    sequenceNumber: number;
    ackNumber: number;
    dataOffset: number;
    reserved: number;
    flags: number;
    window: number;
    checksum: number;
    urgentPointer: number;
    options?: string;
    protocol?: string; // New field for detected protocol
}

function detectProtocol(buf: Buffer): string {
    // TLS handshake (ClientHello) usually starts with 0x16 0x03 0x01 or 0x16 0x03 0x03
    if (buf.length > 3 && buf[0] === 0x16 && buf[1] === 0x03 && (buf[2] === 0x00 || buf[2] === 0x01 || buf[2] === 0x02 || buf[2] === 0x03 || buf[2] === 0x04)) {
        return 'TLS';
    }
    // HTTP request (GET/POST/...) in ASCII
    const ascii = buf.toString('ascii');
    if (/^(GET|POST|HEAD|PUT|DELETE|OPTIONS|PATCH|CONNECT|TRACE) /.test(ascii)) {
        return 'HTTP';
    }
    // SSH handshake starts with 'SSH-'
    if (ascii.startsWith('SSH-')) {
        return 'SSH';
    }
    // Default: unknown
    return 'Unknown';
}

export function parseTcpHeader(hex: string): TcpHeader {
    if (hex.length < 40) throw new Error('Hex string too short for TCP header');
    const buf = Buffer.from(hex, 'hex');
    const protocol = detectProtocol(buf.slice(20));
    return {
        sourcePort: buf.readUInt16BE(0),
        destPort: buf.readUInt16BE(2),
        sequenceNumber: buf.readUInt32BE(4),
        ackNumber: buf.readUInt32BE(8),
        dataOffset: (buf[12] >> 4),
        reserved: (buf[12] & 0x0e) >> 1,
        flags: ((buf[12] & 0x01) << 8) | buf[13],
        window: buf.readUInt16BE(14),
        checksum: buf.readUInt16BE(16),
        urgentPointer: buf.readUInt16BE(18),
        options: hex.length > 40 ? hex.slice(40) : undefined,
        protocol,
    };
}
