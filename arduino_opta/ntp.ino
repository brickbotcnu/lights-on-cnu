#include <EthernetUdp.h>
#include <stdint.h>
#include "ntp.h"

static const uint32_t NTP_MAX_WAIT_TIME = 5000;
static const uint8_t  NTP_PACKET_SIZE   = 48;
static const char     NTP_SERVER[] = "time.nist.gov";

static const uint32_t UDP_PORT = 8888;

static EthernetUDP Udp;
static uint8_t udp_buffer[NTP_PACKET_SIZE];

void ntp_init() {
    Udp.begin(UDP_PORT);
}

// NTP (https://github.com/arduino-libraries/Ethernet/blob/master/examples/UdpNtpClient/UdpNtpClient.ino)
static void ntp_send_packet(const char *address) {
    memset(udp_buffer, 0, NTP_PACKET_SIZE);

    udp_buffer[0] = 0b11100011;
    udp_buffer[1] = 0;
    udp_buffer[2] = 6; 
    udp_buffer[3] = 0xEC;

    udp_buffer[12]  = 49;
    udp_buffer[13]  = 0x4E;
    udp_buffer[14]  = 49;
    udp_buffer[15]  = 52;

    Udp.beginPacket(address, 123);
    Udp.write(udp_buffer, NTP_PACKET_SIZE);
    Udp.endPacket();
}

unsigned long ntp_get_timestamp() {
    ntp_send_packet(NTP_SERVER);

    unsigned long millis_at_request = millis();

    while (1) {
        if (Udp.parsePacket()) {
            Udp.read(udp_buffer, NTP_PACKET_SIZE);

            unsigned long high_word = word(udp_buffer[40], udp_buffer[41]);
            unsigned long low_word = word(udp_buffer[42], udp_buffer[43]);

            const unsigned long SEVENTY_YEARS = 2208988800UL;

            return (high_word << 16 | low_word) - SEVENTY_YEARS;
        }

        if (millis() - millis_at_request > NTP_MAX_WAIT_TIME) return -1;
    }
}
