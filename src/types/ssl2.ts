// src/types/ssl2.ts
// SSL 2.0 Handshake structures and parser (see: https://www-archive.mozilla.org/projects/security/pki/nss/ssl/draft02.html)

import { SSL2_CIPHER_SPECS } from './index';

export interface Ssl2HandshakePayload {
    recordLength: number; // Length of the SSL2 record (from header)
    msgType?: number;     // Handshake message type (if present)
    msgTypeName?: string; // Human-readable handshake type
    versionMajor?: number;
    versionMinor?: number;
    version?: string;
    body?: Buffer;        // The handshake message body
    parsedBody?: Ssl2ParsedHandshakeBody; // Parsed handshake body, if available
}

// --- SSL 2.0 HANDSHAKE BODY STRUCTURES ---
export interface Ssl2ClientHello {
    versionMajor: number;
    versionMinor: number;
    cipherSpecs: Buffer;
    sessionId: Buffer;
    challenge: Buffer;
}

export interface Ssl2ServerHello {
    sessionIdHit: boolean;
    certificateType: number;
    versionMajor: number;
    versionMinor: number;
    certificate: Buffer;
    cipherSpecs: Buffer;
    connectionId: Buffer;
}

export interface Ssl2ClientMasterKey {
    cipherKind: Buffer; // 3 bytes
    clearKey: Buffer;
    encryptedKey: Buffer;
    keyArg: Buffer;
}

export interface Ssl2ClientFinished {
    connectionId: Buffer;
}

export interface Ssl2ServerVerify {
    challenge: Buffer;
}

export interface Ssl2ServerFinished {
    sessionId: Buffer;
}

export interface Ssl2RequestCertificate {
    authType: number;
    certificateChallenge: Buffer;
}

export interface Ssl2ClientCertificate {
    certificateType: number;
    certificate: Buffer;
    response: Buffer;
}

export interface Ssl2Error {
    errorCode: number;
}

export type Ssl2ParsedHandshakeBody =
    | Ssl2ClientHello
    | Ssl2ServerHello
    | Ssl2ClientMasterKey
    | Ssl2ClientFinished
    | Ssl2ServerVerify
    | Ssl2ServerFinished
    | Ssl2RequestCertificate
    | Ssl2ClientCertificate
    | Ssl2Error
    | Buffer
    | null;

const SSL2_HANDSHAKE_TYPE_MAP: Record<number, string> = {
    1: 'ClientHello',
    2: 'ClientMasterKey',
    3: 'ClientFinished',
    4: 'ServerHello',
    5: 'ServerVerify',
    6: 'ServerFinished',
    7: 'RequestCertificate',
    8: 'ClientCertificate',
};

// SSL 2.0 cipher spec map (see: https://www-archive.mozilla.org/projects/security/pki/nss/ssl/draft02.html#A.4)
const SSL2_CIPHER_SPECS: Record<string, string> = {
    '010080': 'SSL_CK_RC4_128_WITH_MD5',
    '020080': 'SSL_CK_RC4_128_EXPORT40_WITH_MD5',
    '030080': 'SSL_CK_RC2_128_CBC_WITH_MD5',
    '040080': 'SSL_CK_RC2_128_CBC_EXPORT40_WITH_MD5',
    '050080': 'SSL_CK_IDEA_128_CBC_WITH_MD5',
    '060040': 'SSL_CK_DES_64_CBC_WITH_MD5',
    '0700c0': 'SSL_CK_DES_192_EDE3_CBC_WITH_MD5',
    // Add more as needed from the spec
};

function parseCipherSpecs(buf: Buffer): string[] {
    const specs: string[] = [];
    for (let i = 0; i + 2 < buf.length; i += 3) {
        const hex = buf.slice(i, i + 3).toString('hex');
        specs.push(SSL2_CIPHER_SPECS[hex] || `UNKNOWN(${hex})`);
    }
    return specs;
}

function parseClientHelloBody(body: Buffer): Ssl2ClientHello & { cipherSpecsList: string[] } | null {
    // See: https://www-archive.mozilla.org/projects/security/pki/nss/ssl/draft02.html#2.2
    if (body.length < 9) return null;
    const versionMajor = body[0];
    const versionMinor = body[1];
    const cipherSpecLength = body.readUInt16BE(2);
    const sessionIdLength = body.readUInt16BE(4);
    const challengeLength = body.readUInt16BE(6);
    let offset = 8; // The spec says these are at 0-7, so offset 8 is the start of cipher specs
    // No extra +1 for padding: the spec does not mention a padding byte here
    if (body.length < offset + cipherSpecLength + sessionIdLength + challengeLength) return null;
    const cipherSpecs = body.slice(offset, offset + cipherSpecLength);
    const cipherSpecsList = parseCipherSpecs(cipherSpecs);
    offset += cipherSpecLength;
    const sessionId = body.slice(offset, offset + sessionIdLength);
    offset += sessionIdLength;
    const challenge = body.slice(offset, offset + challengeLength);
    return {
        versionMajor,
        versionMinor,
        cipherSpecs,
        cipherSpecsList,
        sessionId,
        challenge,
    };
}

