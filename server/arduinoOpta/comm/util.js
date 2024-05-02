'use strict';

export function getTimestamp() {
    return Math.floor(+new Date() / 1000);
}
