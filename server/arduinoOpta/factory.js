import { ArduinoOpta } from '#root/arduinoOpta/arduinoOpta.js';
import { ARDUINO_OPTA_COUNT } from '#root/const.js';

const ARDUINO_IP_ADDRS = process.env.ARDUINO_OPTA_IP_ADDRS.split(' ');

const arduinoOptas = Array(ARDUINO_OPTA_COUNT);

export function arduinoOptaFactoryInit() {
    for (let id = 0; id < ARDUINO_OPTA_COUNT; id++) {
        arduinoOptas[id] = new ArduinoOpta(ARDUINO_IP_ADDRS[id]);
    }
}

export function getArduinoOptas() {
    return arduinoOptas;
}

export function getArduinoOptaFromId(id) {
    return arduinoOptas[id];
}
