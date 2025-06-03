// src/types/tcp.ts
import { parseTlsHandshakePayload, TlsHandshakePayload } from './tls';

export function detectProtocol(buf: Buffer): string {
    // SSL 3.0 handshake starts with 0x16 0x03 0x00
    if (buf.length > 3 && buf[0] === 0x16 && buf[1] === 0x03 && buf[2] === 0x00) {
        return 'SSL3';
    }
    // TLS handshake (ClientHello) usually starts with 0x16 0x03 0x01 - 0x16 0x03 0x04
    if (buf.length > 3 && buf[0] === 0x16 && buf[1] === 0x03 && (buf[2] === 0x01 || buf[2] === 0x02 || buf[2] === 0x03 || buf[2] === 0x04)) {
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

export function parsePayload(hex: string | Buffer): { protocol: string; payload: Buffer; tls?: TlsHandshakePayload } {
    const buf = typeof hex === 'string' ? Buffer.from(hex, 'hex') : hex;
    const protocol = detectProtocol(buf);
    let tls: TlsHandshakePayload | undefined = undefined;
    if (protocol === 'TLS') {
        tls = parseTlsHandshakePayload(buf) || undefined;
    }
    return { protocol, payload: buf, tls };
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
