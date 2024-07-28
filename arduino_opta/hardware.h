#pragma once

#include <stdint.h>

static const uint8_t RELAY_COUNT = 4;

void hardware_init();
void hardware_loop();
uint8_t get_relay(uint8_t relay);
void set_relay(uint8_t relay, uint8_t state);
void set_lock(uint8_t lock, uint8_t state);
