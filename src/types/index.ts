import { parsePayload } from './tcp';
import { parseTlsHandshakePayload } from './tls';

export function logParsedPayload({ protocol, payload }: { protocol: string; payload: Buffer }) {
    console.log('Detected Protocol:', protocol);
    console.log('Payload (hex):', payload.toString('hex'));
    console.log('Payload (ascii):', payload.toString('ascii'));
    if (protocol === 'TLS') {
        const tls = parseTlsHandshakePayload(payload);
        if (tls) {
            console.log('TLS Handshake Payload:', JSON.stringify(tls, null, 2));
        } else {
            console.log('Could not parse TLS handshake payload.');
        }
    }
}

export function getParsedPayloadLogObject({ port, protocol, payload }: { port: number; protocol: string; payload: Buffer }) {
    const logObj: any = { port, protocol, payloadHex: payload.toString('hex'), payloadAscii: payload.toString('ascii') };
    if (protocol === 'TLS') {
        const tls = parseTlsHandshakePayload(payload);
        if (tls) {
            logObj.tls = tls;
        } else {
            logObj.tlsParseError = 'Could not parse TLS handshake payload';
        }
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

export { parsePayload } from './tcp';