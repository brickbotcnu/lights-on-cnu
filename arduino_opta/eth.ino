#include "arduino_opta.h"
#include "comm.h"
#include "eth.h"

static uint8_t IP_ADDRS[3][4] = {
    { 192, 168, 11, 165 },
    { 192, 168, 11, 166 },
    { 192, 168, 11, 167 }
};

static EthernetClient eth_client;

static const unsigned long ETH_SERVER_TIMEOUT = 1000;

static EthernetServer eth_server(COMM_ARDUINO_PORT);

void eth_init() {
    uint8_t arduino_id = get_arduino_id();

    IPAddress ip_addr(
        IP_ADDRS[arduino_id][0], IP_ADDRS[arduino_id][1], IP_ADDRS[arduino_id][2], IP_ADDRS[arduino_id][3]
    );

    Ethernet.begin();
    eth_server.begin();
}

void eth_loop() {
    EthernetClient client = eth_server.available();
    if (!client) {
        return;
    }

    if (is_debug()) Serial.println("SOCKET CONNECTED");

    uint8_t data[DATA_MAX_LENGTH];
    uint16_t data_length = 0;

    unsigned long loopStartMillis = millis();

    while (client.connected()) {
        if (millis() - loopStartMillis >= ETH_SERVER_TIMEOUT) {
            if (is_debug()) Serial.println("SOCKET TIMED OUT");
            client.stop();
            return;
        }

        if (client.available()) {
            if (data_length == DATA_MAX_LENGTH) {
                if (is_debug()) Serial.println("SOCKET EXCEEDED MAXIMUM DATA LENGTH");
                client.stop();
                return;
            }

            data[data_length] = client.read();
            data_length++;
        }
    }

    client.stop();
    
    comm_recv_msg(data, data_length);
}

void eth_connect_and_write(IPAddress ip, uint16_t port, const uint8_t *buf, size_t size) {
    EthernetClient client;

    if (client.connect(ip, port)) {
        client.write(buf, size);
        client.flush();
    };

    client.stop();
}
