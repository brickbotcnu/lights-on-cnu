#include "arduino_opta.h"
#include "comm.h"
#include "eth.h"

static EthernetClient eth_client;

static const unsigned long ETH_SERVER_TIMEOUT = 1000;

static EthernetServer eth_server(COMM_ARDUINO_PORT);

uint8_t eth_init(IPAddress ip_addr) {
    uint8_t arduino_id = get_arduino_id();

    uint8_t ret = Ethernet.begin(ip_addr);
    eth_server.begin();
    return ret;
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
