'use strict';

import { getTimestamp } from './util.js';

class ArduinoMessage {
    #counter;
    #timestamp;
    #arduinoId;
    #type;
    #extraField;

    constructor(buffer) {
        this.#counter    = buffer.readUInt32LE(0);
        this.#timestamp  = buffer.readUInt32LE(4);
        this.#arduinoId  = buffer.readUInt8(8);
        this.#type       = buffer.readUInt8(9);
        this.#extraField = buffer.readUInt8(10);
    }

    getCounter()    { return this.#counter    }
    getTimestamp()  { return this.#timestamp  }
    getArduinoId()  { return this.#arduinoId  }
    getType()       { return this.#type       }
    getExtraField() { return this.#extraField }
}

class ServerMessage {
    #counter;
    #timestamp;
    #type;
    #extraField;

    setCounter(counter)       { this.#counter    = counter;    return this; }
    setTimestamp(timestamp)   { this.#timestamp  = timestamp;  return this; }
    setType(type)             { this.#type       = type;       return this; }
    setExtraField(extraField) { this.#extraField = extraField; return this; }

    toBuffer() {
        const buffer = Buffer.alloc(10);

        buffer.writeUInt32LE(this.#counter,    0);
        buffer.writeUInt32LE(this.#timestamp,  4);
        buffer.writeUInt8   (this.#type,       8);
        buffer.writeUInt8   (this.#extraField, 9);

        return buffer;
    }
};

export function createArduinoMsg(buffer) {
    return new ArduinoMessage(buffer);
}

export function createServerMsg(counter, type, extraField) {
    return new ServerMessage()
                .setCounter(counter)
                .setTimestamp(getTimestamp())
                .setType(type)
                .setExtraField(extraField)
                .toBuffer();
}
