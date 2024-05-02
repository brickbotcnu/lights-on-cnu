#pragma once

#include <stdint.h>
#include "sha256.h"

static const uint16_t IV_LENGTH = 16;
static const uint16_t CIPHERTEXT_MAX_LENGTH = 32;
static const uint16_t HMAC_LENGTH = SHA256_HASH_SIZE;

static const uint16_t DATA_MAX_LENGTH = IV_LENGTH + CIPHERTEXT_MAX_LENGTH + HMAC_LENGTH;

int16_t comm_decrypt_msg(uint8_t *in, uint16_t in_length, uint8_t *out);
uint16_t comm_encrypt_msg(uint8_t *in, uint16_t in_length, uint8_t *out);
