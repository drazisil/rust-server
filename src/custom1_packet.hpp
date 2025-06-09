#ifndef CUSTOM1_PACKET_HPP
#define CUSTOM1_PACKET_HPP
#include <vector>
#include <cstdint>
#include <stdexcept>

// Helper to read BE values from a buffer
inline uint16_t read_u16(const uint8_t* p) { return (p[0] << 8) | p[1]; }
inline uint32_t read_u32(const uint8_t* p) { return (p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]; }

struct Custom1Packet {
    uint16_t message_id;
    uint16_t packet_length;
    uint16_t version;
    uint16_t reserved1;
    uint32_t packet_length_4;
    std::vector<uint8_t> field1;
    uint16_t reserved2;
    std::vector<uint8_t> field2;
    std::vector<uint8_t> field3;
    uint32_t crc32;
};

class Custom1PacketPacker {
public:
    virtual ~Custom1PacketPacker() = default;
    virtual Custom1Packet unpack(const std::vector<uint8_t>& buf) const {
        Custom1Packet pkt;
        size_t offset = 0;
        if (buf.size() < 18) throw std::runtime_error("Packet too short");
        pkt.message_id = read_u16(&buf[offset]); offset += 2;
        pkt.packet_length = read_u16(&buf[offset]); offset += 2;
        pkt.version = read_u16(&buf[offset]); offset += 2;
        pkt.reserved1 = read_u16(&buf[offset]); offset += 2;
        pkt.packet_length_4 = read_u32(&buf[offset]); offset += 4;
        uint16_t field1_len = read_u16(&buf[offset]); offset += 2;
        pkt.field1.assign(buf.begin() + offset, buf.begin() + offset + field1_len); offset += field1_len;
        pkt.reserved2 = read_u16(&buf[offset]); offset += 2;
        uint16_t field2_len = read_u16(&buf[offset]); offset += 2;
        pkt.field2.assign(buf.begin() + offset, buf.begin() + offset + field2_len); offset += field2_len;
        uint16_t field3_len = read_u16(&buf[offset]); offset += 2;
        pkt.field3.assign(buf.begin() + offset, buf.begin() + offset + field3_len); offset += field3_len;
        pkt.crc32 = read_u32(&buf[offset]); offset += 4;
        return pkt;
    }
    virtual std::vector<uint8_t> pack(const Custom1Packet& pkt) const {
        std::vector<uint8_t> buf;
        auto write_u16 = [&](uint16_t v) { buf.push_back(v >> 8); buf.push_back(v & 0xFF); };
        auto write_u32 = [&](uint32_t v) { buf.push_back((v >> 24) & 0xFF); buf.push_back((v >> 16) & 0xFF); buf.push_back((v >> 8) & 0xFF); buf.push_back(v & 0xFF); };
        write_u16(pkt.message_id);
        write_u16(pkt.packet_length);
        write_u16(pkt.version);
        write_u16(pkt.reserved1);
        write_u32(pkt.packet_length_4);
        write_u16(pkt.field1.size());
        buf.insert(buf.end(), pkt.field1.begin(), pkt.field1.end());
        write_u16(pkt.reserved2);
        write_u16(pkt.field2.size());
        buf.insert(buf.end(), pkt.field2.begin(), pkt.field2.end());
        write_u16(pkt.field3.size());
        buf.insert(buf.end(), pkt.field3.begin(), pkt.field3.end());
        write_u32(pkt.crc32);
        return buf;
    }
};

#endif // CUSTOM1_PACKET_HPP
