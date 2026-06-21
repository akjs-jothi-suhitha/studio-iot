# Smart IOT – Visual Circuit Designer, C++ Editor & IoT Dashboard

Smart IOT (formerly CircuitForge) is a modern embedded systems simulation and development platform. Designed like Tinkercad Circuits and Blynk, it features a 2D drag-and-drop circuit canvas, a script runner that executes Arduino C++ code in real-time, a collateral serial output monitor, and an IoT dashboard builder with live data feeds.

---

## Workspace Layout

```text
c:\Users\jo_te\Desktop\IOT\
├── frontend/             # React + TypeScript + Vite frontend client
│   ├── src/
│   │   ├── components/   # UI Layouts (Toolbar, ComponentSidebar, Canvas, CodePanel, DashboardPanel)
│   │   ├── simulation/   # Real-time circuit solver and Arduino C++ transpiler runtime
│   │   ├── utils/        # Component definitions and code presets (Blink, Gas Alarm, LDR)
│   │   └── types/        # TypeScript interfaces
├── backend/              # Node.js + Express REST API & WebSocket server
│   ├── prisma/           # Database migrations and SQLite configuration
│   └── src/
│       └── server.ts     # CRUD APIs and ESP32 telemetry simulator
└── README.md             # This guide
```

---

## Features Implemented

1. **Light Theme Tinkercad Interface**: Styled header toolbar, left component grid, slide-out monospace editor, collapsible serial console, and bottom helper overlays.
2. **Visual Snap-to-Grid & Rotation**: Grid-snapping increments of 10px, panning by dragging the background, mouse-wheel zooming, and 90-degree component rotations.
3. **Union Wiring Above Breadboard**: Connecting pins dynamically overlays a drooped Bezier Jumper wire featuring metallic connector pins and rubber boots at both ends, drawing above all boards.
4. **Real-time Script transpilation**: Converts C++ types (`int`, `void`, `delay`, `digitalWrite`, `analogRead`, `Serial.println`, `tone`) to async JavaScript generators, actually running client loops!
5. **Interactive Outputs & Input controls**: LEDs glow, buzzers trigger sound waves (using Web Audio API), DC motors rotate fan animations, and character displays show text. Sliders adjust gas, light, and potentiometer dials.
6. **Blynk IoT Dashboard Panel**: radial gauges, switches, line charts, value cards, and terminal logs connected to pins.
7. **Database Resiliency Fallback**: The Express backend serves projectCRUD APIs and auth. It attempts to connect to SQLite via Prisma, falling back to an in-memory db store if migrations aren't executed, allowing instant runs.

---

## Preset Simulation Scenarios (Ready to Run)

Use the dropdown in the **Code panel** to swap templates:
- **LED Blink**: Alternates Digital Pin 13 state, flashing the red LED.
- **Gas Detector Alarm**: Slider changes MQ-2 concentration. Exceeding 400 triggers the piezo buzzer to emit sound waves and write alert logs to the console.
- **Smart Street Light**: A Photoresistor LDR divider circuit. Sliding light level dims/brightens the street LED via PWM on Pin 9.

---

## Setup & Running Guide

Ensure you have [Node.js](https://nodejs.org) installed on your system.

### 1. Launch Frontend Workspace

Open a terminal window and run:
```bash
cd frontend
npm install        # (Already run by code agent)
npm run dev
```
Open the local URL displayed (e.g. `http://localhost:5173`) in your Chrome browser to access the designer.

### 2. Launch Backend Telemetry Server

Open a second terminal window and run:
```bash
cd backend
npm install        # (Already run by code agent)
npm run dev
```
The REST API runs on port `3001` and the WebSocket telemetry simulator runs on port `8080` (ready to stream ESP32 telemetry).
