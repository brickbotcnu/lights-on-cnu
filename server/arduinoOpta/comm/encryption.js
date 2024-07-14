import { randomBytes, timingSafeEqual } from 'node:crypto';

import { aesDecrypt, aesEncrypt, computeHmac } from './cryptography.js';

import { log } from '../../logging.js';
import { getAesKey, getHmacKey } from '../keys/keys.js';

const IV_LENGTH = 16;
const HMAC_LENGTH = 32;

export function decryptArduinoMsg(msgBuffer) {
    const length = msgBuffer.length;

    const ivStart = 0;
    const ivEnd   = IV_LENGTH;
    const cipherStart = ivEnd;
    const cipherEnd   = length - HMAC_LENGTH;
    const hmacStart = cipherEnd;
    const hmacEnd   = length;

    const iv           = msgBuffer.subarray(ivStart, ivEnd);
    const cipher       = msgBuffer.subarray(cipherStart, cipherEnd);
    const receivedHmac = msgBuffer.subarray(hmacStart, hmacEnd);

    const computedHmac = computeHmac(Buffer.concat([iv, cipher]), getHmacKey());

    if (!timingSafeEqual(receivedHmac, computedHmac)) {
        log('INVALID HMAC');
        return -1;
    }

    return aesDecrypt(cipher, getAesKey(), iv);
}

export function encryptServerMsg(msgBuffer) {
    // Encrypt-then-MAC
    // https://crypto.stackexchange.com/questions/202/should-we-mac-then-encrypt-or-encrypt-then-mac

    const iv     = randomBytes(IV_LENGTH);
    const cipher = aesEncrypt(msgBuffer, getAesKey(), iv);

    const hmac = computeHmac(Buffer.concat([iv, cipher]), getHmacKey());

    return Buffer.concat([iv, cipher, hmac]);
}
