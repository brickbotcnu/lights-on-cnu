const AES_KEY = Buffer.from(process.env.AES_KEY, 'hex');
const HMAC_KEY = Buffer.from(process.env.HMAC_KEY, 'hex');

export function getAesKey() {
    return AES_KEY;
}

export function getHmacKey() {
    return HMAC_KEY;
}
