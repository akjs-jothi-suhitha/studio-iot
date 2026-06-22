# Studio IoT — Arduino Circuit Simulator

A Tinkercad-style web app for building Arduino circuits, wiring components pin-to-pin, writing C++ sketches, and running real-time simulation with an IoT dashboard.

---

## Features

- **Visual circuit builder** — Arduino Uno, breadboard, LEDs, sensors, motors, and more
- **Pin-accurate wiring** — click near any connector to snap wires (no visible pin circles)
- **Built-in SVG components** — hand-drawn parts with connectors aligned to the graphics
- **Live simulation** — LEDs, buzzers, motors, LCD, push buttons, onboard Uno LED on pin 13
- **Arduino code editor** — Monaco editor with blink, gas alarm, and LDR templates
- **Code & circuit modes** — pure circuit physics or transpiled Arduino C++
- **IoT dashboard** — Blynk-style gauges, switches, and serial monitor

---

## Quick start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

### Backend (optional)

```bash
cd backend
npm install
npm run dev
```

REST API: **http://localhost:3001** · WebSocket: **ws://localhost:8080**

---

## How to use

### Place components
1. Pick a part from the **Parts** sidebar
2. Click the **workplane** to place it
3. Press **Esc** to cancel

### Wire the circuit
1. Click near a pin on one component
2. Click near a pin on another component to connect
3. Wires render on top of boards
4. Pick wire color from the toolbar

### Run simulation
1. Open the **Code** panel
2. Choose a template or write a sketch
3. Select **Circuit** or **Code** mode
4. Click **Start**

### Canvas controls

| Action | Control |
|--------|---------|
| Pan | Drag empty workplane |
| Zoom | Scroll wheel or +/- in workplane bar |
| Rotate | **R** or toolbar |
| Delete | **Delete** / **Backspace** |
| Undo / Redo | Toolbar |

---

## Project structure

```text
studio-iot/
├── frontend/src/components/   # Canvas, RealisticComponent, Toolbar, CodePanel
├── frontend/src/simulation/    # Circuit solver + Arduino transpiler
├── frontend/src/utils/         # Component definitions, pin coords, presets
└── backend/src/server.ts       # REST + WebSocket API
```

---

## Templates

- **Blink** — digital pin 13 (onboard LED **L** on Uno)
- **Gas alarm** — MQ sensor, buzzer, alert LED
- **Light control** — LDR and PWM street light

---

## Tech stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Monaco Editor · Express · Prisma
