#pragma once

#include "esphome.h"

// Store raw information
inline void rf_handle_raw(auto &pulses, int debounce_ms, bool enable_raw_logging) {
  id(last_raw_pulses) = pulses.size();
  id(last_raw_bits)   = pulses.size() / 2;

  if (enable_raw_logging != 0) {
    ESP_LOGI("RAW", "pulses=%d bits=%d",
         id(last_raw_pulses), id(last_raw_bits));
  }
}

// Process rc_switch data using raw info
inline void rf_handle_rcswitch(esphome::remote_base::RCSwitchData &x, int debounce_ms) {
    int bits = id(last_raw_bits);
    id(debounced) = false;
    switch (x.protocol) {

      case 1:  // Intertechno et al
        if (bits < 24 || bits > 26) {
          return;
        }
        break;

      case 8:  // A-Trust et al
        if (bits < 64 || bits > 70) {
          return;
        }
        break;

      default:  //other protocols - no length check
        return;
    }

    static uint32_t last_time = 0;
    static uint8_t  last_proto_local = 0;
    static uint64_t last_code_local = 0;

    uint32_t now = millis();

    // Debounce using provided debounce_ms
    if (now - last_time < debounce_ms &&
        x.protocol == last_proto_local) {
      return;
    }

    // Ignore very low code values - probably truncated group codes
    if ( x.protocol == 1 &&
         x.code     <  1024 ) {
      return;
    }



    last_time = now;
    last_code_local = x.code;
    last_proto_local = x.protocol;

    id(last_proto) = x.protocol;
    id(last_code) = x.code;

    // ✔ Debounced Log
    ESP_LOGI("RCS_DEB", "Debounced RCSwitch → proto=%d code=%llu bitCount=%d", x.protocol, (unsigned long long) x.code, bits);
    id(debounced) = true;
         
}
