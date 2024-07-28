'use strict';

const RELAYS_PER_ARDUINO = 4;
const RELAY_COUNT = ARDUINO_COUNT * RELAYS_PER_ARDUINO;

const socket = io();

const relaySwitches = [];
const relayLocks = [];
const relayLockAllSwitch = document.querySelector('#relay-lock-all > label > input');
relayLockAllSwitch.checked = false;

relayLockAllSwitch.onclick = () => {
    socket.emit('client-setRelayLockAll', relayLockAllSwitch.checked);
}

for (let i = 0; i < RELAY_COUNT; i++) {
    const relaySwitch = relaySwitches[i] = document.querySelector('#relay-' + i + ' > label > input');
    const relayLock   = relayLocks[i]    = document.querySelector('#relay-' + i + ' .lock');

    if (!relaySwitch) {
        continue;
    }

    relaySwitch.checked = false;
    relaySwitch.onchange = () => {
        socket.emit('client-setRelayState', {
            relayId: i,
            relayState: relaySwitches[i].checked
        });
    }

    relayLock.onclick = () => {
        if (relayLock.classList.contains('unlocked')) {
            relayLock.classList.remove('unlocked');
        } else {
            relayLock.classList.add('unlocked');
        }

        socket.emit('client-setRelayLock', {
           relayId: i,
           relayLock: !relayLock.classList.contains('unlocked')
        });
    }
}

socket.on('server-setInitialState', initial => {
    for (let i = 0; i < RELAY_COUNT; i++) {
        if (!relaySwitches[i]) {
            continue;
        }

        relaySwitches[i].checked = initial.relayStates[i];

        if (initial.relayLocks[i]) {
            relayLocks[i].classList.remove('unlocked');
        }
    }

    setArduinoStatuses(initial.arduinoStatuses);
});

socket.on('server-setRelayStates', relayStates => {
    for (let i = 0; i < RELAY_COUNT; i++) {
        if (!relaySwitches[i]) {
            continue;
        }
        
        relaySwitches[i].checked = relayStates[i];
    }
});

socket.on('server-setRelayLocks', recvRelayLocks => {
    for (let i = 0; i < RELAY_COUNT; i++) {
        if (!relayLocks[i]) {
            continue;
        }
        
        if (recvRelayLocks[i]) {
            relayLocks[i].classList.remove('unlocked');
        } else {
            relayLocks[i].classList.add('unlocked');
        }
    }
});

socket.on('server-setRelayLockAll', relayLockAll => {
    relayLockAllSwitch.checked = relayLockAll;
});

socket.on('server-setArduinoStatuses', arduinoStatuses => {
    setArduinoStatuses(arduinoStatuses);
});

function setArduinoStatuses(arduinoStatuses) {
    for (let i = 0; i < ARDUINO_COUNT; i++) {
        const arduinoStatusElem = document.getElementById('arduino-status-' + i);
        if (arduinoStatuses[i]) {
            arduinoStatusElem.classList.add('arduino-status-reachable');
            arduinoStatusElem.classList.remove('arduino-status-unreachable');
            arduinoStatusElem.innerHTML = 'REACHABLE';
        } else {
            arduinoStatusElem.classList.add('arduino-status-unreachable');
            arduinoStatusElem.classList.remove('arduino-status-reachable');
            arduinoStatusElem.innerHTML = 'UNREACHABLE';
        }
    }
}
