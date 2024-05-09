#include <Ethernet.h>
#include <mbed_mktime.h>
#include <SPI.h>
#include <time.h>

#include "aes.h" // absolutely mandatory to be the first include
#include "arduino_opta.h"
#include "hardware.h"
#include "ntp.h"
#include "rtc.h"

static const uint8_t ARDUINO_ID = 2;

static const bool DEBUG = false;

void setup() {
    // Serial.begin(9600);

    while (DEBUG && !Serial);

    eth_init();
    
    // if Ethernet init fails, disable communication on hardware ISR's
    hardware_init();
    ntp_init();
    rtc_sync();

    srand((unsigned int) time(NULL));

    if (DEBUG) Serial.println("Arduino Opta initialized");
}

void loop() {
    eth_loop();
    hardware_loop();
}

uint8_t get_arduino_id() { return ARDUINO_ID; }

uint8_t is_debug() { return DEBUG; }
