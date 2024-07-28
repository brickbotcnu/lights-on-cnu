import { RELAY_COUNT } from '#root/const.js';
import dbPool from '#root/databasePool.js';

class ConfigRelay {
    constructor(id, name, category) {
        this.id = id;
        this.name = name;
        this.category = category;
    }
};

export async function getRelayConfiguration() {
    const relayConfiguration = Array(RELAY_COUNT).fill(null);

    const dbConn = await dbPool.getConnection();
    const selectAllRelays = 'SELECT * FROM `relays`';
    const relayRows = await dbConn.query(selectAllRelays);
    if (dbConn) dbConn.release();
    
    for (let relayId = 0; relayId < RELAY_COUNT; relayId++) {
        const relayRow = relayRows.find(relayRow => relayRow.relayId == relayId);
        if (relayRow) {
            relayConfiguration[relayId] = new ConfigRelay(relayId, relayRow.name, relayRow.category);
        }
    }
    return relayConfiguration;
}

export function getLightingRelays(relayConfiguration) {
    return relayConfiguration.filter(relay => relay !== null && relay.category == 'LIGHTING');
}

export function getOutletRelays(relayConfiguration) {
    return relayConfiguration.filter(relay => relay !== null && relay.category == 'OUTLET');
}
