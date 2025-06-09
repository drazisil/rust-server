#include "custom1_handlers.hpp"
#include "logger.hpp"
#include "custom1_packet.hpp"
#include <cstring>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <vector>
#include <cstdint>
#include <stdexcept>

/** 
 * Example packet and it's custom format:
 * 
 * All fields are BE (Big Endian) encoded.
 * 
 * 0501 // Message Id (2 bytes)
 * 012f // Packet Length (2 bytes) - 47 bytes total
 * 0101 // Packet version (2 bytes)
 * 0000 // Reserved (2 bytes)
 * 0000012f // Packet length (4 bytes) - 47 bytes total
 * 0013 // Length of the next field (2 bytes)
 * 39303031363732303531343031343238323530 // 
 * 0000 // Reserved (2 bytes)
 * 0100 // Length of the next field (2 bytes)
 * 31443538333746463532313545413135434432333341303546313141363139423144394433333541373538433937454533424637443441414630303645313044394445434241354245384337374230424634433437433834423338364642414633303230424337334245333131434530314132343446324445313133314530343937303542393546463543373133383136373731323645384330414235463941343432413545384332393038433344444342394441434436323732433244323037324635344646363642393146373235373441423336453042393736373435353044413737373730453431394638444233304330413741383243413835373532
 * 0004 // Length of the next field (2 bytes)
 * 32313736
 * fea31c19 // CRC32 checksum (4 bytes) - 0x1c19fea3
 */

bool handle_custom1_packet(int client_fd, const std::string& data) {

    // Log the received data in hex for debugging with local port it was received on
    sockaddr_in addr;
    socklen_t addr_len = sizeof(addr);
    if (getpeername(client_fd, (struct sockaddr*)&addr, &addr_len) < 0) {
        LOG_ERROR("Failed to get peer name for client_fd " + std::to_string(client_fd));
        return false;
    }
    std::string hex_data;
    for (unsigned char c : data) {
        char hex[3];
        snprintf(hex, sizeof(hex), "%02x", c);
        hex_data += hex;
    }
    LOG("Received Custom Protocol 1 packet from " + std::string(inet_ntoa(addr.sin_addr)) + ":" + std::to_string(ntohs(addr.sin_port)) + " - Data: " + hex_data);

    // Try to parse and log the packet
    std::vector<uint8_t> buf(data.begin(), data.end());
    static Custom1PacketPacker packer; // Use the new class
    try {
        Custom1Packet pkt = packer.unpack(buf);
        LOG("Parsed Custom Protocol 1 packet:");
        LOG("  Message ID: " + std::to_string(pkt.message_id));
        LOG("  Packet Length: " + std::to_string(pkt.packet_length));
        LOG("  Version: " + std::to_string(pkt.version));
        LOG("  Reserved1: " + std::to_string(pkt.reserved1));
        LOG("  Packet Length 4: " + std::to_string(pkt.packet_length_4));
        LOG("  Field1 Length: " + std::to_string(pkt.field1.size()));
        LOG("  Field1 Data: " + std::string(pkt.field1.begin(), pkt.field1.end()));
        LOG("  Reserved2: " + std::to_string(pkt.reserved2));
        LOG("  Field2 Length: " + std::to_string(pkt.field2.size()));
        LOG("  Field2 Data: " + std::string(pkt.field2.begin(), pkt.field2.end()));
        LOG("  Field3 Length: " + std::to_string(pkt.field3.size()));
        LOG("  Field3 Data: " + std::string(pkt.field3.begin(), pkt.field3.end()));
        LOG("  CRC32: " + std::to_string(pkt.crc32));
    } catch (const std::runtime_error& e) {
        LOG_ERROR("Failed to unpack Custom Protocol 1 packet: " + std::string(e.what()));
        return false;
    }


    // Placeholder: always respond with a static message
    const char* msg = "Custom Protocol 1 Connected\n";
    send(client_fd, msg, strlen(msg), 0);
    return true;
}


