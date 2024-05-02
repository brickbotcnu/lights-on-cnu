const socket = new io();

const ARDUINO_TOTAL_RELAY_COUNT = 12;
const ARDUINO_COUNT = 3;

let relays = [];
let locks  = [];
let redLeds = [];
let optaStates = [];

let lockAll = document.querySelector('#lock-all label input');
lockAll.checked = false;
lockAll.addEventListener('change', () => {
    socket.emit('CLIENT_SET_LOCK_ALL', {
        state: getLockAllState()
    });
});

for (let i = 0; i < ARDUINO_TOTAL_RELAY_COUNT; i++) {
    let relayText, relay, lock;

    relayText         = document.querySelector(`#relay-${i} p`);

    relays[i] = relay = document.querySelector(`#relay-${i} label input`);
    locks[i]  = lock  = document.querySelector(`#relay-${i} .lock`);

    relay.checked = false;
    relayText.innerHTML = `${relayText.innerHTML} <span>${i}</span> `;

    relay.addEventListener('change', () => {
        socket.emit('CLIENT_SET_RELAY', {
            relay: i,
            state: getRelayState(i)
        })
    });

    lock.addEventListener('click', () => {
        lock.classList.toggle('unlocked');
        socket.emit('CLIENT_SET_LOCK', {
            lock: i,
            state: getLockState(i)
        });
    });
}

for (let i = 0; i < ARDUINO_COUNT; i++) {
    redLeds[i] = document.querySelector(`#red-led-${i} label input`);
    redLeds[i].checked = false;

    let redLedText = document.querySelector(`#red-led-${i} p`);
    redLedText.innerHTML = `${redLedText.innerHTML} <span>${i}</span> `;

    redLeds[i].addEventListener('change', () => {
        socket.emit('CLIENT_SET_RED_LED', {
            arduinoId: i,
            state: getRedLedState(i)
        });
    })
}

function getRelayState(index) {
    return relays[index].checked ? 1 : 0;
}

function setRelayState(index, state) {
    relays[index].checked = state;
}

function getLockState(index) {
    return !locks[index].classList.contains('unlocked') ? 1 : 0;
}

function setLockState(index, state) {
    if (getLockState(index) != state) {
        locks[index].classList.toggle('unlocked');
    }    
}

function getLockAllState() {
    return lockAll.checked ? 1 : 0
}

function setLockAllState(state) {
    lockAll.checked = state;
}

function getRedLedState(index) {
    return redLeds[index].checked ? 1 : 0;
}

function setRedLed(index, state) {
    redLeds[index].checked = state;
}

socket.on('SERVER_SET_RELAYS', relayStates => {
    for (let relay = 0; relay < ARDUINO_TOTAL_RELAY_COUNT; relay++) {
        setRelayState(relay, relayStates[relay]);
    }
});

socket.on('SERVER_SET_LOCKS', lockStates => {
    for (let lock = 0; lock < ARDUINO_TOTAL_RELAY_COUNT; lock++) {
        setLockState(lock, lockStates[lock]);
    }
});

socket.on('SERVER_SET_LOCK_ALL', lockAllState => {
    setLockAllState(lockAllState);
});

socket.on('SERVER_SET_RED_LEDS', redLedStates => {
    for (let redLed = 0; redLed < ARDUINO_COUNT; redLed++) {
        setRedLed(redLed, redLedStates[redLed]);
    }
});

socket.on('SERVER_SET_ARDUINO_STATES', arduinoStates => {
    for (let arduinoId = 0; arduinoId < ARDUINO_COUNT; arduinoId++) {
        const arduinoState = document.querySelector(`#arduino-state-${arduinoId} p span`);
        if (arduinoStates[arduinoId]) {
            arduinoState.innerHTML = 'ALIVE';
            arduinoState.classList.add('online');
            arduinoState.classList.remove('offline');
        } else {
            arduinoState.innerHTML = 'TIMEOUT';
            arduinoState.classList.add('offline');
            arduinoState.classList.remove('online');
        }
    }
});

socket.on('SERVER_SET_LAST_BOOT', lastBoot => {
    document.querySelector('#last-boot span').innerHTML = lastBoot;
})