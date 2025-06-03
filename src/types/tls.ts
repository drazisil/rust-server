// src/types/tls.ts
import { TLS_CIPHER_SUITES } from './index';

function parseCipherSuites(buf: Buffer): string[] {
    const suites: string[] = [];
    for (let i = 0; i + 1 < buf.length; i += 2) {
        const hex = buf.slice(i, i + 2).toString('hex');
        suites.push(TLS_CIPHER_SUITES[hex] || `UNKNOWN(${hex})`);
    }
    return suites;
}

export interface TlsHandshakePayload {
    contentType: number; // Should be 0x16 for handshake
    version: string; // e.g. 'TLS 1.2'
    length: number;
    handshakeType?: number; // e.g. 0x01 for ClientHello
    handshakeTypeName?: string;
    cipherSuitesList?: string[];
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
    let handshakeType, handshakeTypeName, cipherSuitesList;
    if (contentType === 0x16 && buf.length > 5) {
        handshakeType = buf[5];
        if (handshakeType === 0x01) handshakeTypeName = 'ClientHello';
        else if (handshakeType === 0x02) handshakeTypeName = 'ServerHello';
        else handshakeTypeName = 'Other';
        // Parse cipher suites for ClientHello
        if (handshakeType === 0x01) {
            // TLS Handshake header: 1 (type) + 3 (length) = 4 bytes
            // ClientHello: version(2), random(32), sessionIdLen(1), sessionId(?), cipherSuitesLen(2), cipherSuites(?), ...
            let offset = 6; // handshakeType(1) + handshakeLength(3) + version(2)
            if (buf.length < offset + 32 + 1) return {
                contentType, version, length, handshakeType, handshakeTypeName
            };
            offset += 2; // version
            offset += 32; // random
            const sessionIdLen = buf[offset];
            offset += 1;
            offset += sessionIdLen;
            if (buf.length < offset + 2) return {
                contentType, version, length, handshakeType, handshakeTypeName
            };
            const cipherSuitesLen = buf.readUInt16BE(offset);
            offset += 2;
            if (buf.length < offset + cipherSuitesLen) return {
                contentType, version, length, handshakeType, handshakeTypeName
            };
            const cipherSuites = buf.slice(offset, offset + cipherSuitesLen);
            cipherSuitesList = parseCipherSuites(cipherSuites);
        }
    }
    return {
        contentType,
        version,
        length,
        handshakeType,
        handshakeTypeName,
        cipherSuitesList,
    };
}
