import { parseTlsHandshakePayload } from './tls';
import { parseSsl3HandshakePayload } from './ssl3';
import { detectProtocol } from './tcp';

export function logParsedPayload({ protocol, payload, tls, ssl3, ssl2 }: { protocol: string; payload: Buffer; tls?: any; ssl3?: any; ssl2?: any }) {
    console.log('Detected Protocol:', protocol);
    console.log('Payload (hex):', payload.toString('hex'));
    console.log('Payload (ascii):', payload.toString('ascii'));
    if (protocol === 'TLS' && tls) {
        console.log('TLS Handshake Payload:', JSON.stringify(tls, null, 2));
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