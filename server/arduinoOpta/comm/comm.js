'use strict';

import { decryptArduinoMsg, encryptServerMsg } from './encryption.js';
import { createArduinoMsg, createServerMsg } from './msgFactory.js';
import { ArduinoMessageType, ServerMessageType } from './msgTypes.js';

import { getTimestamp } from './util.js';

import { ArduinoDevice } from '../device.js';
import { ARDUINO_COUNT, getArduinoDeviceFromId } from '../deviceFactory.js';
import { socketIoTriggerRelaysUpdate } from '../../socketIoApp.js';
import { arduinoTcpSocketSendServerMsg } from '../tcpSockets.js';

import { log } from '../../logging.js';
import { ARDUINO_TOTAL_RELAY_COUNT } from '../hardware.js';

const ARDUINO_MSG_TIMESTAMP_MAX_DIFF = 5;

export function recvArduinoMsg(encryptedMsg) {
    const msgBuffer = decryptArduinoMsg(encryptedMsg);
    
    console.log(msgBuffer);

    if (msgBuffer < 0) {
        log(`INVALID ARDUINO MSG BUFFER`);
        return;
    }

    const msg = createArduinoMsg(msgBuffer);

    const arduinoDevice = getArduinoDeviceFromId(msg.getArduinoId());

    if (msg.getCounter() < arduinoDevice.getArduinoMsgCounter()) {
        log(`INVALID API COUNTER`);
        return;
    }

    if (getTimestamp() - msg.getTimestamp() > ARDUINO_MSG_TIMESTAMP_MAX_DIFF) {
        log(`INVALID TIMESTAMP`);
        return;
    }

    arduinoDevice.incrArduinoMsgCounter();

    if (msg.getType() == ArduinoMessageType.ARDUINO_SET_RELAYS) {
        for (let relay = 0; relay < ArduinoDevice.RELAY_COUNT; relay++) {
            arduinoDevice.setRelay(relay, (msg.getExtraField() >> relay) & 1);
        }

        socketIoTriggerRelaysUpdate();
    }

    log(`ArduinoMessage OPTA #${msg.getArduinoId()} ID #${arduinoDevice.arduinoMsgCounter} <= ${msgBuffer.toString('hex')}`);
}

export function sendServerMsg(arduinoId, type) {
    const arduinoDevice = getArduinoDeviceFromId(arduinoId);

    let extraField;
    if (type == ServerMessageType.SERVER_SET_RELAYS) {
        extraField = 0;
        for (let relay = 0; relay < ARDUINO_TOTAL_RELAY_COUNT; relay++) {
            if (arduinoDevice.getRelay(relay)) {
                extraField |= 1 << relay;
            }
        }
    } else if (type == ServerMessageType.SERVER_SET_LOCKS) {
        extraField = 0;
        for (let lock = 0; lock < ARDUINO_TOTAL_RELAY_COUNT; lock++) {
            if (arduinoDevice.getLock(lock)) {
                extraField |= 1 << lock;
            }
        }
    } else if (type == ServerMessageType.SERVER_SET_RED_LED) {
        extraField = arduinoDevice.getRedLed();
    }

    const msg = createServerMsg(arduinoDevice.getServerMsgCounter(), type, extraField);
    const encryptedMsg = encryptServerMsg(msg);

    const arduinoServerMsgCounterAtSend = arduinoDevice.getServerMsgCounter();

    arduinoTcpSocketSendServerMsg(arduinoId, encryptedMsg, arduinoDevice.getServerMsgCounter());

    arduinoDevice.incrServerMsgCounter();

    log(`ServerMessage OPTA #${arduinoId} ID #${arduinoServerMsgCounterAtSend} => ${encryptedMsg.toString('hex')}`);
}
