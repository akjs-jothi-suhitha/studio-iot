# Studio IoT — Advanced Arduino & IoT Simulator

A complete web-based ecosystem for building Arduino circuits, wiring components pin-to-pin, writing C++ sketches, and running real-time simulation alongside a fully functional IoT dashboard. Studio IoT bridges the gap between simulated circuits and real-world hardware by integrating `arduino-cli` to compile and flash physical devices directly from your browser.

---

## 🌟 Key Features

- **Visual Circuit Builder**: Drag and drop Arduino Uno, breadboards, LEDs, sensors, motors, servos, and more.
- **Pin-Accurate Wiring**: Realistic breadboards with square holes and dynamic pin highlighting. Click any pin to snap wires perfectly and visualize connections exactly like real life.
- **Live Simulation Physics**: Simulates LEDs, buzzers, DC motors, LCD screens, and momentary push buttons with real-time reactive feedback.
- **Arduino Code Editor**: Integrated Monaco editor with syntax highlighting, auto-formatting, and pre-built code templates (Blink, Gas Alarm, LDR).
- **Physical Device Flashing**: Compile and upload code directly to real, physically connected Arduino boards using `arduino-cli` from the web UI.
- **IoT Dashboard**: A Blynk-style telemetry dashboard with drag-and-drop Radial Gauges, Live Line Charts, Input Switches, and Serial Monitors.
- **Real-time Telemetry API**: Every project generates a unique API Key. Real physical ESP32 or Wi-Fi enabled boards can `POST` live sensor data to the backend, which instantly updates the web dashboard.
- **Project Management**: Save your circuits, code, and dashboard layouts to a persistent SQLite database using Prisma.

---

## 🛠️ Detailed Installation & Setup Guide

### 1. Prerequisites

Before installing, ensure you have the following on your system:
- **Node.js**: v18.x or newer installed.
- **Arduino CLI (Required for Physical Flashing)**: 
  To allow the backend to compile code and flash it to real connected boards via USB, you must install `arduino-cli` and ensure it's in your system PATH.

  **Automatic Installation (Windows PowerShell):**
  We have provided a script to automatically download, install, and configure `arduino-cli` along with the necessary `avr` core for Arduino Uno/Mega/Nano boards.
  Open an Administrator PowerShell window and run:
  ```powershell
  cd "backend\scripts"
  .\install-arduino-cli.ps1
  ```
  *(Note: This script will download the CLI, install the `arduino:avr` core, and set up the environmental variables).*

### 2. Backend Setup

The backend serves the Express REST API, handles WebSocket broadcasting for the dashboard, manages the SQLite database via Prisma, and acts as a bridge to `serialport` and `arduino-cli` for hardware interaction.

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install NPM dependencies
npm install

# 3. Generate the Prisma Client
npx prisma generate

# 4. Initialize and migrate the SQLite database
# (This creates dev.db inside the prisma/ folder)
npm run prisma:migrate

# 5. Start the development server
npm run dev
```

**Backend Services:**
- REST API: **http://localhost:3001**
- Telemetry WebSocket Broker: **ws://localhost:8080**

### 3. Frontend Setup

The frontend provides the interactive React UI, SVG canvas, and IoT dashboard.

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install NPM dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

Open your browser and navigate to **http://localhost:5173** to launch the Studio.

---

## 🚀 Detailed Working Guide

### Part 1: Building a Simulated Circuit
1. **Create Project**: Click "New Project" in the dashboard.
2. **Add Components**: Open the **Parts Sidebar** (left side). Click components like the Arduino Uno, Breadboard, LEDs, and Resistors to drop them onto the canvas. Press `Esc` to cancel.
3. **Interactive Wiring**: Hover over any component's pin (it will glow blue). Click to start routing a wire, and click on another component's pin to finish the connection. You can change wire colors dynamically using the top toolbar to keep things organized.
4. **Delete/Rotate**: Select a component or wire and press `Backspace` or use the toolbar to rotate it.

### Part 2: Writing Code & Running Simulations
1. **Code Panel**: Click the **Arduino IDE** tab in the bottom panel.
2. **Templates**: Use the dropdown at the top of the code editor to load a preset sketch (e.g., "Gas Sensor Alarm").
3. **Execution Mode**: Choose **Circuit** mode for physical wiring logic.
4. **Start**: Click the green **Start Simulation** button in the top toolbar. The backend will parse the logic and animate the components.

### Part 3: Using the IoT Dashboard & Telemetry API
1. **Switch to Dashboard Mode**: Click the **Dashboard** toggle in the top toolbar.
2. **Add Widgets**: Click **Add Widget** to drop Gauges, Line Charts, or Buttons.
3. **Find your API Key**: At the top left of the Dashboard panel, you will see a unique `API Key` (e.g., `123e4567-e89b-12d3...`).
4. **Hardware Integration**: If you have a physical ESP32 or Wi-Fi board running in the real world, you can send HTTP POST requests to the backend telemetry route to push live data to your widgets.
   ```http
   POST http://localhost:3001/api/telemetry
   Content-Type: application/json

   {
     "apiKey": "YOUR_PROJECT_API_KEY",
     "data": {
       "temperature": 24.5,
       "humidity": 60
     }
   }
   ```
5. **Real-time Updates**: The backend verifies the API key and pushes the data over WebSockets, instantly animating the bound widgets on your screen.

### Part 4: Compiling & Flashing to Physical Boards
1. **Connect Hardware**: Plug your physical Arduino Uno, Nano, Mega, or ESP32 into your computer via USB.
2. **Select Board & Port**: In the Code Panel, select the correct Board type (e.g., "Arduino Uno") from the dropdown. The Studio uses the `serialport` library to scan your machine and populate the COM Port dropdown (e.g., `COM3`).
3. **Upload**: Click the **Upload to Board** button.
4. **Behind the Scenes**: The backend saves your code to a temporary `.ino` file, executes `arduino-cli compile`, and then `arduino-cli upload -p COM3`. The results and compilation memory usage are returned directly to the UI.

---

## 📁 Project Architecture & Structure

```text
studio-iot/
├── frontend/
│   ├── src/components/     # Interactive Canvas, SVG Components, Dashboard Panel, Toolbar
│   ├── src/simulation/     # Circuit physics solver & simulation state engine
│   ├── src/utils/          # Pin coordinates, visual bounding boxes, code templates
│   └── src/services/       # API abstraction layer (`api.ts`)
├── backend/
│   ├── prisma/             # Database schema definition (`schema.prisma`) & local SQLite DB
│   ├── scripts/            # Helper scripts (e.g., `install-arduino-cli.ps1`)
│   ├── src/server.ts       # Express REST API, WebSocket server, `child_process` wrappers
│   └── package.json        # Dependencies: `serialport`, `ws`, `express`, `prisma`
└── README.md
```

## 💻 Core Technology Stack
- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS 4, Monaco Editor (for code formatting).
- **Backend**: Node.js, Express, Prisma ORM, SQLite, WebSockets (`ws`), `serialport` (for hardware USB discovery).
- **Hardware Toolchain**: `arduino-cli` (headless compiler and uploader).
