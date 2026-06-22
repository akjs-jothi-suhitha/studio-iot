import { ComponentType, Pin } from '../types';

export interface FritzingCalibration {
  width: number;
  height: number;
  viewBox: { width: number; height: number };
  pins: Pin[];
}

/** Auto-generated from Fritzing SVG connector coordinates. Re-run scripts/generate-fritzing-calibration.mjs after asset changes. */
export const FRITZING_PIN_CALIBRATION: Record<ComponentType, FritzingCalibration> = {
  "arduino_uno": {
    "width": 212,
    "height": 150.94,
    "viewBox": {
      "x": 0,
      "y": 0,
      "width": 212.372,
      "height": 151.2
    },
    "pins": [
      {
        "id": "pin_0",
        "name": "RX<-0",
        "x": 197.63,
        "y": 7.19,
        "type": "digital"
      },
      {
        "id": "pin_1",
        "name": "TX->1",
        "x": 190.44,
        "y": 7.19,
        "type": "digital"
      },
      {
        "id": "pin_2",
        "name": "D2",
        "x": 183.25,
        "y": 7.19,
        "type": "digital"
      },
      {
        "id": "pin_3",
        "name": "~D3",
        "x": 176.06,
        "y": 7.19,
        "type": "digital"
      },
      {
        "id": "pin_4",
        "name": "D4",
        "x": 168.88,
        "y": 7.19,
        "type": "digital"
      },
      {
        "id": "pin_5",
        "name": "~D5",
        "x": 161.69,
        "y": 7.19,
        "type": "digital"
      },
      {
        "id": "pin_6",
        "name": "~D6",
        "x": 154.5,
        "y": 7.19,
        "type": "digital"
      },
      {
        "id": "pin_7",
        "name": "D7",
        "x": 147.31,
        "y": 7.19,
        "type": "digital"
      },
      {
        "id": "pin_8",
        "name": "D8",
        "x": 135.81,
        "y": 7.19,
        "type": "digital"
      },
      {
        "id": "pin_9",
        "name": "~D9",
        "x": 128.63,
        "y": 7.19,
        "type": "digital"
      },
      {
        "id": "pin_10",
        "name": "~D10",
        "x": 121.44,
        "y": 7.19,
        "type": "digital"
      },
      {
        "id": "pin_11",
        "name": "~D11",
        "x": 114.25,
        "y": 7.19,
        "type": "digital"
      },
      {
        "id": "pin_12",
        "name": "D12",
        "x": 107.06,
        "y": 7.19,
        "type": "digital"
      },
      {
        "id": "pin_13",
        "name": "D13",
        "x": 99.88,
        "y": 7.19,
        "type": "digital"
      },
      {
        "id": "pin_gnd1",
        "name": "GND",
        "x": 92.69,
        "y": 7.19,
        "type": "ground"
      },
      {
        "id": "pin_aref",
        "name": "AREF",
        "x": 85.5,
        "y": 7.19,
        "type": "passive"
      },
      {
        "id": "pin_sda",
        "name": "SDA",
        "x": 78.31,
        "y": 7.19,
        "type": "passive"
      },
      {
        "id": "pin_scl",
        "name": "SCL",
        "x": 71.13,
        "y": 7.19,
        "type": "passive"
      },
      {
        "id": "pin_ioref",
        "name": "IOREF",
        "x": 97,
        "y": 143.75,
        "type": "power"
      },
      {
        "id": "pin_reset",
        "name": "RESET",
        "x": 104.19,
        "y": 143.75,
        "type": "passive"
      },
      {
        "id": "pin_3v3",
        "name": "3.3V",
        "x": 111.38,
        "y": 143.75,
        "type": "power"
      },
      {
        "id": "pin_5v",
        "name": "5V",
        "x": 118.56,
        "y": 143.75,
        "type": "power"
      },
      {
        "id": "pin_gnd2",
        "name": "GND",
        "x": 125.75,
        "y": 143.75,
        "type": "ground"
      },
      {
        "id": "pin_gnd3",
        "name": "GND",
        "x": 132.94,
        "y": 143.75,
        "type": "ground"
      },
      {
        "id": "pin_vin",
        "name": "VIN",
        "x": 140.13,
        "y": 143.75,
        "type": "power"
      },
      {
        "id": "pin_a0",
        "name": "A0",
        "x": 161.69,
        "y": 143.75,
        "type": "analog"
      },
      {
        "id": "pin_a1",
        "name": "A1",
        "x": 168.88,
        "y": 143.75,
        "type": "analog"
      },
      {
        "id": "pin_a2",
        "name": "A2",
        "x": 176.06,
        "y": 143.75,
        "type": "analog"
      },
      {
        "id": "pin_a3",
        "name": "A3",
        "x": 183.25,
        "y": 143.75,
        "type": "analog"
      },
      {
        "id": "pin_a4",
        "name": "A4",
        "x": 190.44,
        "y": 143.75,
        "type": "analog"
      },
      {
        "id": "pin_a5",
        "name": "A5",
        "x": 197.63,
        "y": 143.75,
        "type": "analog"
      }
    ]
  },
  "breadboard_small": {
    "width": 245.037,
    "height": 151.2,
    "viewBox": {
      "x": 0,
      "y": 0,
      "width": 245.037,
      "height": 151.2
    },
    "pins": [
      {
        "id": "top_minus_0",
        "name": "Top - Rail 1",
        "x": 25.32,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_1",
        "name": "Top - Rail 2",
        "x": 32.52,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_2",
        "name": "Top - Rail 3",
        "x": 39.72,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_3",
        "name": "Top - Rail 4",
        "x": 46.919,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_4",
        "name": "Top - Rail 5",
        "x": 54.119,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_6",
        "name": "Top - Rail 7",
        "x": 68.52,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_7",
        "name": "Top - Rail 8",
        "x": 75.719,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_8",
        "name": "Top - Rail 9",
        "x": 82.919,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_9",
        "name": "Top - Rail 10",
        "x": 90.119,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_10",
        "name": "Top - Rail 11",
        "x": 97.319,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_12",
        "name": "Top - Rail 13",
        "x": 111.719,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_13",
        "name": "Top - Rail 14",
        "x": 118.919,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_14",
        "name": "Top - Rail 15",
        "x": 126.118,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_15",
        "name": "Top - Rail 16",
        "x": 133.319,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_16",
        "name": "Top - Rail 17",
        "x": 140.519,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_18",
        "name": "Top - Rail 19",
        "x": 154.918,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_19",
        "name": "Top - Rail 20",
        "x": 162.118,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_20",
        "name": "Top - Rail 21",
        "x": 169.319,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_21",
        "name": "Top - Rail 22",
        "x": 176.518,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_22",
        "name": "Top - Rail 23",
        "x": 183.718,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_24",
        "name": "Top - Rail 25",
        "x": 198.118,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_25",
        "name": "Top - Rail 26",
        "x": 205.318,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_26",
        "name": "Top - Rail 27",
        "x": 212.518,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_27",
        "name": "Top - Rail 28",
        "x": 219.718,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_minus_28",
        "name": "Top - Rail 29",
        "x": 226.918,
        "y": 7.201,
        "type": "ground"
      },
      {
        "id": "top_plus_0",
        "name": "Top + Rail 1",
        "x": 25.32,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_1",
        "name": "Top + Rail 2",
        "x": 32.52,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_2",
        "name": "Top + Rail 3",
        "x": 39.72,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_3",
        "name": "Top + Rail 4",
        "x": 46.919,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_4",
        "name": "Top + Rail 5",
        "x": 54.119,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_6",
        "name": "Top + Rail 7",
        "x": 68.52,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_7",
        "name": "Top + Rail 8",
        "x": 75.719,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_8",
        "name": "Top + Rail 9",
        "x": 82.919,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_9",
        "name": "Top + Rail 10",
        "x": 90.119,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_10",
        "name": "Top + Rail 11",
        "x": 97.319,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_12",
        "name": "Top + Rail 13",
        "x": 111.719,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_13",
        "name": "Top + Rail 14",
        "x": 118.919,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_14",
        "name": "Top + Rail 15",
        "x": 126.118,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_15",
        "name": "Top + Rail 16",
        "x": 133.319,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_16",
        "name": "Top + Rail 17",
        "x": 140.519,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_18",
        "name": "Top + Rail 19",
        "x": 154.918,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_19",
        "name": "Top + Rail 20",
        "x": 162.118,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_20",
        "name": "Top + Rail 21",
        "x": 169.319,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_21",
        "name": "Top + Rail 22",
        "x": 176.518,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_22",
        "name": "Top + Rail 23",
        "x": 183.718,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_24",
        "name": "Top + Rail 25",
        "x": 198.118,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_25",
        "name": "Top + Rail 26",
        "x": 205.318,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_26",
        "name": "Top + Rail 27",
        "x": 212.518,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_27",
        "name": "Top + Rail 28",
        "x": 219.718,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "top_plus_28",
        "name": "Top + Rail 29",
        "x": 226.918,
        "y": 14.4,
        "type": "power"
      },
      {
        "id": "bottom_minus_0",
        "name": "Bottom - Rail 1",
        "x": 25.32,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_1",
        "name": "Bottom - Rail 2",
        "x": 32.52,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_2",
        "name": "Bottom - Rail 3",
        "x": 39.72,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_3",
        "name": "Bottom - Rail 4",
        "x": 46.919,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_4",
        "name": "Bottom - Rail 5",
        "x": 54.119,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_6",
        "name": "Bottom - Rail 7",
        "x": 68.52,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_7",
        "name": "Bottom - Rail 8",
        "x": 75.719,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_8",
        "name": "Bottom - Rail 9",
        "x": 82.919,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_9",
        "name": "Bottom - Rail 10",
        "x": 90.119,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_10",
        "name": "Bottom - Rail 11",
        "x": 97.319,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_12",
        "name": "Bottom - Rail 13",
        "x": 111.719,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_13",
        "name": "Bottom - Rail 14",
        "x": 118.919,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_14",
        "name": "Bottom - Rail 15",
        "x": 126.118,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_15",
        "name": "Bottom - Rail 16",
        "x": 133.319,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_16",
        "name": "Bottom - Rail 17",
        "x": 140.519,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_18",
        "name": "Bottom - Rail 19",
        "x": 154.918,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_19",
        "name": "Bottom - Rail 20",
        "x": 162.118,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_20",
        "name": "Bottom - Rail 21",
        "x": 169.319,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_21",
        "name": "Bottom - Rail 22",
        "x": 176.518,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_22",
        "name": "Bottom - Rail 23",
        "x": 183.718,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_24",
        "name": "Bottom - Rail 25",
        "x": 198.118,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_25",
        "name": "Bottom - Rail 26",
        "x": 205.318,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_26",
        "name": "Bottom - Rail 27",
        "x": 212.518,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_27",
        "name": "Bottom - Rail 28",
        "x": 219.718,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_minus_28",
        "name": "Bottom - Rail 29",
        "x": 226.918,
        "y": 136.799,
        "type": "ground"
      },
      {
        "id": "bottom_plus_0",
        "name": "Bottom + Rail 1",
        "x": 25.32,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_1",
        "name": "Bottom + Rail 2",
        "x": 32.52,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_2",
        "name": "Bottom + Rail 3",
        "x": 39.72,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_3",
        "name": "Bottom + Rail 4",
        "x": 46.919,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_4",
        "name": "Bottom + Rail 5",
        "x": 54.119,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_6",
        "name": "Bottom + Rail 7",
        "x": 68.52,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_7",
        "name": "Bottom + Rail 8",
        "x": 75.719,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_8",
        "name": "Bottom + Rail 9",
        "x": 82.919,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_9",
        "name": "Bottom + Rail 10",
        "x": 90.119,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_10",
        "name": "Bottom + Rail 11",
        "x": 97.319,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_12",
        "name": "Bottom + Rail 13",
        "x": 111.719,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_13",
        "name": "Bottom + Rail 14",
        "x": 118.919,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_14",
        "name": "Bottom + Rail 15",
        "x": 126.118,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_15",
        "name": "Bottom + Rail 16",
        "x": 133.319,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_16",
        "name": "Bottom + Rail 17",
        "x": 140.519,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_18",
        "name": "Bottom + Rail 19",
        "x": 154.918,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_19",
        "name": "Bottom + Rail 20",
        "x": 162.118,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_20",
        "name": "Bottom + Rail 21",
        "x": 169.319,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_21",
        "name": "Bottom + Rail 22",
        "x": 176.518,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_22",
        "name": "Bottom + Rail 23",
        "x": 183.718,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_24",
        "name": "Bottom + Rail 25",
        "x": 198.118,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_25",
        "name": "Bottom + Rail 26",
        "x": 205.318,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_26",
        "name": "Bottom + Rail 27",
        "x": 212.518,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_27",
        "name": "Bottom + Rail 28",
        "x": 219.718,
        "y": 144,
        "type": "power"
      },
      {
        "id": "bottom_plus_28",
        "name": "Bottom + Rail 29",
        "x": 226.918,
        "y": 144,
        "type": "power"
      }
    ]
  },
  "resistor": {
    "width": 42.92,
    "height": 9.71,
    "viewBox": {
      "x": 0,
      "y": 0,
      "width": 42.917,
      "height": 9.71
    },
    "pins": [
      {
        "id": "pin_1",
        "name": "Terminal 1",
        "type": "passive",
        "x": 1,
        "y": 4.09
      },
      {
        "id": "pin_2",
        "name": "Terminal 2",
        "type": "passive",
        "x": 41.92,
        "y": 4.09
      }
    ]
  },
  "ldr": {
    "width": 24,
    "height": 10.78,
    "viewBox": {
      "x": 0,
      "y": 0,
      "width": 24.328,
      "height": 10.932
    },
    "pins": [
      {
        "id": "pin_1",
        "name": "Terminal 1",
        "type": "passive",
        "x": 0.77,
        "y": 4.72
      },
      {
        "id": "pin_2",
        "name": "Terminal 2",
        "type": "passive",
        "x": 22.08,
        "y": 4.72
      }
    ]
  },
  "led": {
    "width": 21.47,
    "height": 40.57,
    "viewBox": {
      "x": 0,
      "y": 0,
      "width": 21.467,
      "height": 40.565
    },
    "pins": [
      {
        "id": "cathode",
        "name": "Cathode (-)",
        "x": 6.29,
        "y": 35.81,
        "type": "passive"
      },
      {
        "id": "anode",
        "name": "Anode (+)",
        "x": 16.29,
        "y": 35.81,
        "type": "passive"
      }
    ]
  },
  "push_button": {
    "width": 24.52,
    "height": 33,
    "viewBox": {
      "x": 0,
      "y": 0,
      "width": 24.518,
      "height": 33.002
    },
    "pins": [
      {
        "id": "terminal_1a",
        "name": "Terminal 1A",
        "x": 2.11,
        "y": 2.13
      },
      {
        "id": "terminal_1b",
        "name": "Terminal 1B",
        "x": 22.11,
        "y": 2.13
      },
      {
        "id": "terminal_2a",
        "name": "Terminal 2A",
        "x": 2.11,
        "y": 30.88
      },
      {
        "id": "terminal_2b",
        "name": "Terminal 2B",
        "x": 22.11,
        "y": 30.88
      }
    ]
  },
  "buzzer": {
    "width": 56.69,
    "height": 56.69,
    "viewBox": {
      "x": 0,
      "y": 0,
      "width": 56.693,
      "height": 56.693
    },
    "pins": [
      {
        "id": "positive",
        "name": "Positive (+)",
        "x": 9.92,
        "y": 17.72,
        "type": "passive"
      },
      {
        "id": "negative",
        "name": "Negative (-)",
        "x": 46.74,
        "y": 38.97,
        "type": "ground"
      }
    ]
  },
  "potentiometer": {
    "width": 40.62,
    "height": 83,
    "viewBox": {
      "x": 0,
      "y": 0,
      "width": 405.41666,
      "height": 828.4028
    },
    "pins": [
      {
        "id": "pin_1",
        "name": "Terminal 1",
        "x": 10.32,
        "y": 81.96
      },
      {
        "id": "pin_wiper",
        "name": "Wiper",
        "x": 20.34,
        "y": 81.96
      },
      {
        "id": "pin_3",
        "name": "Terminal 2",
        "x": 30.36,
        "y": 81.96
      }
    ]
  },
  "lcd_16x2": {
    "width": 227,
    "height": 102.47,
    "viewBox": {
      "x": 0,
      "y": 0,
      "width": 227.348,
      "height": 102.623
    },
    "pins": [
      {
        "id": "lcd_vss",
        "name": "GND (Vss)",
        "x": 22.93,
        "y": 7.36,
        "type": "ground"
      },
      {
        "id": "lcd_vdd",
        "name": "VCC (Vdd)",
        "x": 30.12,
        "y": 7.36,
        "type": "power"
      },
      {
        "id": "lcd_vo",
        "name": "Contrast (Vo)",
        "x": 37.31,
        "y": 7.36
      },
      {
        "id": "lcd_rs",
        "name": "Register Select (RS)",
        "x": 44.5,
        "y": 7.36
      },
      {
        "id": "lcd_rw",
        "name": "Read/Write (RW)",
        "x": 51.69,
        "y": 7.36
      },
      {
        "id": "lcd_e",
        "name": "Enable (E)",
        "x": 58.87,
        "y": 7.36
      },
      {
        "id": "lcd_d0",
        "name": "D0",
        "x": 66.06,
        "y": 7.36
      },
      {
        "id": "lcd_d1",
        "name": "D1",
        "x": 73.25,
        "y": 7.36
      },
      {
        "id": "lcd_d2",
        "name": "D2",
        "x": 80.44,
        "y": 7.36
      },
      {
        "id": "lcd_d3",
        "name": "D3",
        "x": 87.63,
        "y": 7.36
      },
      {
        "id": "lcd_d4",
        "name": "D4",
        "x": 94.82,
        "y": 7.36
      },
      {
        "id": "lcd_d5",
        "name": "D5",
        "x": 102.01,
        "y": 7.36
      },
      {
        "id": "lcd_d6",
        "name": "D6",
        "x": 109.2,
        "y": 7.36
      },
      {
        "id": "lcd_d7",
        "name": "D7",
        "x": 116.39,
        "y": 7.36
      },
      {
        "id": "lcd_a",
        "name": "LED Anode (LED+)",
        "x": 123.58,
        "y": 7.36,
        "type": "power"
      },
      {
        "id": "lcd_k",
        "name": "LED Cathode (LED-)",
        "x": 130.76,
        "y": 7.36,
        "type": "ground"
      }
    ]
  },
  "seven_segment": {
    "width": 51.61,
    "height": 80,
    "viewBox": {
      "x": 0,
      "y": 0,
      "width": 51.744,
      "height": 80.215
    },
    "pins": [
      {
        "id": "pin_e",
        "name": "E",
        "x": 11.44,
        "y": 77.96
      },
      {
        "id": "pin_d",
        "name": "D",
        "x": 18.62,
        "y": 77.96
      },
      {
        "id": "pin_c",
        "name": "C",
        "x": 25.8,
        "y": 77.96
      },
      {
        "id": "pin_dp",
        "name": "DP",
        "x": 32.99,
        "y": 77.96
      },
      {
        "id": "pin_b",
        "name": "B",
        "x": 40.17,
        "y": 77.96
      },
      {
        "id": "pin_a",
        "name": "A",
        "x": 40.17,
        "y": 20.52
      },
      {
        "id": "pin_com1",
        "name": "COM1",
        "x": 32.99,
        "y": 20.52,
        "type": "ground"
      },
      {
        "id": "pin_f",
        "name": "F",
        "x": 25.8,
        "y": 20.52
      },
      {
        "id": "pin_g",
        "name": "G",
        "x": 18.62,
        "y": 20.52
      },
      {
        "id": "pin_com2",
        "name": "COM2",
        "x": 11.44,
        "y": 20.52,
        "type": "ground"
      }
    ]
  },
  "ultrasonic": {
    "width": 89.79,
    "height": 47,
    "viewBox": {
      "x": 0,
      "y": 0,
      "width": 1775.473,
      "height": 929.3392
    },
    "pins": [
      {
        "id": "vcc",
        "name": "VCC",
        "x": 36.48,
        "y": 45.82,
        "type": "power"
      },
      {
        "id": "trig",
        "name": "Trig",
        "x": 41.54,
        "y": 45.82,
        "type": "digital"
      },
      {
        "id": "echo",
        "name": "Echo",
        "x": 46.59,
        "y": 45.82,
        "type": "digital"
      },
      {
        "id": "gnd",
        "name": "GND",
        "x": 51.65,
        "y": 45.82,
        "type": "ground"
      }
    ]
  },
  "gas_sensor": {
    "width": 47.62,
    "height": 47.62,
    "viewBox": {
      "x": 0,
      "y": 0,
      "width": 47.622,
      "height": 47.622
    },
    "pins": [
      {
        "id": "pin_a1",
        "name": "A1",
        "x": 14.31,
        "y": 14.31
      },
      {
        "id": "pin_a2",
        "name": "A2",
        "x": 14.31,
        "y": 33.31
      },
      {
        "id": "pin_b1",
        "name": "B1",
        "x": 33.31,
        "y": 14.31
      },
      {
        "id": "pin_b2",
        "name": "B2",
        "x": 33.31,
        "y": 33.31
      },
      {
        "id": "pin_a3",
        "name": "H1",
        "x": 10.35,
        "y": 23.81
      },
      {
        "id": "pin_b3",
        "name": "GND",
        "x": 37.27,
        "y": 23.81
      }
    ]
  },
  "dht11": {
    "width": 13,
    "height": 23,
    "viewBox": {
      "x": 0,
      "y": 0,
      "width": 13,
      "height": 23
    },
    "pins": [
      {
        "id": "vcc",
        "name": "VCC",
        "x": 2.49,
        "y": 21.44,
        "type": "power"
      },
      {
        "id": "data",
        "name": "Data",
        "x": 5.08,
        "y": 21.44,
        "type": "digital"
      },
      {
        "id": "nc",
        "name": "NC",
        "x": 7.54,
        "y": 21.5
      },
      {
        "id": "gnd",
        "name": "GND",
        "x": 10.13,
        "y": 21.44,
        "type": "ground"
      }
    ]
  },
  "dc_motor": {
    "width": 120,
    "height": 55.66,
    "viewBox": {
      "x": 0,
      "y": 0,
      "width": 120.132,
      "height": 55.721
    },
    "pins": [
      {
        "id": "pin_pos",
        "name": "Positive",
        "x": 19.8,
        "y": 13.04,
        "type": "passive"
      },
      {
        "id": "pin_neg",
        "name": "Negative",
        "x": 19.7,
        "y": 43.71,
        "type": "passive"
      }
    ]
  },
  "servo": {
    "width": 153,
    "height": 45,
    "viewBox": {
      "width": 153,
      "height": 45
    },
    "pins": [
      {
        "id": "gnd",
        "name": "GND (Brown)",
        "x": 118,
        "y": 41,
        "type": "ground"
      },
      {
        "id": "vcc",
        "name": "VCC (Red)",
        "x": 128,
        "y": 41,
        "type": "power"
      },
      {
        "id": "signal",
        "name": "Signal (Orange)",
        "x": 138,
        "y": 41,
        "type": "digital"
      }
    ]
  },
  "battery_9v": {
    "width": 95,
    "height": 151.44,
    "viewBox": {
      "x": 0,
      "y": 0,
      "width": 95.269,
      "height": 151.872
    },
    "pins": [
      {
        "id": "negative",
        "name": "Negative (-)",
        "x": 95.36,
        "y": 17.61,
        "type": "ground"
      },
      {
        "id": "positive",
        "name": "Positive (+)",
        "x": 95.36,
        "y": 10.43,
        "type": "power"
      }
    ]
  },
  "battery_aa": {
    "width": 154,
    "height": 37.89,
    "viewBox": {
      "x": 0,
      "y": 0,
      "width": 154.08,
      "height": 37.908
    },
    "pins": [
      {
        "id": "negative",
        "name": "Negative (-)",
        "x": 5.76,
        "y": 18.95,
        "type": "ground"
      },
      {
        "id": "positive",
        "name": "Positive (+)",
        "x": 148.24,
        "y": 18.95,
        "type": "power"
      }
    ]
  },
  "battery_coin": {
    "width": 72.59,
    "height": 82,
    "viewBox": {
      "x": 0,
      "y": 0,
      "width": 72.7142,
      "height": 82.1383
    },
    "pins": [
      {
        "id": "negative",
        "name": "Negative (-)",
        "x": 65.95,
        "y": 65.82,
        "type": "ground"
      },
      {
        "id": "positive",
        "name": "Positive (+)",
        "x": 16.35,
        "y": 65.82,
        "type": "power"
      }
    ]
  }
} as Record<ComponentType, FritzingCalibration>;
