import { ComponentType, Pin } from '../types';
import { FRITZING_PIN_CALIBRATION } from './fritzingPinCalibration';

export interface ComponentDef {
  type: ComponentType;
  name: string;
  category: 'boards' | 'basic' | 'sensors' | 'displays' | 'actuators' | 'power';
  width: number;
  height: number;
  description: string;
  pins: Pin[];
  fritzingViewBox?: { width: number; height: number };
}

const withCalibration = (
  type: ComponentType,
  name: string,
  category: ComponentDef['category'],
  description: string,
): ComponentDef => {
  const calibration = FRITZING_PIN_CALIBRATION[type];
  return {
    type,
    name,
    category,
    description,
    width: calibration.width,
    height: calibration.height,
    fritzingViewBox: calibration.viewBox,
    pins: calibration.pins,
  };
};

export const COMPONENT_DEFINITIONS: Record<ComponentType, ComponentDef> = {
  arduino_uno: withCalibration(
    'arduino_uno',
    'Arduino Uno R3',
    'boards',
    'An open-source microcontroller board based on the Microchip ATmega328P.',
  ),
  breadboard_small: withCalibration(
    'breadboard_small',
    'Small Breadboard',
    'boards',
    'A half-size prototyping breadboard with 30 columns and power rails.',
  ),
  resistor: withCalibration(
    'resistor',
    'Resistor',
    'basic',
    'Limits the flow of electrical current. Resistance configurable in ohms.',
  ),
  led: withCalibration('led', 'LED', 'basic', 'A light-emitting diode. Glows when forward-biased.'),
  push_button: withCalibration(
    'push_button',
    'Push Button',
    'basic',
    'Momentary tactile switch. Connects terminals when pressed.',
  ),
  buzzer: withCalibration(
    'buzzer',
    'Piezo Buzzer',
    'basic',
    'A piezo buzzer that emits sound when powered with a signal.',
  ),
  potentiometer: withCalibration(
    'potentiometer',
    'Potentiometer',
    'basic',
    'Three-terminal resistor with a rotating dial forming an adjustable voltage divider.',
  ),
  lcd_16x2: withCalibration(
    'lcd_16x2',
    'LCD 16x2 Screen',
    'displays',
    'Alphanumeric liquid crystal display. Shows 2 lines of 16 characters.',
  ),
  seven_segment: withCalibration(
    'seven_segment',
    '7-Segment Display',
    'displays',
    'Common-cathode 7-segment display for displaying numbers.',
  ),
  ultrasonic: withCalibration(
    'ultrasonic',
    'Ultrasonic Sensor',
    'sensors',
    'HC-SR04 ultrasonic range finder sensor measuring 2cm to 400cm.',
  ),
  gas_sensor: withCalibration(
    'gas_sensor',
    'Gas Sensor',
    'sensors',
    'Gas concentration/smoke detector. Resistance changes with air quality.',
  ),
  ldr: withCalibration(
    'ldr',
    'Photoresistor (LDR)',
    'sensors',
    'Light-dependent resistor. Resistance drops in brighter light.',
  ),
  dht11: withCalibration(
    'dht11',
    'DHT11 Temp/Humid',
    'sensors',
    'Basic low-cost digital temperature and humidity sensor.',
  ),
  dc_motor: withCalibration(
    'dc_motor',
    'DC Motor',
    'actuators',
    'Standard direct-current motor. Rotates fan blades when powered.',
  ),
  servo: withCalibration(
    'servo',
    'Micro Servo',
    'actuators',
    'Positional micro servo motor. Rotates horn to specific angles.',
  ),
  battery_9v: withCalibration(
    'battery_9v',
    '9V Battery',
    'power',
    'Standard heavy-duty 9-volt battery cell source.',
  ),
  battery_aa: withCalibration(
    'battery_aa',
    '1.5V Battery (AA)',
    'power',
    'Standard 1.5V AA battery power source.',
  ),
  battery_coin: withCalibration(
    'battery_coin',
    '3V Coin Battery',
    'power',
    '3V CR2032 lithium coin cell battery power source.',
  ),
};
