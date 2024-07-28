import { decryptArduinoMsg, encryptServerMsg } from '#root/arduinoOpta/comm/encryption.js';
import { createArduinoMsg, createServerMsg } from '#root/arduinoOpta/comm/msgFactory.js';
import { ArduinoMessageType, ServerMessageType } from '#root/arduinoOpta/comm/msgTypes.js';
import { arduinoTcpSocketWrite } from '#root/arduinoOpta/comm/tcpSockets.js';
import { getCurrTimestamp } from '#root/arduinoOpta/comm/util.js';
import { getArduinoOptaFromId } from '#root/arduinoOpta/factory.js';
import { RELAYS_PER_ARDUINO_OPTA } from '#root/const.js';
import { socketIoSetRelayStates } from '#root/socketIo.js';

const ARDUINO_MSG_TIMESTAMP_MAX_DIFF = 5;

export function recvArduinoMsg(encryptedMsg) {
    const decryptedMsg = decryptArduinoMsg(encryptedMsg);
    if (decryptedMsg < 0) {
        // console.log(`INVALID ARDUINO MSG BUFFER`);
        return;
    }

    const arduinoMsg = createArduinoMsg(decryptedMsg);
    const arduinoId = arduinoMsg.getArduinoId();
    const arduinoOpta = getArduinoOptaFromId(arduinoId);

    if (arduinoMsg.getCounter() < arduinoOpta.getArduinoMsgCounter()) {
        // console.log(`INVALID API COUNTER`);
        return;
    }

    if (getCurrTimestamp() - arduinoMsg.getTimestamp() > ARDUINO_MSG_TIMESTAMP_MAX_DIFF) {
        // console.log(`INVALID TIMESTAMP`);
        return;
    }

    if (arduinoMsg.getType() == ArduinoMessageType.ARDUINO_SET_RELAYS) {
        for (let arduinoRelay = 0; arduinoRelay < RELAYS_PER_ARDUINO_OPTA; arduinoRelay++) {
            const relayState = (arduinoMsg.getExtraField() >> arduinoRelay) & 1 ? true : false;
            arduinoOpta.setRelayState(arduinoRelay, relayState);
        }

        socketIoSetRelayStates();
    }

    // console.log(`ArduinoMessage OPTA #${arduinoId} ID #${arduinoOpta.getArduinoMsgCounter()} <= ${decryptedMsg.toString('hex')}`);

    arduinoOpta.incrArduinoMsgCounter();
}

export function sendServerMsg(arduinoId, type, callback) {
    const arduinoOpta = getArduinoOptaFromId(arduinoId);

    let extraField;
    if (type == ServerMessageType.SERVER_SET_RELAY_STATES) {
        extraField = 0;
        for (let relay = 0; relay < RELAYS_PER_ARDUINO_OPTA; relay++) {
            if (arduinoOpta.getRelayState(relay)) {
                extraField |= 1 << relay;
            }
        }
    } else if (type == ServerMessageType.SERVER_SET_RELAY_LOCKS) {
        extraField = 0;
        for (let relay = 0; relay < RELAYS_PER_ARDUINO_OPTA; relay++) {
            if (arduinoOpta.getRelayLock(relay)) {
                extraField |= 1 << relay;
            }
        }
    }

    const serverMsg = createServerMsg(arduinoOpta.getServerMsgCounter(), type, extraField);
    const encryptedMsg = encryptServerMsg(serverMsg);

    const arduinoServerMsgCounterAtSend = arduinoOpta.getServerMsgCounter();
    arduinoTcpSocketWrite(arduinoId, encryptedMsg, callback);
    arduinoOpta.incrServerMsgCounter();

    // console.log(`ServerMessage OPTA #${arduinoId} ID #${arduinoServerMsgCounterAtSend} => ${encryptedMsg.toString('hex')}`);
}
