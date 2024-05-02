'use strict';

import fs from 'node:fs';

const AES_KEY = Buffer.from(fs.readFileSync(new URL('./aes_key.dat', import.meta.url), { encoding: 'utf-8' }), 'hex');
const HMAC_KEY = Buffer.from(fs.readFileSync(new URL('./hmac_key.dat', import.meta.url), { encoding: 'utf-8' }), 'hex');

export function getAesKey() {
    return AES_KEY;
}

export function getHmacKey() {
    return HMAC_KEY;
}
