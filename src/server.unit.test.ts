// src/server.unit.test.ts
import { describe, it, expect, vi  } from 'vitest';
import { getParsedPayloadLogObject, parsePayload } from './parsers';
import { NPSMessageDTO } from './server';
import { handleNpsMessage } from './nps-handler';

// Mocks for logger
const logger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
};

// Test getParsedPayloadLogObject (integration with parsePayload is covered in parsers tests)
describe('getParsedPayloadLogObject', () => {
    it('returns a log object with protocol, payload, and port', () => {
        const buf = Buffer.from('GET / HTTP/1.1\r\n\r\n');
        const parsed = parsePayload(buf);
        const logObj = getParsedPayloadLogObject({
            port: 1234,
            protocol: parsed.protocol,
            payload: parsed.payload,
            nps: undefined,
        });
        expect(logObj).toMatchObject({
            port: 1234,
            protocol: 'HTTP',
            payloadHex: expect.any(String),
            payloadAscii: expect.any(String),
        });
    });
});

describe('NPSMessageDTO and handleNpsMessage', () => {
    it('returns a response DTO with the same id and payload (echo)', () => {
        const dto: NPSMessageDTO = {
            id: '1.2.3.4:5678',
            payload: Buffer.from('test'),
            nps: { type: 'test', data: 42 } as any,
        };
        const response = handleNpsMessage(dto);
        expect(response).toBeDefined();
        expect(response?.id).toBe(dto.id);
        expect(response?.payload?.toString()).toBe('test');
    });
    it('returns undefined for missing nps', () => {
        const dto: NPSMessageDTO = {
            id: '1.2.3.4:5678',
            payload: Buffer.from('test'),
        };
        const response = handleNpsMessage(dto);
        expect(response).toBeUndefined();
    });
});
