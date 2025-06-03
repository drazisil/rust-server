import { parseTlsHandshakePayload } from './tls';
import { parseSsl3HandshakePayload } from './ssl3';
import { detectProtocol } from './tcp';

export function logParsedPayload({ protocol, payload, tls, ssl3, ssl2 }: { protocol: string; payload: Buffer; tls?: any; ssl3?: any; ssl2?: any }) {
    console.log('Detected Protocol:', protocol);
    console.log('Payload (hex):', payload.toString('hex'));
    if (protocol === 'TLS' && tls) {
        console.log('TLS Handshake Payload:', JSON.stringify(tls, null, 2));
        if (tls.cipherSuitesList) {
            console.log('TLS Cipher Suites:', JSON.stringify(tls.cipherSuitesList, null, 2));
        }
    } else if (protocol === 'SSL3' && ssl3) {
        console.log('SSL3 Handshake Payload:', JSON.stringify(ssl3, null, 2));
    } else if (protocol === 'SSL2' && ssl2) {
        if (ssl2.parsedBody) {
            console.log('SSL2 Handshake Parsed Body:', JSON.stringify(ssl2.parsedBody, null, 2));
        }
    }
}

export function getParsedPayloadLogObject({ port, protocol, payload, tls, ssl3 }: { port: number; protocol: string; payload: Buffer; tls?: any; ssl3?: any }) {
    const logObj: any = { port, protocol, payloadHex: payload.toString('hex'), payloadAscii: payload.toString('ascii') };
    if (protocol === 'TLS' && tls) {
        logObj.tls = tls;
    } else if (protocol === 'SSL3' && ssl3) {
        logObj.ssl3 = ssl3;
    }
    return logObj;
}

export interface Message {
    id: string;
    content: string;
    senderId: string;
    timestamp: Date;
}

export interface User {
    id: string;
    username: string;
    socketId: string;
}

// --- Shared Cipher Suite Maps ---
export const SSL2_CIPHER_SPECS: Record<string, string> = {
    '010080': 'SSL_CK_RC4_128_WITH_MD5',
    '020080': 'SSL_CK_RC4_128_EXPORT40_WITH_MD5',
    '030080': 'SSL_CK_RC2_128_CBC_WITH_MD5',
    '040080': 'SSL_CK_RC2_128_CBC_EXPORT40_WITH_MD5',
    '050080': 'SSL_CK_IDEA_128_CBC_WITH_MD5',
    '060040': 'SSL_CK_DES_64_CBC_WITH_MD5',
    '0700c0': 'SSL_CK_DES_192_EDE3_CBC_WITH_MD5',
    // Add more as needed from the spec
};

export const TLS_CIPHER_SUITES: Record<string, string> = {
    '0000': 'TLS_NULL_WITH_NULL_NULL',
    '0001': 'TLS_RSA_WITH_NULL_MD5',
    '0002': 'TLS_RSA_WITH_NULL_SHA',
    '0004': 'TLS_RSA_WITH_RC4_128_MD5',
    '0005': 'TLS_RSA_WITH_RC4_128_SHA',
    '000a': 'TLS_RSA_WITH_3DES_EDE_CBC_SHA',
    '002f': 'TLS_RSA_WITH_AES_128_CBC_SHA',
    '0035': 'TLS_RSA_WITH_AES_256_CBC_SHA',
    '009c': 'TLS_RSA_WITH_AES_128_GCM_SHA256',
    '009d': 'TLS_RSA_WITH_AES_256_GCM_SHA384',
    'c02f': 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
    'c030': 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
    '1301': 'TLS_AES_128_GCM_SHA256',
    '1302': 'TLS_AES_256_GCM_SHA384',
    '1303': 'TLS_CHACHA20_POLY1305_SHA256',
    // Add more as needed
};

export function parsePayload(hex: string | Buffer): { protocol: string; payload: Buffer; tls?: ReturnType<typeof parseTlsHandshakePayload>; ssl3?: ReturnType<typeof parseSsl3HandshakePayload>; ssl2?: any } {
    const buf = typeof hex === 'string' ? Buffer.from(hex, 'hex') : hex;
    let protocol = detectProtocol(buf);
    let tls, ssl3, ssl2;
    // SSL 3.0 handshake detection: contentType=0x16, versionMajor=3, versionMinor=0
    if (buf.length > 3 && buf[0] === 0x16 && buf[1] === 0x03 && buf[2] === 0x00) {
        protocol = 'SSL3';
        ssl3 = parseSsl3HandshakePayload(buf) || undefined;
    } else if (protocol === 'TLS') {
        tls = parseTlsHandshakePayload(buf) || undefined;
    } else if (protocol === 'SSL2') {
        // Dynamically import to avoid circular dependency
        const { parseSsl2HandshakePayload } = require('./ssl2');
        ssl2 = parseSsl2HandshakePayload(buf) || undefined;
    }
    return { protocol, payload: buf, tls, ssl3, ssl2 };
}