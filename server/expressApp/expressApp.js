'use strict';

import express from 'express';

import { assignRequestId } from './middlewares/requestIdAssigner.js';
import { homeRoute } from './routes/homeRouter.js';

export function expressInit(app) {
    app.use('/', express.static('./expressApp/static'));
    app.use('*', assignRequestId);
    
    app.get('/api', (req, res) => res.sendStatus(301));

    app.get('/', (req, res) => res.redirect('/home'));
    app.get('/home', homeRoute);
    
    app.get('*', (req, res) => res.sendStatus(404));
}
