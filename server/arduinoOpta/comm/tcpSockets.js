import net from 'net';

import { recvArduinoMsg } from '#root/arduinoOpta/comm/comm.js';
import { getArduinoOptaFromId } from '#root/arduinoOpta/factory.js';

const TCP_SOCKET_ARDUINO_PORT = 9090;
const TCP_SOCKET_SERVER_PORT  = 9091;

const TCP_SOCKET_ARDUINO_TIMEOUT = 5000;

export function tcpSocketServerInit() {
    const server = net.createServer(client => {    
        client.on('data', data => recvArduinoMsg(data));
    });

    server.on('error', error => {
        server.close();

        console.log(`TCP Socket server error: ${error}`);
    });

    server.listen(TCP_SOCKET_SERVER_PORT, () => {
        console.log(`TCP Socket server listening on port ${TCP_SOCKET_SERVER_PORT}`);
    });
}

export function arduinoTcpSocketWrite(arduinoId, buffer, callback) {
    const arduinoOpta = getArduinoOptaFromId(arduinoId);
    const serverMsgCounter = arduinoOpta.getServerMsgCounter();

    const client = net.createConnection({
        host: arduinoOpta.getIp(),
        port: TCP_SOCKET_ARDUINO_PORT,
        timeout: TCP_SOCKET_ARDUINO_TIMEOUT
    }, () => {
        client.write(buffer);
        client.end();
        // console.log(`ServerMessage OPTA #${arduinoId} ID #${serverMsgCounter} => SUCCESS`);
        if (callback) callback(true);
    });

    client.on('timeout', () => {
        client.destroy();
        // console.log(`ServerMessage OPTA #${arduinoId} ID #${serverMsgCounter} => SOCKET TIMEOUT`);
        if (callback) callback(false);
    });

    client.on('error', error => {
        client.destroy();
        // console.log(`ServerMessage OPTA #${arduinoId} ID #${serverMsgCounter} => ERROR ${error.message}`);
        if (callback) callback(false);
    });
}
