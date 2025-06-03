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
