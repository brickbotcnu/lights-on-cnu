#include "arduino_opta.h"
#include "comm.h"
#include "comm_encryption.h"
#include "comm_msg_types.h"
#include "hardware.h"
#include "print_util.h"
#include "rtc.h"
#include "sha256.h"

static const uint8_t ARDUINO_MSG_SIZE = sizeof(ArduinoMessage);

static uint32_t arduinoMsgCounter = 0;
static uint32_t serverMsgCounter = 0;

static const uint32_t SERVER_MSG_MAX_TIMESTAMP_DIFF = 5;

void comm_recv_msg(uint8_t *data, uint16_t data_length) {
    if ((data_length - IV_LENGTH - HMAC_LENGTH) % 16 != 0) {
        if (is_debug()) Serial.println("Message discarded, invalid length");
        return;
    }

    if (is_debug()) print_hex(data, data_length);

    struct ServerMessage server_message;
    int16_t decrypt_length = comm_decrypt_msg(data, data_length, (uint8_t *) &server_message);

    if (decrypt_length < 0) {
        return;
    }

    if (server_message.counter < serverMsgCounter) {
        if (is_debug()) Serial.println("Server message discarded, invalid counter");
        return;
    }

    if (rtc_get_timestamp() - server_message.timestamp > SERVER_MSG_MAX_TIMESTAMP_DIFF) {
        if (is_debug()) Serial.println("Server message discarded, invalid timestamp");
        return;
    }

    if (is_debug()) {
        Serial.print("Server message type: ");
        Serial.println(server_message.type);

        Serial.print("Server message extra field: ");
        Serial.println(server_message.extra_field);
    }

    if (server_message.type == SERVER_SET_RELAY_STATES) {
        for (uint8_t relay = 0; relay < RELAY_COUNT; relay++) {
            set_relay(relay, (server_message.extra_field >> relay) & 1);
        }
    } else if (server_message.type == SERVER_SET_RELAY_LOCKS) {
        for (uint8_t lock = 0; lock < RELAY_COUNT; lock++) {
            set_lock(lock, (server_message.extra_field >> lock) & 1);
        }
    } else {
        if (is_debug()) Serial.println("Server message discarded, invalid type");
        return;
    }

    serverMsgCounter++;
}

static void comm_create_msg(struct ArduinoMessage *arduino_msg, uint8_t type) {
    arduino_msg->counter = arduinoMsgCounter;
    arduino_msg->timestamp = rtc_get_timestamp();
    arduino_msg->arduino_id = get_arduino_id();
    arduino_msg->type = type;

    arduino_msg->extra_field = 0;

    if (type == ARDUINO_SET_RELAYS) {
        for (uint8_t relay = 0; relay < RELAY_COUNT; relay++) {
            if (get_relay(relay)) {
                arduino_msg->extra_field |= 1 << relay;   
            }
        }
    }
}

void comm_send_msg(uint8_t type) {
    ArduinoMessage arduino_msg;
    comm_create_msg(&arduino_msg, type);

    uint8_t data[DATA_MAX_LENGTH];
    uint16_t data_length = comm_encrypt_msg((uint8_t *) &arduino_msg, ARDUINO_MSG_SIZE, data);

    eth_connect_and_write(COMM_SERVER_IP, COMM_SERVER_PORT, data, data_length);

    arduinoMsgCounter++;
}
