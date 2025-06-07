import { describe, it, expect } from 'vitest';
import { detectProtocol } from './tcp';

describe('detectProtocol', () => {
    it('detects HTTP protocol (GET)', () => {
        const buf = Buffer.from('GET / HTTP/1.1\r\nHost: example.com\r\n\r\n', 'ascii');
        expect(detectProtocol(buf)).toBe('HTTP');
    });

    it('detects HTTP protocol (POST)', () => {
        const buf = Buffer.from('POST /api HTTP/1.1\r\nHost: example.com\r\n\r\n', 'ascii');
        expect(detectProtocol(buf)).toBe('HTTP');
    });

    it('detects NPS protocol', () => {
        // buf.length = 6, buf.readInt16BE(2) === 6
        const buf = Buffer.from([0x00, 0x01, 0x00, 0x06, 0xAA, 0xBB]);
        expect(detectProtocol(buf)).toBe('NPS');
    });

    it('returns Unknown for unrecognized protocol', () => {
        const buf = Buffer.from([0x01, 0x02, 0x03, 0x04]);
        expect(detectProtocol(buf)).toBe('Unknown');
    });

    it('returns Unknown for empty buffer', () => {
        const buf = Buffer.alloc(0);
        expect(detectProtocol(buf)).toBe('Unknown');
    });
});