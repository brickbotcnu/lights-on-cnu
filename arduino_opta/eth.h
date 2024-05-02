#pragma once

#include <Ethernet.h>
#include <stdint.h>

void eth_init();
void eth_loop();
void eth_connect_and_write(IPAddress ip, uint16_t port, const uint8_t *buf, size_t size);
