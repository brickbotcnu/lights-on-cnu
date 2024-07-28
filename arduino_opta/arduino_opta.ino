#include <Ethernet.h>
#include <mbed_mktime.h>
#include <SPI.h>
#include <time.h>

#include "aes.h" // absolutely mandatory to be the first include
#include "arduino_opta.h"
#include "hardware.h"
#include "ntp.h"
#include "rtc.h"

static const uint8_t ARDUINO_ID = 1;
static IPAddress ip_addr(192, 168, 0, 166);

static const bool DEBUG = false;

void setup() {
    if (DEBUG) Serial.begin(9600);
    while (DEBUG && !Serial);

    pinMode(LED_RESET, OUTPUT);
    pinMode(LEDR, OUTPUT);

    digitalWrite(LED_RESET, HIGH);
    digitalWrite(LEDR, LOW);

    if (!eth_init(ip_addr)) {
        digitalWrite(LEDR, HIGH);
    }
    
    hardware_init();
    ntp_init();
    rtc_sync();

    srand((unsigned int) time(NULL));

    if (DEBUG) Serial.println("Arduino Opta initialized");

    digitalWrite(LED_RESET, LOW);
}

void loop() {
    rtc_check_for_sync();
    eth_loop();
    hardware_loop();
}

uint8_t get_arduino_id() { return ARDUINO_ID; }

uint8_t is_debug() { return DEBUG; }
