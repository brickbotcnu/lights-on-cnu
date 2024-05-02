#pragma once

#include <stdint.h>

uint16_t aes_decrypt(uint8_t in[], uint16_t in_len, uint8_t iv[], uint8_t out[]);
uint16_t aes_encrypt(uint8_t in[], uint16_t in_len, uint8_t iv[], uint8_t out[]);
