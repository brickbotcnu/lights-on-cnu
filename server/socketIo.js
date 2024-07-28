import { parse } from 'cookie';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';

import { sendServerMsg } from '#root/arduinoOpta/comm/comm.js';
import { ServerMessageType } from '#root/arduinoOpta/comm/msgTypes.js';
import { getArduinoOptaFromId } from '#root/arduinoOpta/factory.js';
import { getRelayLocks, getRelayStates, setAllRelayLocks, setRelayLock, setRelayState } from '#root/arduinoOpta/hardware.js';
import { ARDUINO_OPTA_COUNT, RELAY_COUNT } from '#root/const.js';
import dbPool from '#root/databasePool.js';

const ARDUINO_STATUS_TEST_INTERVAL = 5000;
const arduinoStatuses = Array(ARDUINO_OPTA_COUNT).fill(false);

let relayLocksBeforeLockAll = Array(RELAY_COUNT).fill(false);
let relayLockAll = false;

let io;

export function createSocketIoApp(httpServer) {

io = new Server(httpServer);

io.engine.use(async (req, res, next) => {
    const isHandshake = req._query.sid === undefined;
    if (!isHandshake) {
        return next();
    }
    
    if (req.headers.cookie === undefined) {
        return next(new Error('No session ID cookie'));
    }
    const cookies = parse(req.headers.cookie);
    const sessionId = cookieParser.signedCookie(cookies.sessionId, process.env.COOKIE_SECRET);
    if (sessionId === false) {
        return next(new Error('Invalid session ID signature'));
    }

    const dbConn = await dbPool.getConnection();
    const searchSessionQuery = 'SELECT `sessionId`, `user` FROM `sessions` WHERE `sessionId` = ?';
    const searchSessionResult = await dbConn.query(searchSessionQuery, sessionId);

    if (dbConn) dbConn.release();

    if (searchSessionResult.length == 1) {
        const session = searchSessionResult[0];
        req.session = {};
        Object.assign(req.session, session);
        return next();
    } else {
        return next(new Error('Expired session ID'));
    }
});

io.on('connection', socket => {
    // console.log('socket.io conn from ' + socket.request.session.user + ' (' + socket.request.session.sessionId + ')');

    // socket.on('disconnect', () => {
    //     console.log('socket.io disc from ' + socket.request.session.user + ' (' + socket.request.session.sessionId + ')');
    // });

    socket.emit('server-setInitialState', {
        relayStates: getRelayStates(),
        relayLocks: getRelayLocks(),
        relayLockAll: relayLockAll,
        arduinoStatuses: arduinoStatuses
    });

    socket.on('client-setRelayState', data => {
        if (!Number.isInteger(data.relayId) || data.relayId < 0 || data.relayId > RELAY_COUNT - 1) {
            // console.log('invalid relay id');
            return;
        }

        if (typeof data.relayState !== 'boolean') {
            // console.log('invalid relay state');
            return;
        }

        setRelayState(data.relayId, data.relayState);
        socket.broadcast.emit('server-setRelayStates', getRelayStates());
    });

    socket.on('client-setRelayLock', data => {
        if (!Number.isInteger(data.relayId) || data.relayId < 0 || data.relayId > RELAY_COUNT - 1) {
            // console.log('invalid relay id');
            return;
        }

        if (typeof data.relayLock !== 'boolean') {
            // console.log('invalid lock state');
            return;
        }

        if (relayLockAll) {
            setAllRelayLocks(relayLocksBeforeLockAll);
        }

        setRelayLock(data.relayId, data.relayLock);

        if (relayLockAll) {
            relayLockAll = false;
            io.emit('server-setRelayLockAll', false);
            io.emit('server-setRelayLocks', getRelayLocks());
        } else {
            socket.broadcast.emit('server-setRelayLocks', getRelayLocks());   
        }
    });

    socket.on('client-setRelayLockAll', clientRelayLockAll => {
        if (typeof clientRelayLockAll !== 'boolean') {
            // console.log('invalid relay lock all value');
            return;
        }

        relayLockAll = clientRelayLockAll;

        if (relayLockAll) {
            relayLocksBeforeLockAll = getRelayLocks();
            setAllRelayLocks(Array(RELAY_COUNT).fill(true));
        } else {
            setAllRelayLocks(relayLocksBeforeLockAll);
        }

        socket.broadcast.emit('server-setRelayLockAll', relayLockAll);
        io.emit('server-setRelayLocks', getRelayLocks());
    });
});

setInterval(() => {
    for (let arduinoId = 0; arduinoId < ARDUINO_OPTA_COUNT; arduinoId++) {
        sendServerMsg(arduinoId, ServerMessageType.SERVER_CONN_TEST, success => {
            arduinoStatuses[arduinoId] = success;
        });
    }

    io.emit('server-setArduinoStatuses', arduinoStatuses);
}, ARDUINO_STATUS_TEST_INTERVAL);

}

export function socketIoSetRelayStates() {
    io.emit('server-setRelayStates', getRelayStates());
}