function parseServerHelloBody(body: Buffer): Ssl2ServerHello | null {
    // See: https://www-archive.mozilla.org/projects/security/pki/nss/ssl/draft02.html#2.3
    if (body.length < 11) return null;
    const sessionIdHit = !!body[0];
    const certificateType = body[1];
    const versionMajor = body[2];
    const versionMinor = body[3];
    const certificateLength = body.readUInt16BE(4);
    const cipherSpecLength = body.readUInt16BE(6);
    const connectionIdLength = body.readUInt16BE(8);
    let offset = 10;
    if (body.length < offset + certificateLength + cipherSpecLength + connectionIdLength) return null;
    const certificate = body.slice(offset, offset + certificateLength);
    offset += certificateLength;
    const cipherSpecs = body.slice(offset, offset + cipherSpecLength);
    offset += cipherSpecLength;
    const connectionId = body.slice(offset, offset + connectionIdLength);
    return {
        sessionIdHit,
        certificateType,
        versionMajor,
        versionMinor,
        certificate,
        cipherSpecs,
        connectionId,
    };
}

function parseClientMasterKeyBody(body: Buffer): Ssl2ClientMasterKey | null {
    if (body.length < 10) return null;
    const cipherKind = body.slice(0, 3);
    const clearKeyLength = body.readUInt16BE(3);
    const encryptedKeyLength = body.readUInt16BE(5);
    const keyArgLength = body.readUInt16BE(7);
    let offset = 9;
    if (body.length < offset + clearKeyLength + encryptedKeyLength + keyArgLength) return null;
    const clearKey = body.slice(offset, offset + clearKeyLength);
    offset += clearKeyLength;
    const encryptedKey = body.slice(offset, offset + encryptedKeyLength);
    offset += encryptedKeyLength;
    const keyArg = body.slice(offset, offset + keyArgLength);
    return { cipherKind, clearKey, encryptedKey, keyArg };
}

function parseClientFinishedBody(body: Buffer): Ssl2ClientFinished | null {
    // connection-id is the rest of the body
    return { connectionId: body };
}

function parseServerVerifyBody(body: Buffer): Ssl2ServerVerify | null {
    // challenge is the rest of the body
    return { challenge: body };
}

function parseServerFinishedBody(body: Buffer): Ssl2ServerFinished | null {
    // session-id is the rest of the body
    return { sessionId: body };
}

function parseRequestCertificateBody(body: Buffer): Ssl2RequestCertificate | null {
    if (body.length < 2) return null;
    const authType = body[0];
    const certificateChallenge = body.slice(1);
    return { authType, certificateChallenge };
}

function parseClientCertificateBody(body: Buffer): Ssl2ClientCertificate | null {
    if (body.length < 5) return null;
    const certificateType = body[0];
    const certificateLength = body.readUInt16BE(1);
    const responseLength = body.readUInt16BE(3);
    let offset = 5;
    if (body.length < offset + certificateLength + responseLength) return null;
    const certificate = body.slice(offset, offset + certificateLength);
    offset += certificateLength;
    const response = body.slice(offset, offset + responseLength);
    return { certificateType, certificate, response };
}

function parseErrorBody(body: Buffer): Ssl2Error | null {
    if (body.length < 3) return null;
    const errorCode = body.readUInt16BE(1);
    return { errorCode };
}

export function parseSsl2HandshakePayload(buf: Buffer): Ssl2HandshakePayload | null {
    if (buf.length < 3) return null;
    // SSL2 header: 2 or 3 bytes. If MSB of first byte is set, 2-byte header (no padding), else 3-byte header (with padding)
    let headerLength = 2;
    let recordLength = 0;
    if ((buf[0] & 0x80) === 0x80) {
        // 2-byte header, MSB set
        recordLength = ((buf[0] & 0x7f) << 8) | buf[1];
    } else {
        // 3-byte header, MSB not set
        headerLength = 3;
        recordLength = ((buf[0] & 0x3f) << 8) | buf[1];
        // buf[2] is padding length (not used here)
    }
    if (buf.length < headerLength + 1) return { recordLength };
    const msgType = buf[headerLength];
    const msgTypeName = SSL2_HANDSHAKE_TYPE_MAP[msgType] || 'Other';
    let versionMajor, versionMinor, version;
    // For ClientHello and ServerHello, version is present at a fixed offset
    if ((msgType === 1 || msgType === 4) && buf.length >= headerLength + 3) {
        versionMajor = buf[headerLength + 1];
        versionMinor = buf[headerLength + 2];
        if (versionMajor === 2 && versionMinor === 0) version = 'SSL 2.0';
        else if (versionMajor === 3 && versionMinor === 0) version = 'SSL 3.0';
        else version = 'Unknown';
    }
    // Handshake body is the rest
    let body;
    if (buf.length >= headerLength + 1) {
        // The handshake body is the rest of the record after the type byte
        body = buf.slice(headerLength + 1, headerLength + recordLength);
    }
    let parsedBody: Ssl2ParsedHandshakeBody = null;
    if (body && msgType === 1) {
        parsedBody = parseClientHelloBody(body);
    } else if (body && msgType === 2) {
        parsedBody = parseClientMasterKeyBody(body);
    } else if (body && msgType === 3) {
        parsedBody = parseClientFinishedBody(body);
    } else if (body && msgType === 4) {
        parsedBody = parseServerHelloBody(body);
    } else if (body && msgType === 5) {
        parsedBody = parseServerVerifyBody(body);
    } else if (body && msgType === 6) {
        parsedBody = parseServerFinishedBody(body);
    } else if (body && msgType === 7) {
        parsedBody = parseRequestCertificateBody(body);
    } else if (body && msgType === 8) {
        parsedBody = parseClientCertificateBody(body);
    } else if (body && msgType === 0) {
        parsedBody = parseErrorBody(body);
    } else if (body) {
        parsedBody = body;
    }
    return {
        recordLength,
        msgType,
        msgTypeName,
        versionMajor,
        versionMinor,
        version,
        body: body ? Buffer.from(body) : undefined,
        parsedBody,
    };
}
