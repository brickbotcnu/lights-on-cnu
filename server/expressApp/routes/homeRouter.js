'use strict';

import { fileURLToPath } from 'node:url';

export function homeRoute(req, res, next) {
    res.sendFile(fileURLToPath(new URL('../views/home.html', import.meta.url)));
}
