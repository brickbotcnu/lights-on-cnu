import 'dotenv/config';

import { readFileSync } from 'fs';
import http from 'http';
import https from 'https';
import { join } from 'path';

import { arduinoOptaFactoryInit } from '#root/arduinoOpta/factory.js';
import { tcpSocketServerInit } from '#root/arduinoOpta/comm/tcpSockets.js';
import app from '#root/express/app.js';
import secureRedirectApp from '#root/express/secureRedirectApp.js';
import { createSocketIoApp } from '#root/socketIo.js';

function dropPriv() {
    if (process.env.DROP_PRIV == 'yes') {
        process.setgid(process.env.DROP_PRIV_GID);
        process.setuid(process.env.DROP_PRIV_UID);
        console.log('Dropped privileges');
    }
}

arduinoOptaFactoryInit();
tcpSocketServerInit();

const USE_HTTPS = process.env.HTTPS_ENABLED == 'yes';

let httpServer;
if (USE_HTTPS) {
    httpServer = http.createServer(secureRedirectApp);
} else {
    httpServer = http.createServer(app);
}

httpServer.listen(process.env.HTTP_PORT, () => {
    console.log(`HTTP server listening on port ${process.env.HTTP_PORT}`);

    if (USE_HTTPS) {
        const httpsServer = https.createServer({
            key: readFileSync(join('./express/cert/', process.env.HTTPS_KEY_FILENAME)),
            cert: readFileSync(join('./express/cert/', process.env.HTTPS_CERT_FILENAME))
        }, app);

        createSocketIoApp(httpsServer);

        httpsServer.listen(process.env.HTTPS_PORT, () => {
            console.log(`HTTPS server listening on port ${process.env.HTTPS_PORT}`);
            dropPriv();
        });
    } else {
        createSocketIoApp(httpServer);
        dropPriv();
    }
});
