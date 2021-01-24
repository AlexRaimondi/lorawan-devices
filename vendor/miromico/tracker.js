
function encodeDownlink(input) {
  var at = input.data.at_command_ascii;
  if (at[at.length - 1] !== '\0') {
    return {
      errors: ['AT command not zero-terminated'],
    };
  }
  return {
    // LoRaWAN FPort used for the downlink message
    fPort: 220,
    // Encoded bytes
    bytes: at,
  };
}

function decodeDownlink(input) {
  switch (input.fPort) {
    case 212:
      return {
        // Decoded downlink (must be symmetric with encodeDownlink)
        data: {
          base64_ASCII: input.bytes
        },
      };
    default:
      return {
        errors: ['invalid FPort'],
      };
  }
}

function decodeUplink(input) {
  // Decode an uplink message from a buffer
  // (array) of bytes to an object of fields.
  var bytes = input.bytes;
  var port  = input.fPort;

  var decoded = {};

  if (port === 100) {
    // welcome message
    // input example: 01010503000a04393137337e377e0d

    decoded.device_type       = bytes[ 0];
    decoded.device_sub_type   = bytes[ 1];
    decoded.firmware_major    = bytes[ 2];
    decoded.firmware_minor    = bytes[ 3];
    decoded.firmware_build    = bytes[ 4] * 256^1 + bytes[ 5];
    decoded.reset_source      = bytes[ 6];
  }

  if (port === 101) {
    // system message
    // input example: 000000000b290481000334cb0002d57c0000000100000000010a03b2ffc0006003d00fcca624144d001a0002000000
    // returns system information
    // note: not all fields are taken into account here

    var system_time_ms    = (bytes[ 0] << 56 | bytes[ 1] << 48 | bytes[ 2] << 40 | bytes[ 3] << 32 | bytes[ 4] << 24 | bytes[ 5] << 16 | bytes[ 6] << 8 | bytes[ 7]) >>> 0;
    var temperature       = (bytes[24] <<  8 | bytes[25]) >>> 0;
    var pressure          = (bytes[26] <<  8 | bytes[27]) >>> 0;
    var x                 = (bytes[28] <<  8 | bytes[29]) >>> 0;
    var y                 = (bytes[30] <<  8 | bytes[31]) >>> 0;
    var z                 = (bytes[32] <<  8 | bytes[33]) >>> 0;
    var battery_mv        = (bytes[34] <<  8 | bytes[35]) >>> 0;

    // conversion to signed integer (2's complement)
    if (x > 0x7FFF) {
      x = -(0xFFFF - x + 1);
    }
    if (y > 0x7FFF) {
      y = -(0xFFFF - y + 1);
    }
    if (z > 0x7FFF) {
      z = -(0xFFFF - z + 1);
    }


    decoded.battery_lorawan   = bytes[36];
    decoded.gps_ttf_s         = bytes[37];
    decoded.gps_signal        = bytes[42];

    decoded.battery_v         = battery_mv / 1000.0;
    decoded.system_time_s     = system_time_ms / 1000.0;
    decoded.temperature_deg   = temperature / 10.0;
    decoded.pressure_hpa      = pressure / 1.0;
    decoded.orientation_x_g   = x / 1000.0;
    decoded.orientation_y_g   = y / 1000.0;
    decoded.orientation_z_g   = z / 1000.0;
  }

  if (port === 103) {
    // location message
    // returns date and time as DDMMYY and HHMMSS
    // returns latitude, longitude and altitude as float
    // input example: 0002717900024c6e00396fc4fff44f9500001d7e

    var dat = (bytes[ 0] << 24 | bytes[ 1] << 16 | bytes[ 2] << 8 | bytes[ 3]) >>> 0;
    var tim = (bytes[ 4] << 24 | bytes[ 5] << 16 | bytes[ 6] << 8 | bytes[ 7]) >>> 0;
    var lat = (bytes[ 8] << 24 | bytes[ 9] << 16 | bytes[10] << 8 | bytes[11]) >>> 0;
    var lon = (bytes[12] << 24 | bytes[13] << 16 | bytes[14] << 8 | bytes[15]) >>> 0;
    var alt = (bytes[16] << 24 | bytes[17] << 16 | bytes[18] << 8 | bytes[19]) >>> 0;

    // conversion to signed integer (2's complement)
    if (lat > 0x7FFFFFFF) {
      lat = -(0xFFFFFFFF - lat + 1);
    }
    if (lon > 0x7FFFFFFF) {
      lon = -(0xFFFFFFFF - lon + 1);
    }
    if (alt > 0x7FFFFFFF) {
      alt = -(0xFFFFFFFF - alt + 1);
    }
    decoded.gps_dat = dat;
    decoded.gps_tim = tim;
    decoded.gps_lat = lat / 100000.0;
    decoded.gps_lon = lon / 100000.0;
    decoded.gps_alt = alt / 100.0;
  }

  if (port === 212) {
    // GIT revision
    // returns base64-encoded HEX string of firmware GIT revision
    // input example: 41e44999f5678de41701cbcb22fcc55bbb4c5bfb

    decoded.git_revision = bytes;
  }

  if (port === 220) {
    // AT interface
    // input example: 41545f4552524f52
    // returns base64-encoded ASCII string of AT command response

    decoded.at_reply = bytes;
  }
  
  return decoded;
}