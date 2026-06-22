import { ComponentType } from '../types';

/** Fritzing breadboard-view SVG paths (sourced from fritzing/fritzing-parts, CC BY-SA) */
export const FRITZING_ASSETS: Record<ComponentType, string> = {
  arduino_uno: '/assets/fritzing/arduino_uno.svg',
  breadboard_small: '/assets/fritzing/breadboard_small.svg',
  resistor: '/assets/fritzing/resistor.svg',
  led: '/assets/fritzing/led.svg',
  push_button: '/assets/fritzing/push_button.svg',
  buzzer: '/assets/fritzing/buzzer.svg',
  potentiometer: '/assets/fritzing/potentiometer.svg',
  lcd_16x2: '/assets/fritzing/lcd_16x2.svg',
  seven_segment: '/assets/fritzing/seven_segment.svg',
  ultrasonic: '/assets/fritzing/ultrasonic.svg',
  gas_sensor: '/assets/fritzing/gas_sensor.svg',
  ldr: '/assets/fritzing/ldr.svg',
  dht11: '/assets/fritzing/dht11.svg',
  dc_motor: '/assets/fritzing/dc_motor.svg',
  servo: '/assets/fritzing/servo.svg',
  battery_9v: '/assets/fritzing/battery_9v.svg',
  battery_aa: '/assets/fritzing/battery_aa.svg',
  battery_coin: '/assets/fritzing/battery_coin.svg',
};

export const getFritzingAsset = (type: ComponentType): string => FRITZING_ASSETS[type];
