import { Server } from 'socket.io';

import { ARDUINO_COUNT, getArduinoDeviceFromId } from './arduinoOpta/deviceFactory.js';
import { ARDUINO_TOTAL_RELAY_COUNT, getGlobalLocks, getGlobalRelays, getRedLeds, setGlobalLock, setGlobalLocks, setGlobalRelay, setRedLed } from './arduinoOpta/hardware.js';

import { log } from './logging.js';

import { createSession } from 'net-ping';

let io;

const pingSession = createSession();

let lockAll = 0;
let globalLocksBeforeLockAll;

let arduinoStates = [0, 0, 0];
let arduinoStatesUpdated = false;

import { uptime } from 'node:os';

/**
 * Initialize the Socket.IO server
 * @param server
 */
export function socketIoInit(server) {
    io = new Server(server);
}

/**
 * Register Socket.IO events
 */
export function socketIoRegisterEvents() {
    io.on('connection', socket => {
        log('SOCKET CONNECTED');

        socket.emit('SERVER_SET_RELAYS', getGlobalRelays());
        socket.emit('SERVER_SET_LOCKS', getGlobalLocks());
        socket.emit('SERVER_SET_LOCK_ALL', lockAll);
        socket.emit('SERVER_SET_RED_LEDS', getRedLeds());
        socket.emit('SERVER_SET_ARDUINO_STATES', arduinoStates);
        socket.emit('SERVER_SET_LAST_BOOT', getLastBoot());

        socket.on('CLIENT_SET_RELAY', data => {
            log(`CLIENT_SET_RELAY EVENT data=${JSON.stringify(data)}`);

            if (!Number.isInteger(data.relay) || data.relay < 0 || data.relay > ARDUINO_TOTAL_RELAY_COUNT - 1) {
                log('INVALID RELAY NUMBER');
                return;
            }

            if (data.state !== 0 && data.state !== 1) {
                log('INVALID RELAY STATE');
                return;
            }
            
            setGlobalRelay(data.relay, data.state);

            socket.broadcast.emit('SERVER_SET_RELAYS', getGlobalRelays());
        });

        socket.on('CLIENT_SET_LOCK', data => {
            log(`CLIENT_SET_LOCK EVENT data=${JSON.stringify(data)}`);

            if (!Number.isInteger(data.lock) || data.lock < 0 || data.lock > ARDUINO_TOTAL_RELAY_COUNT - 1) {
                log('INVALID LOCK NUMBER');
                return;
            }

            if (data.state !== 0 && data.state !== 1) {
                log('INVALID LOCK STATE');
                return;
            }

            if (lockAll) {
                setGlobalLocks(globalLocksBeforeLockAll);
            }
            
            setGlobalLock(data.lock, data.state);

            if (lockAll) {
                lockAll = 0;
                io.emit('SERVER_SET_LOCK_ALL', lockAll);
                io.emit('SERVER_SET_LOCKS', getGlobalLocks());
            } else {
                socket.broadcast.emit('SERVER_SET_LOCKS', getGlobalLocks());
            }
        });

        socket.on('CLIENT_SET_LOCK_ALL', data => {
            log(`CLIENT_SET_LOCK_ALL EVENT data=${JSON.stringify(data)}`);

            if (data.state !== 0 && data.state !== 1) {
                log('INVALID LOCK ALL STATE');
                return;
            }

            lockAll = data.state;

            if (lockAll == 0) {
                setGlobalLocks(globalLocksBeforeLockAll);
            } else if (lockAll == 1) {
                globalLocksBeforeLockAll = getGlobalLocks();

                setGlobalLocks(Array(ARDUINO_TOTAL_RELAY_COUNT).fill(1));
            }
            
            socket.broadcast.emit('SERVER_SET_LOCK_ALL', lockAll);
            io.emit('SERVER_SET_LOCKS', getGlobalLocks());
        });

        socket.on('CLIENT_SET_RED_LED', data => {
            log(`CLIENT_SET_RELAY EVENT data=${JSON.stringify(data)}`);

            if (!Number.isInteger(data.arduinoId) || data.arduinoId < 0 || data.arduinoId > ARDUINO_TOTAL_RELAY_COUNT - 1) {
                log('INVALID RED LED OPTA ID');
                return;
            }

            if (data.state !== 0 && data.state !== 1) {
                log('INVALID RELAY STATE');
                return;
            }

            setRedLed(data.arduinoId, data.state);
            
            socket.broadcast.emit('SERVER_SET_RED_LEDS', getRedLeds());
        });
    });

    setInterval(() => {
        for (let arduinoId = 0; arduinoId < ARDUINO_COUNT; arduinoId++) {
            pingSession.pingHost(getArduinoDeviceFromId(arduinoId).getIp(), error => {
                let pingResult = error ? 0 : 1;

                if (pingResult != arduinoStates[arduinoId]) {
                    arduinoStates[arduinoId] = pingResult;
                    arduinoStatesUpdated = true;
                }
            });
        }

        if (arduinoStatesUpdated) {
            arduinoStatesUpdated = false;
            io.emit('SERVER_SET_ARDUINO_STATES', arduinoStates);
        }
    }, 1000);
}

export function socketIoTriggerRelaysUpdate() {
    io.emit('SERVER_SET_RELAYS', getGlobalRelays());
}

function getLastBoot() {
    let d = new Date(new Date().getTime() - Math.floor(uptime()) * 1000);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}
