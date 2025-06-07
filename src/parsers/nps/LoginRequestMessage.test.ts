// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, it, expect } from 'vitest';
import { parseLoginRequestMessage } from './LoginRequestMessage';

function hexToBuffer(hex: string): Buffer {
  return Buffer.from(hex.replace(/\s+/g, ''), 'hex');
}

describe('parseLoginRequestMessage', () => {
  it('parses a valid LoginRequestMessage', () => {
    const username = 'admin';
    const sessionKey = 'abcd';
    const gameId = '2176';
    const usernameLength = Buffer.byteLength(username, 'utf8');
    const sessionKeyLength = Buffer.byteLength(sessionKey, 'utf8');
    const gameIdLength = Buffer.byteLength(gameId, 'utf8');
    // Body layout as per parser
    const bodyLen = 2 + 2 + 4 + 2 + usernameLength + 2 + 2 + sessionKeyLength + 2 + gameIdLength + 4;
    const totalLen = 4 + bodyLen;
    // Header: 2 bytes msgId, 2 bytes msgLength
    const header = Buffer.alloc(4);
    header.writeUInt16BE(0x0501, 0); // msgId
    header.writeUInt16BE(totalLen, 2); // msgLength (total buffer length)
    const body = Buffer.alloc(bodyLen);
    let o = 0;
    body.writeUInt16BE(0x0101, o); o += 2; // version
    body.writeUInt16BE(0x0000, o); o += 2; // reserved1
    body.writeUInt32BE(0, o); o += 4;      // checksum
    body.writeUInt16BE(usernameLength, o); o += 2; // usernameLength
    body.write(username, o, 'utf8'); o += usernameLength;
    body.writeUInt16BE(0x0000, o); o += 2; // reserved2
    body.writeUInt16BE(sessionKeyLength, o); o += 2; // sessionKeyLength
    body.write(sessionKey, o, 'utf8'); o += sessionKeyLength;
    body.writeUInt16BE(gameIdLength, o); o += 2; // gameIdLength
    body.write(gameId, o, 'utf8'); o += gameIdLength;
    body.writeUInt32BE(0, o); o += 4; // reserved3
    const buf = Buffer.concat([header, body]);
    expect(buf.length).toBe(totalLen);
    const result = parseLoginRequestMessage(buf);
    expect(result).not.toBeNull();
    expect(result?.msgId).toBe('0501');
    expect(result?.body.username).toBe('admin');
    expect(result?.body.sessionKey).toBe(Buffer.from('abcd', 'utf8').toString('hex'));
    expect(result?.body.usernameLength).toBe(5);
    expect(result?.body.sessionKeyLength).toBe(4);
  });

  it('returns null for too-short buffer', () => {
    const buf = Buffer.alloc(2);
    expect(parseLoginRequestMessage(buf)).toBeNull();
  });

  it('returns null for buffer not aligned to 4 bytes', () => {
    // 7 bytes, not a multiple of 4
    const buf = Buffer.alloc(7);
    expect(parseLoginRequestMessage(buf)).toBeNull();
  });

  it('returns null for buffer shorter than msgLength', () => {
    // Header says length is 100, but buffer is only 12 bytes (multiple of 4)
    const buf = Buffer.from('05010064' + '00'.repeat(8), 'hex');
    expect(parseLoginRequestMessage(buf)).toBeNull();
  });

  it('returns null if parsed length does not match msgLength', () => {
    // Valid header, but body is truncated (msgLength=16, but only 12 bytes of body)
    const buf = Buffer.from('05010010' + '00'.repeat(12), 'hex');
    expect(parseLoginRequestMessage(buf)).toBeNull();
  });
});
