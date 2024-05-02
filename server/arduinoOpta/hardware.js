'use strict';

import { ArduinoDevice } from './device.js';
import { ARDUINO_COUNT, getArduinoDeviceFromId, getArduinoDevices } from './deviceFactory.js';

import { sendServerMsg } from './comm/comm.js';
import { ServerMessageType } from './comm/msgTypes.js';

export const ARDUINO_TOTAL_RELAY_COUNT = ArduinoDevice.RELAY_COUNT * ARDUINO_COUNT;

function getArduinoIdFromGlobalRelay(globalRelay) {
    return Math.floor(globalRelay / ArduinoDevice.RELAY_COUNT);
}

function getArduinoRelayFromGlobalRelay(globalRelay) {
    return globalRelay % ArduinoDevice.RELAY_COUNT;
}

export function getGlobalRelays() {
    let relays = [];
    
    getArduinoDevices().forEach(arduinoDevice => {
        relays = relays.concat(arduinoDevice.getRelays());
    });

    return relays;
}

export function setGlobalRelay(globalRelay, state) {
    const arduinoId     = getArduinoIdFromGlobalRelay(globalRelay);
    const arduinoRelay  = getArduinoRelayFromGlobalRelay(globalRelay);
    const arduinoDevice = getArduinoDeviceFromId(arduinoId);
    
    arduinoDevice.setRelay(arduinoRelay, state);

    sendServerMsg(arduinoId, ServerMessageType.SERVER_SET_RELAYS);
}

export function getGlobalLocks() {
    let locks = [];
    
    getArduinoDevices().forEach(arduinoDevice => {
        locks = locks.concat(arduinoDevice.getLocks());
    });

    return locks;
}

export function setGlobalLock(globalRelay, state) {
    const arduinoId     = getArduinoIdFromGlobalRelay(globalRelay);
    const arduinoRelay  = getArduinoRelayFromGlobalRelay(globalRelay);
    const arduinoDevice = getArduinoDeviceFromId(arduinoId);
    
    arduinoDevice.setLock(arduinoRelay, state);

    sendServerMsg(arduinoId, ServerMessageType.SERVER_SET_LOCKS);
}

export function setGlobalLocks(globalLocks) {
    for (let globalRelay = 0; globalRelay < ARDUINO_TOTAL_RELAY_COUNT; globalRelay++) {
        const arduinoId     = getArduinoIdFromGlobalRelay(globalRelay);
        const arduinoRelay  = getArduinoRelayFromGlobalRelay(globalRelay);

        const arduinoDevice = getArduinoDeviceFromId(arduinoId);
        
        arduinoDevice.setLock(arduinoRelay, globalLocks[globalRelay]);
    }

    for (let arduinoId = 0; arduinoId < ARDUINO_COUNT; arduinoId++) {
        sendServerMsg(arduinoId, ServerMessageType.SERVER_SET_LOCKS);
    }
}

export function getRedLeds() {
    let redLeds = [];

    getArduinoDevices().forEach(arduinoDevice => {
        redLeds.push(arduinoDevice.getRedLed());
    });

    return redLeds;
}

export function setRedLed(arduinoId, state) {
    const arduinoDevice = getArduinoDeviceFromId(arduinoId);

    arduinoDevice.setRedLed(state);

    sendServerMsg(arduinoId, ServerMessageType.SERVER_SET_RED_LED);
}
