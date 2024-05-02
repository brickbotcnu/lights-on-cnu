#pragma once

#include <stdint.h>

struct ArduinoMessage {
    uint32_t counter;
    uint32_t timestamp;
    uint8_t arduino_id;
    uint8_t type;
    uint8_t extra_field;
} __attribute__((packed));

struct ServerMessage {
    uint32_t counter;
    uint32_t timestamp;
    uint8_t type;
    uint8_t extra_field;
} __attribute__((packed));

enum ArduinoMessageType {
    ARDUINO_SET_RELAYS = 0,
};

enum ServerMessageType {
    SERVER_SET_RELAYS = 0,
    SERVER_SET_LOCKS = 1,
    SERVER_SET_RED_LED = 2
};
