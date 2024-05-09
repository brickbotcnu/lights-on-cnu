#include <stdlib.h>
#include "aes_impl.h"
#include "arduino_opta.h"
#include "comm_encryption.h"
#include "hmac_impl.h"
#include "print_util.h"

int16_t comm_decrypt_msg(uint8_t *in, uint16_t in_length, uint8_t *out) {
    uint8_t iv[IV_LENGTH];
    uint8_t cipher[CIPHERTEXT_MAX_LENGTH];
    uint8_t received_hmac[HMAC_LENGTH];
    uint8_t computed_hmac[HMAC_LENGTH];

    uint16_t iv_start = 0;
    uint16_t iv_end   = IV_LENGTH;

    uint16_t cipher_start  = iv_end;
    uint16_t cipher_end    = in_length - HMAC_LENGTH;
    uint16_t cipher_length = cipher_end - cipher_start;

    uint16_t hmac_start = cipher_end;
    uint16_t hmac_end   = in_length;

    for (int i = 0; i < IV_LENGTH; i++) {
        iv[i] = in[i + iv_start];
    }

    for (int i = 0; i < cipher_length; i++) {
        cipher[i] = in[i + cipher_start];
    }

    for (int i = 0; i < HMAC_LENGTH; i++) {
        received_hmac[i] = in[i + hmac_start];
    }

    hmac_sha256_wrapper(in, cipher_end, computed_hmac, HMAC_LENGTH);

    volatile uint8_t hmac_matching = 1;
    for (uint16_t i = 0; i < HMAC_LENGTH; i++) {
        if (received_hmac[i] != computed_hmac[i]) {
            hmac_matching = 0;
        }
    }

    if (is_debug()) {
        Serial.println("DECRYPTING MESSAGE");

        Serial.print("IV: ");
        print_hex(iv, IV_LENGTH);
        
        Serial.print("CIPHER: ");
        print_hex(cipher, cipher_length);

        Serial.print("RECEIVED HMAC: ");
        print_hex(received_hmac, HMAC_LENGTH);
    }

    if (!hmac_matching) {
        if (is_debug()) Serial.println("DECRYPT ABORTED, HMAC IS NOT MATCHING");
        return -1;
    }

    return aes_decrypt(in + cipher_start, cipher_length, iv, out);
}

uint16_t comm_encrypt_msg(uint8_t *in, uint16_t in_length, uint8_t *out) {
    uint8_t iv[IV_LENGTH];

    for (uint8_t i = 0; i < IV_LENGTH; i++) {
        iv[i] = rand();
    }

    uint8_t cipher[CIPHERTEXT_MAX_LENGTH];
    uint8_t hmac[HMAC_LENGTH];

    uint16_t cipher_length = aes_encrypt(in, in_length, iv, cipher);

    uint16_t iv_start = 0;
    uint16_t iv_end   = IV_LENGTH;

    uint16_t cipher_start = iv_end;
    uint16_t cipher_end   = cipher_start + cipher_length;

    uint16_t hmac_start = cipher_end;
    uint16_t hmac_end   = hmac_start + HMAC_LENGTH;

    for (uint16_t i = 0; i < IV_LENGTH; i++) {
        out[i + iv_start] = iv[i];
    }

    for (uint16_t i = 0; i < cipher_length; i++) {
        out[i + cipher_start] = cipher[i];
    }

    hmac_sha256_wrapper(out, cipher_end, hmac, HMAC_LENGTH);

    for (uint16_t i = 0; i < HMAC_LENGTH; i++) {
        out[i + hmac_start] = hmac[i];
    }

    return hmac_end;
}
