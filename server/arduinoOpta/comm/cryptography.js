'use strict';

import { createCipheriv, createDecipheriv, createHmac } from 'node:crypto';

export function aesDecrypt(input, key, iv) {
    let cipher = createDecipheriv('aes-256-cbc', key, iv);
    return Buffer.concat([
        cipher.update(input),
        cipher.final()
    ]);
}

export function aesEncrypt(input, key, iv) {
    let cipher = createCipheriv('aes-256-cbc', key, iv);
    return Buffer.concat([
        cipher.update(input),
        cipher.final()
    ]);
}

export function computeHmac(input, key) {
    return createHmac('sha256', key)
            .update(input)
            .digest();
}
