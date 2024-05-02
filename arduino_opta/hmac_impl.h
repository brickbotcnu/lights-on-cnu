#pragma once

#include <stdint.h>

void hmac_sha256_wrapper(const void *in, const size_t in_len, void *out, const size_t out_len);
