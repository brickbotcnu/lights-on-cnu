import { sendServerMsg } from '#root/arduinoOpta/comm/comm.js';
import { ServerMessageType } from '#root/arduinoOpta/comm/msgTypes.js';
import { getArduinoOptaFromId, getArduinoOptas } from '#root/arduinoOpta/factory.js';
import { ARDUINO_OPTA_COUNT, RELAY_COUNT, RELAYS_PER_ARDUINO_OPTA } from '#root/const.js';

function getArduinoIdFromAppRelayId(appRelayId) {
    return Math.floor(appRelayId / RELAYS_PER_ARDUINO_OPTA);
}

function getArduinoRelayFromAppRelayId(appRelayId) {
    return appRelayId % RELAYS_PER_ARDUINO_OPTA;
}

export function getAppRelayIdFromArduinoIdAndRelay(arduinoId, arduinoRelay) {
    return arduinoId * RELAYS_PER_ARDUINO_OPTA + arduinoRelay - 1;
}

export function getRelayStates() {
    let relayStates = [];
    
    getArduinoOptas().forEach(arduinoOpta => {
        relayStates = relayStates.concat(arduinoOpta.getRelayStates());
    });

    return relayStates;
}

export function setRelayState(appRelayId, relayState) {
    const arduinoId = getArduinoIdFromAppRelayId(appRelayId);
    const arduinoOpta = getArduinoOptaFromId(arduinoId);
    const arduinoRelayId = getArduinoRelayFromAppRelayId(appRelayId);
    
    arduinoOpta.setRelayState(arduinoRelayId, relayState);

    sendServerMsg(arduinoId, ServerMessageType.SERVER_SET_RELAY_STATES);
}

const relayLocks = Array(RELAY_COUNT).fill(false);

export function getRelayLocks() {
    return relayLocks.slice();
}

export function setRelayLock(appRelayId, relayLock) {
    relayLocks[appRelayId] = relayLock;

    const arduinoId = getArduinoIdFromAppRelayId(appRelayId);
    const arduinoOpta = getArduinoOptaFromId(arduinoId);
    const arduinoRelayId = getArduinoRelayFromAppRelayId(appRelayId);
    
    arduinoOpta.setRelayLock(arduinoRelayId, relayLock);

    sendServerMsg(arduinoId, ServerMessageType.SERVER_SET_RELAY_LOCKS);
}

export function setAllRelayLocks(allRelayLocks) {
    for (let appRelayId = 0; appRelayId < RELAY_COUNT; appRelayId++) {
        relayLocks[appRelayId] = allRelayLocks[appRelayId];

        const arduinoId = getArduinoIdFromAppRelayId(appRelayId);
        const arduinoOpta = getArduinoOptaFromId(arduinoId);
        const arduinoRelayId = getArduinoRelayFromAppRelayId(appRelayId);
        
        arduinoOpta.setRelayLock(arduinoRelayId, allRelayLocks[appRelayId]);
    }

    for (let arduinoId = 0; arduinoId < ARDUINO_OPTA_COUNT; arduinoId++) {
        sendServerMsg(arduinoId, ServerMessageType.SERVER_SET_RELAY_LOCKS);
    }
}
