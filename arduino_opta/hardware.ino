#include "comm.h"
#include "comm_msg_types.h"
#include "hardware.h"

static const int RELAYS[] = { D0, D1, D2, D3 };
static const int LEDS[]   = { LED_D0, LED_D1, LED_D2, LED_D3 };

static const uint8_t RELAY_A_STATE[] = {0, 1, 1, 0};
static const uint8_t RELAY_B_STATE[] = {0, 0, 1, 1};

static uint8_t relay_states[RELAY_COUNT];
static uint8_t relay_locks[RELAY_COUNT];

static const uint8_t INPUT_COUNT = 2;

static const unsigned long INPUT_DEBOUNCE_TIME_INTERVAL = 300;

static volatile uint8_t inputRising[INPUT_COUNT];
static unsigned long inputLastHandle[INPUT_COUNT];
static uint8_t inputStateCounter[INPUT_COUNT];

void hardware_init() {
    pinMode(LEDR, OUTPUT);
    attachInterrupt(digitalPinToInterrupt(A0), input0_isr, RISING);
    attachInterrupt(digitalPinToInterrupt(A1), input1_isr, RISING);
}

void hardware_loop() {
    for (uint8_t input = 0; input < INPUT_COUNT; input++) {
        if (!inputRising[input]) {
            continue;
        }

        inputRising[input] = 0;

        if (millis() - inputLastHandle[input] < INPUT_DEBOUNCE_TIME_INTERVAL) {
            continue;
        }

        inputLastHandle[input] = millis();

        uint8_t relay_a = 2 * input;
        uint8_t relay_b = 2 * input + 1;

        if (!relay_locks[relay_a] && !relay_locks[relay_b]) {
            // we need to find the counter again
            for (uint8_t counter = 0; counter < RELAY_COUNT; counter++) {
                if (RELAY_A_STATE[counter] == relay_states[relay_a]
                 && RELAY_B_STATE[counter] == relay_states[relay_b]) {
                    inputStateCounter[input] = counter;
                }
            }
            
            inputStateCounter[input] = (inputStateCounter[input] + 1) % 4;

            set_relay(relay_a, RELAY_A_STATE[inputStateCounter[input]]);
            set_relay(relay_b, RELAY_B_STATE[inputStateCounter[input]]);
        } else if (!relay_locks[relay_a] && relay_locks[relay_b]) {
            set_relay(relay_a, !relay_states[relay_a]);
        } else if (relay_locks[relay_a] && !relay_locks[relay_b]) {
            set_relay(relay_b, !relay_states[relay_b]);
        } else {
            // no need to send an update to the server
            return;
        }

        comm_send_msg(ARDUINO_SET_RELAYS);
    }
}

static void input0_isr() {
    inputRising[0] = 1;
}

static void input1_isr() {
    inputRising[1] = 1;
}

uint8_t get_relay(uint8_t relay) {
    return relay_states[relay];
}

void set_relay(uint8_t relay, uint8_t state) {
    relay_states[relay] = state;
    digitalWrite(LEDS[relay], state);
    digitalWrite(RELAYS[relay], state);
}

void set_lock(uint8_t lock, uint8_t state) {
    relay_locks[lock] = state;
}
