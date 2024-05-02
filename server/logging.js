'use strict';

export function log(msg) {
    let date = new Date();
    console.log(`[${date.toLocaleDateString()} ${date.toLocaleTimeString()}] ${msg}`);
}
