
function decodeUplink(input) {
  switch (input.fPort) {
    case 15:
      return {
        // Decoded data
        data: {
          scene: input.bytes[0]
        },
      };
    default:
      return {
        errors: ['unknown FPort'],
      };
  }
}

function encodeDownlink(input) {
  data = []
  if (scene in config) {
    flags = input.config.flags
    cycl_lo = input.config.cycle % 256
    cycl_hi = input.config.cycle / 256
    led = input.config.led
    reset = input.config.resetTime
    data = data.concat([0x06, 0x80, flags, cycl_hi, cycl_lo, led, reset])
  }

  if (scene in input) {
    data = data.concat([0x02, 0x81, input.scene])
  }

  if (brightness in input) {
    data = data.concat([0x02, 0x82, input.brightness])
  }

  if (brightness in input) {
    data = data.concat([0x02, 0x85, input.volume])
  }

  return {
    // LoRaWAN FPort used for the downlink message
    fPort: 3,
    // Encoded bytes
    bytes: data,
  };
}

function decodeDownlink(input) {
  switch (input.fPort) {
    case 3:
      return {
        // Decoded downlink (must be symmetric with encodeDownlink)
        data: {
          led: colors[input.bytes[0]],
        },
      };
    default:
      return {
        errors: ['invalid FPort'],
      };
  }
}
