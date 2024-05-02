'use strict';

import net from 'node:net';

import { getArduinoDeviceFromId } from './deviceFactory.js';
import { recvArduinoMsg } from './comm/comm.js';

import { log } from '../logging.js';

const TCP_SOCKET_ARDUINO_PORT = 9090;
const TCP_SOCKET_SERVER_PORT  = 9091;

const TCP_SOCKET_SERVER_MSG_TIMEOUT = 5000;

export function arduinoTcpSocketsInit() {
    const server = net.createServer(client => {
        log('TCP SOCKET CONNECTED');
    
        client.on('data', data => recvArduinoMsg(data));
    });

    server.on('error', error => {
        server.close();

        log(`TCP SOCKET SERVER ERROR ${error}`);
    });

    server.listen(TCP_SOCKET_SERVER_PORT, () => {
        log(`TCP SOCKET SERVER LISTENING ON PORT ${TCP_SOCKET_SERVER_PORT}`);
    });
}

export function arduinoTcpSocketSendServerMsg(arduinoId, encryptedMsg, serverMsgCounter) {
    const client = net.createConnection(
    {
        host: getArduinoDeviceFromId(arduinoId).getIp(),
        port: TCP_SOCKET_ARDUINO_PORT,
        timeout: TCP_SOCKET_SERVER_MSG_TIMEOUT
    },
    () => {
        client.write(encryptedMsg);
        client.end();

        log(`ServerMessage OPTA #${arduinoId} ID #${serverMsgCounter} => SUCCESS`);
    });

    client.on('timeout', () => {
        client.destroy();

        log(`ServerMessage OPTA #${arduinoId} ID #${serverMsgCounter} => SOCKET TIMEOUT`);
    });

    client.on('error', error => {
        log(`ServerMessage OPTA #${arduinoId} ID #${serverMsgCounter} => ERROR ${error.message}`);
    });
}
