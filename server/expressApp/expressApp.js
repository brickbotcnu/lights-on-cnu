'use strict';

import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assignRequestId } from './middlewares/requestIdAssigner.js';
import { homeRoute } from './routes/homeRouter.js';

export function expressInit(app) {
    const directoryName = dirname(fileURLToPath(import.meta.url));
    app.use('/', express.static(join(directoryName, './static')));
    app.use('*', assignRequestId);
    
    app.get('/api', (req, res) => res.sendStatus(301));

    app.get('/', (req, res) => res.redirect('/home'));
    app.get('/home', homeRoute);
    
    app.get('*', (req, res) => res.sendStatus(404));
}
