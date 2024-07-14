import { createServer } from 'node:http';

import express from 'express';
import { expressInit } from './expressApp/expressApp.js';

import { arduinoDeviceFactoryInit } from './arduinoOpta/deviceFactory.js';
import { arduinoTcpSocketsInit } from './arduinoOpta/tcpSockets.js';

import { socketIoInit, socketIoRegisterEvents } from './socketIoApp.js';

import { log } from './logging.js';

const HTTP_PORT = 8080;

const app = express();
const server = createServer(app);

arduinoDeviceFactoryInit();
arduinoTcpSocketsInit();

socketIoInit(server);
socketIoRegisterEvents();

expressInit(app);

server.listen(HTTP_PORT, () => log(`EXPRESS LISTENING ON PORT ${HTTP_PORT}`));
