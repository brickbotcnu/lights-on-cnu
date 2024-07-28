import { randomBytes, timingSafeEqual } from 'crypto';

import { getAesKey, getHmacKey } from '#root/arduinoOpta/comm/keys.js';
import { aesDecrypt, aesEncrypt, computeHmac } from '#root/arduinoOpta/comm/cryptography.js';

const IV_LENGTH = 16;
const HMAC_LENGTH = 32;

export function decryptArduinoMsg(msgBuffer) {
    const ivStart = 0;
    const ivEnd   = IV_LENGTH;
    const cipherStart = ivEnd;
    const cipherEnd   = msgBuffer.length - HMAC_LENGTH;
    const hmacStart = cipherEnd;
    const hmacEnd   = msgBuffer.length;

    const iv           = msgBuffer.subarray(ivStart, ivEnd);
    const cipher       = msgBuffer.subarray(cipherStart, cipherEnd);
    const receivedHmac = msgBuffer.subarray(hmacStart, hmacEnd);

    const computedHmac = computeHmac(Buffer.concat([iv, cipher]), getHmacKey());

    if (!timingSafeEqual(receivedHmac, computedHmac)) {
        // console.log('INVALID HMAC');
        return -1;
    }

    return aesDecrypt(cipher, getAesKey(), iv);
}

export function encryptServerMsg(msgBuffer) {
    const iv     = randomBytes(IV_LENGTH);
    const cipher = aesEncrypt(msgBuffer, getAesKey(), iv);

    const hmac = computeHmac(Buffer.concat([iv, cipher]), getHmacKey());

    return Buffer.concat([iv, cipher, hmac]);
}
