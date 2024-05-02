#include "print_util.h"

void print_hex(uint8_t *data, uint16_t data_length) {
    for (uint16_t i = 0; i < data_length; i++) {
        if (data[i] < 0x10) Serial.print("0");
        Serial.print(data[i], HEX);
    }
    
    Serial.println();
}
