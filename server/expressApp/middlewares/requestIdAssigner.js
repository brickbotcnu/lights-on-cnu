'use strict';

import { log } from '../../logging.js';

let request_id = 0;

export function assignRequestId(req, res, next) {
    req.id = request_id++;
    log(`REQUEST INCOMING from ${req.ip} with ID #${req.id}`);
    next();
}
