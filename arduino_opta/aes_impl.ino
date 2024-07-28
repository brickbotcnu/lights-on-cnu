#include "aes.h"
#include "aes_impl.h"
#include "aes_key.h"

static struct AES_ctx aes_ctx;

uint16_t aes_decrypt(uint8_t in[], uint16_t in_len, uint8_t iv[], uint8_t out[]) {
    for (uint16_t i = 0; i < in_len; i++) {
        out[i] = in[i];
    }

    uint16_t out_len = in_len;

    AES_init_ctx_iv(&aes_ctx, AES_KEY, iv);
    AES_CBC_decrypt_buffer(&aes_ctx, out, out_len);

    out_len = in_len - out[out_len - 1];  // sometimes we do a little trolling (remove padding bytes)
    out[out_len] = 0;

    return out_len;
}

uint16_t aes_encrypt(uint8_t in[], uint16_t in_len, uint8_t iv[], uint8_t out[]) {
    for (uint16_t i = 0; i < in_len; i++) {
        out[i] = in[i];
    }

    uint16_t out_len = (in_len / 16 + 1) * 16;

    uint16_t bytes_to_add = out_len - in_len;
    for (uint16_t i = in_len; i < out_len; i++) {
        out[i] = bytes_to_add; // add padding bytes (PKCS7 standard)
    }

    AES_init_ctx_iv(&aes_ctx, AES_KEY, iv);
    AES_CBC_encrypt_buffer(&aes_ctx, out, out_len);

    out[out_len] = 0;

    return out_len;
}
