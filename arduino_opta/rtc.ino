#include <mbed_mktime.h>
#include "ntp.h"
#include "rtc.h"

static const unsigned int RTC_SYNC_INTERVAL = 30 * 60 * 1000UL; // 30 minutes

static unsigned long rtc_last_sync;

void rtc_sync() {
    unsigned long ntp_timestamp = ntp_get_timestamp();
    if (ntp_timestamp != -1) {
        set_time(ntp_timestamp);
        rtc_last_sync = millis();
    }
}

void rtc_check_for_sync() {
    if (millis() - rtc_last_sync > RTC_SYNC_INTERVAL) {
        rtc_sync();
    }
}

time_t rtc_get_timestamp() {
    tm t;
    time_t seconds;
    _rtc_localtime(time(NULL), &t, RTC_FULL_LEAP_YEAR_SUPPORT);
    _rtc_maketime(&t, &seconds, RTC_FULL_LEAP_YEAR_SUPPORT);
    return seconds;
}
