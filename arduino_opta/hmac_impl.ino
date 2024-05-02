#include "hmac_impl.h"
#include "hmac_key.h"
#include "hmac_sha256.h"
#include "sha256.h"

static const uint8_t HMAC_KEY_LEN = 64;

void hmac_sha256_wrapper(const void *in, const size_t in_len, void *out, const size_t out_len) {
    hmac_sha256(HMAC_KEY, HMAC_KEY_LEN, in, in_len, out, out_len);
}
