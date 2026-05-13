#pragma once

#include "esphome.h"
#include <stdint.h>
#include <stdlib.h>

// Raw decoder for the 433 MHz frames seen in your logs:
//   sync/repeat separator:   ~3000 us low, ~1700 us high
//   data bit:                ~430 us low, then ~430 us high = 0
//                            ~430 us low, then ~850 us high = 1
//   useful payload:          32 bits, repeated several times while the button is held
//
// This is intentionally independent of rc_switch, because these captures do not
// appear to be decoded cleanly by the standard rc_switch protocol list.
struct RFDecodedRawFrame {
  bool valid;
  uint32_t code;
  uint8_t bits;
  uint8_t repeats;
};

inline bool rf_in_range_(int value, int min_value, int max_value) {
  int v = abs(value);
  return v >= min_value && v <= max_value;
}

inline RFDecodedRawFrame rf_decode_custom_raw_(auto &pulses) {
  RFDecodedRawFrame result{false, 0, 0, 0};

  constexpr uint8_t FRAME_BITS = 32;

  // Tolerances are deliberately quite wide because the captured logs show noise
  // and occasional distorted pulses.
  constexpr int SYNC_LOW_MIN   = 2600;
  constexpr int SYNC_LOW_MAX   = 3400;
  constexpr int SYNC_HIGH_MIN  = 1400;
  constexpr int SYNC_HIGH_MAX  = 2100;

  constexpr int BIT_LOW_MIN    = 300;
  constexpr int BIT_LOW_MAX    = 650;
  constexpr int BIT_HIGH_0_MIN = 300;
  constexpr int BIT_HIGH_0_MAX = 650;
  constexpr int BIT_HIGH_1_MIN = 700;
  constexpr int BIT_HIGH_1_MAX = 1050;

  uint32_t best_code = 0;
  uint8_t best_count = 0;

  // Search the whole raw capture for repeated frames. A press often contains
  // random/noisy fragments before and after the repeated useful frame.
  for (size_t i = 0; i + 1 + (FRAME_BITS * 2) < pulses.size(); i++) {
    // The usable frames in the logs start after a negative sync-low and a
    // positive sync-high: -3000-ish, +1700-ish.
    if (!(pulses[i] < 0 && pulses[i + 1] > 0 &&
          rf_in_range_(pulses[i], SYNC_LOW_MIN, SYNC_LOW_MAX) &&
          rf_in_range_(pulses[i + 1], SYNC_HIGH_MIN, SYNC_HIGH_MAX))) {
      continue;
    }

    uint32_t code = 0;
    bool ok = true;
    size_t pos = i + 2;

    for (uint8_t bit = 0; bit < FRAME_BITS; bit++) {
      int low = pulses[pos++];
      int high = pulses[pos++];

      if (!(low < 0 && high > 0 && rf_in_range_(low, BIT_LOW_MIN, BIT_LOW_MAX))) {
        ok = false;
        break;
      }

      code <<= 1;

      if (rf_in_range_(high, BIT_HIGH_0_MIN, BIT_HIGH_0_MAX)) {
        // bit 0
      } else if (rf_in_range_(high, BIT_HIGH_1_MIN, BIT_HIGH_1_MAX)) {
        code |= 1;
      } else {
        ok = false;
        break;
      }
    }

    if (!ok) {
      continue;
    }

    // Count how many times this exact frame occurs in this raw capture.
    uint8_t count = 1;
    for (size_t j = i + 1; j + 1 + (FRAME_BITS * 2) < pulses.size(); j++) {
      if (!(pulses[j] < 0 && pulses[j + 1] > 0 &&
            rf_in_range_(pulses[j], SYNC_LOW_MIN, SYNC_LOW_MAX) &&
            rf_in_range_(pulses[j + 1], SYNC_HIGH_MIN, SYNC_HIGH_MAX))) {
        continue;
      }

      uint32_t other = 0;
      bool other_ok = true;
      size_t p = j + 2;

      for (uint8_t bit = 0; bit < FRAME_BITS; bit++) {
        int low = pulses[p++];
        int high = pulses[p++];

        if (!(low < 0 && high > 0 && rf_in_range_(low, BIT_LOW_MIN, BIT_LOW_MAX))) {
          other_ok = false;
          break;
        }

        other <<= 1;
        if (rf_in_range_(high, BIT_HIGH_0_MIN, BIT_HIGH_0_MAX)) {
          // bit 0
        } else if (rf_in_range_(high, BIT_HIGH_1_MIN, BIT_HIGH_1_MAX)) {
          other |= 1;
        } else {
          other_ok = false;
          break;
        }
      }

      if (other_ok && other == code && count < 255) {
        count++;
      }
    }

    if (count > best_count) {
      best_code = code;
      best_count = count;
    }
  }

  if (best_count > 0) {
    result.valid = true;
    result.code = best_code;
    result.bits = FRAME_BITS;
    result.repeats = best_count;
  }

  return result;
}

// Store raw information
inline void rf_handle_raw(auto &pulses, int debounce_ms, bool enable_raw_logging) {
  id(last_raw_pulses) = pulses.size();
  id(last_raw_bits)   = pulses.size() / 2;

  if (enable_raw_logging != 0) {
    ESP_LOGI("RAW", "pulses=%d bits=%d",
         id(last_raw_pulses), id(last_raw_bits));
  }

  RFDecodedRawFrame decoded = rf_decode_custom_raw_(pulses);
  if (!decoded.valid) {
    return;
  }

  static uint32_t last_raw_decoded_time = 0;
  static uint32_t last_raw_decoded_code = 0;

  uint32_t now = millis();
  if (decoded.code == last_raw_decoded_code &&
      now - last_raw_decoded_time < (uint32_t) debounce_ms) {
    return;
  }

  last_raw_decoded_time = now;
  last_raw_decoded_code = decoded.code;

  // Use protocol 99 as a local marker for this custom raw decoder.
  id(last_proto) = 99;
  id(last_code) = decoded.code;
  id(debounced) = true;

  ESP_LOGI("RAW_DEB", "Debounced RAW custom → proto=99 code=0x%08lX decimal=%lu bitCount=%u repeats=%u pulses=%u",
           (unsigned long) decoded.code,
           (unsigned long) decoded.code,
           decoded.bits,
           decoded.repeats,
           (unsigned) pulses.size());
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
