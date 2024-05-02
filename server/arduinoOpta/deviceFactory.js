'use strict';

import fs from 'node:fs';

import { ArduinoDevice } from './device.js';

export const ARDUINO_COUNT = 3;

const ARDUINO_IP_ADDRS = [
    '192.168.0.1',
    '192.168.0.199',
    '192.168.11.167'
];

const arduinoDevices = Array(ARDUINO_COUNT);

export function arduinoDeviceFactoryInit() {
    for (let arduinoId = 0; arduinoId < ARDUINO_COUNT; arduinoId++) {
        arduinoDevices[arduinoId] = new ArduinoDevice(ARDUINO_IP_ADDRS[arduinoId]);
    }
}

export function getArduinoDevices() {
    return arduinoDevices;
}

export function getArduinoDeviceFromId(arduinoId) {
    return arduinoDevices[arduinoId];
}
