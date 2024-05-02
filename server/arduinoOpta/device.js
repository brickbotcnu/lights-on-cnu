'use strict';

export class ArduinoDevice {
    static RELAY_COUNT = 4;

    #ip;

    #relays;
    #locks;
    #redLed;

    #arduinoMsgCounter;
    #serverMsgCounter;

    constructor(ip) {
        this.#ip = ip;

        this.#relays = Array(ArduinoDevice.RELAY_COUNT).fill(0);
        this.#locks = Array(ArduinoDevice.RELAY_COUNT).fill(0);
        this.#redLed = 0;

        this.#arduinoMsgCounter = 0;
        this.#serverMsgCounter = 0;
    }

    getIp() {
        return this.#ip;
    }

    getRelay(relay) {
        return this.#relays[relay];
    }

    getRelays() {
        return this.#relays;
    }

    setRelay(relay, state) {
        this.#relays[relay] = state;
    }

    getLock(relay) {
        return this.#locks[relay];
    }

    getLocks() {
        return this.#locks;
    }

    setLock(relay, state) {
        this.#locks[relay] = state;
    }

    getRedLed() {
        return this.#redLed;
    }

    setRedLed(state) {
        this.#redLed = state;
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
