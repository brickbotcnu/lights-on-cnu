#pragma once

#include <Ethernet.h>
#include <stdint.h>

static const uint32_t COMM_ARDUINO_PORT = 9090;
static const uint32_t COMM_SERVER_PORT = 9091;
static const IPAddress COMM_SERVER_IP(192, 168, 0, 185);

void comm_recv_msg(uint8_t *data, uint16_t data_length);
void comm_send_msg(uint8_t type);
