import { RELAYS_PER_ARDUINO_OPTA } from '#root/const.js';

export class ArduinoOpta {
    #ip;

    #relayStates;
    #relayLocks;

    #arduinoMsgCounter;
    #serverMsgCounter;

    constructor(ip) {
        this.#ip = ip;

        this.#relayStates = Array(RELAYS_PER_ARDUINO_OPTA).fill(false);
        this.#relayLocks = Array(RELAYS_PER_ARDUINO_OPTA).fill(false);

        this.#arduinoMsgCounter = 0;
        this.#serverMsgCounter = 0;
    }

    getIp() {
        return this.#ip;
    }

    getRelayState(relay) {
        return this.#relayStates[relay];
    }

    getRelayStates() {
        return this.#relayStates.slice();
    }

    setRelayState(relay, state) {
        this.#relayStates[relay] = state;
    }

    getRelayLock(relay) {
        return this.#relayLocks[relay];
    }

    setRelayLock(relay, lockState) {
        this.#relayLocks[relay] = lockState;
    }

    getArduinoMsgCounter() {
        return this.#arduinoMsgCounter;
    }

    incrArduinoMsgCounter() {
        this.#arduinoMsgCounter++;
    }

    getServerMsgCounter() {
        return this.#serverMsgCounter;
    }

    incrServerMsgCounter() {
        this.#serverMsgCounter++;
    }
}
