// src/types/tcp.ts

export function detectProtocol(buf: Buffer): string {
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
