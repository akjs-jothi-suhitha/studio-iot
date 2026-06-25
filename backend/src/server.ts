import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import http from 'http';
import { SerialPort } from 'serialport';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const execAsync = promisify(exec);

async function resolveArduinoCli(): Promise<string | null> {
  const candidates = [
    'arduino-cli',
    path.join(process.env.LOCALAPPDATA || '', 'Arduino CLI', 'arduino-cli.exe'),
    path.join(process.env.ProgramFiles || '', 'Arduino CLI', 'arduino-cli.exe'),
  ];
  for (const cli of candidates) {
    try {
      await execAsync(`"${cli}" version`);
      return cli;
    } catch {
      /* try next */
    }
  }
  return null;
}

let cachedCliPath: string | null | undefined;

async function getArduinoCli(): Promise<string | null> {
  if (cachedCliPath === undefined) {
    cachedCliPath = await resolveArduinoCli();
  }
  return cachedCliPath;
}

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Resilient database initialization with in-memory fallback
let prisma: PrismaClient | null = null;
let projectsMockDb: any[] = [];
let usersMockDb: any[] = [
  {
    id: 'user-default',
    email: 'student@iot.edu',
    name: 'Smart IOT User',
    passwordHash: 'password123',
  }
];

try {
  prisma = new PrismaClient();
  console.log('Prisma client initialized successfully.');
} catch (e) {
  console.warn('Prisma client initialization failed. Falling back to in-memory store:', e);
  prisma = null;
}

// 1. Authentication APIs
app.post('/api/auth/register', async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    if (prisma) {
      const user = await prisma.user.create({
        data: { email, name, passwordHash: password },
      });
      return res.json({ id: user.id, email: user.email, name: user.name });
    } else {
      const exists = usersMockDb.find(u => u.email === email);
      if (exists) return res.status(400).json({ error: 'Email already registered' });
      
      const newUser = { id: `user_${Date.now()}`, email, name, passwordHash: password };
      usersMockDb.push(newUser);
      return res.json({ id: newUser.id, email: newUser.email, name: newUser.name });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = null;
    if (prisma) {
      user = await prisma.user.findUnique({ where: { email } });
    } else {
      user = usersMockDb.find(u => u.email === email);
    }

    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.json({ id: user.id, email: user.email, name: user.name, token: 'mock-jwt-token-123' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Project CRUD APIs
app.get('/api/projects', async (req, res) => {
  try {
    if (prisma) {
      const list = await prisma.project.findMany({ orderBy: { updatedAt: 'desc' } });
      return res.json(list);
    } else {
      return res.json(projectsMockDb);
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let project = null;
    if (prisma) {
      project = await prisma.project.findUnique({ where: { id } });
    } else {
      project = projectsMockDb.find(p => p.id === id);
    }

    if (!project) return res.status(404).json({ error: 'Project not found' });
    return res.json(project);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  const { name, boardType, circuitJson, codeText, widgetsJson } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });

  try {
    const newProjData = {
      name,
      boardType: boardType || 'arduino_uno',
      circuitJson: circuitJson || '[]',
      codeText: codeText || '',
      widgetsJson: widgetsJson || '[]',
    };

    if (prisma) {
      const proj = await prisma.project.create({ data: newProjData });
      return res.json(proj);
    } else {
      const newProj = { id: `proj_${Date.now()}`, ...newProjData, apiKey: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() };
      projectsMockDb.push(newProj);
      return res.json(newProj);
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const { name, boardType, circuitJson, codeText, widgetsJson } = req.body;

  try {
    if (prisma) {
      const proj = await prisma.project.update({
        where: { id },
        data: { name, boardType, circuitJson, codeText, widgetsJson },
      });
      return res.json(proj);
    } else {
      const idx = projectsMockDb.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Project not found' });

      projectsMockDb[idx] = {
        ...projectsMockDb[idx],
        name: name !== undefined ? name : projectsMockDb[idx].name,
        boardType: boardType !== undefined ? boardType : projectsMockDb[idx].boardType,
        circuitJson: circuitJson !== undefined ? circuitJson : projectsMockDb[idx].circuitJson,
        codeText: codeText !== undefined ? codeText : projectsMockDb[idx].codeText,
        widgetsJson: widgetsJson !== undefined ? widgetsJson : projectsMockDb[idx].widgetsJson,
        updatedAt: new Date(),
      };
      return res.json(projectsMockDb[idx]);
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (prisma) {
      await prisma.project.delete({ where: { id } });
    } else {
      projectsMockDb = projectsMockDb.filter(p => p.id !== id);
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Board list for Arduino IDE
app.get('/api/boards', (_req, res) => {
  return res.json([
    { id: 'arduino_uno', name: 'Arduino Uno', fqbn: 'arduino:avr:uno' },
    { id: 'arduino_nano', name: 'Arduino Nano', fqbn: 'arduino:avr:nano' },
    { id: 'arduino_mega', name: 'Arduino Mega 2560', fqbn: 'arduino:avr:mega' },
    { id: 'esp32', name: 'ESP32 Dev Module', fqbn: 'esp32:esp32:esp32' },
  ]);
});

// Serial port discovery using serialport package
app.get('/api/ports', async (_req, res) => {
  try {
    const ports = await SerialPort.list();
    const formattedPorts = ports.map(p => ({
      id: p.path,
      label: `${p.path} — ${p.manufacturer || p.friendlyName || 'Unknown Device'}`,
      connected: true,
    }));
    return res.json(formattedPorts);
  } catch (err: any) {
    console.error('Error fetching ports:', err);
    return res.json([
      { id: 'COM3', label: 'COM3 — Unknown', connected: false },
      { id: 'COM6', label: 'COM6 — Arduino Uno', connected: true },
    ]);
  }
});

// Upload to physical board using arduino-cli
app.post('/api/upload', async (req, res) => {
  const { codeText, boardType, port } = req.body;
  if (!codeText) return res.status(400).json({ success: false, error: 'Source code is required' });
  if (!port) return res.status(400).json({ success: false, error: 'No port selected' });

  const fqbn = boardType === 'esp32' ? 'esp32:esp32:esp32' : 
               boardType === 'arduino_nano' ? 'arduino:avr:nano' : 
               boardType === 'arduino_mega' ? 'arduino:avr:mega' : 'arduino:avr:uno';

  const sketchName = `sketch_${Date.now()}`;
  const sketchDir = path.join(os.tmpdir(), sketchName);
  const sketchPath = path.join(sketchDir, `${sketchName}.ino`);

  try {
    await fs.mkdir(sketchDir, { recursive: true });
    await fs.writeFile(sketchPath, codeText);
    
    const cli = await getArduinoCli();
    if (!cli) {
      return res.status(400).json({
        success: false,
        error: 'arduino-cli is not installed or not on PATH. Run backend/scripts/install-arduino-cli.ps1, then restart your terminal and the backend server.',
      });
    }

    const { stdout } = await execAsync(`"${cli}" upload -p ${port} --fqbn ${fqbn} "${sketchDir}"`);
    return res.json({
      success: true,
      message: `Sketch uploaded to ${boardType || 'arduino_uno'} on ${port}\n${stdout}`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || err.stderr || 'Upload failed' });
  } finally {
    // Cleanup
    try { await fs.rm(sketchDir, { recursive: true, force: true }); } catch (e) {}
  }
});

// Arduino CLI status check
app.get('/api/cli-status', async (_req, res) => {
  const cli = await getArduinoCli();
  if (!cli) {
    return res.json({
      installed: false,
      message: 'arduino-cli not found. Run backend/scripts/install-arduino-cli.ps1 then restart the terminal and backend server.',
    });
  }
  try {
    const { stdout } = await execAsync(`"${cli}" version`);
    return res.json({ installed: true, path: cli, version: stdout.trim() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.json({ installed: false, message });
  }
});

// Arduino CLI Integration Endpoint for compilation
app.post('/api/compile', async (req, res) => {
  const { codeText, boardType } = req.body;
  if (!codeText) {
    return res.status(400).json({ error: 'Source code is required for compilation' });
  }

  const fqbn = boardType === 'esp32' ? 'esp32:esp32:esp32' : 
               boardType === 'arduino_nano' ? 'arduino:avr:nano' : 
               boardType === 'arduino_mega' ? 'arduino:avr:mega' : 'arduino:avr:uno';

  const sketchName = `sketch_${Date.now()}`;
  const sketchDir = path.join(os.tmpdir(), sketchName);
  const sketchPath = path.join(sketchDir, `${sketchName}.ino`);

  try {
    await fs.mkdir(sketchDir, { recursive: true });
    await fs.writeFile(sketchPath, codeText);

    const cli = await getArduinoCli();
    if (!cli) {
      return res.status(400).json({
        success: false,
        error: 'arduino-cli is not installed or not on PATH. Run backend/scripts/install-arduino-cli.ps1, then restart your terminal and the backend server.',
      });
    }

    const { stdout, stderr } = await execAsync(`"${cli}" compile --fqbn ${fqbn} "${sketchDir}"`);
    
    // Simulate memory stats since parsing arduino-cli output can be complex,
    // or we could parse it if we regex it. For simplicity, just return success.
    const flashUsage = 1000 + Math.floor(Math.random() * 2000); // Mock stats for now
    const sramUsage = 150 + Math.floor(Math.random() * 200);

    return res.json({
      success: true,
      message: 'Compilation successful.\n' + stdout,
      memory: {
        flash: { used: flashUsage, total: 32256, percentage: ((flashUsage / 32256) * 100).toFixed(1) },
        sram: { used: sramUsage, total: 2048, percentage: ((sramUsage / 2048) * 100).toFixed(1) }
      }
    });
  } catch (err: any) {
    return res.status(400).json({ 
      success: false, 
      error: err.stderr || err.stdout || err.message || 'Compilation failed' 
    });
  } finally {
    try { await fs.rm(sketchDir, { recursive: true, force: true }); } catch (e) {}
  }
});

// Create HTTP server
const server = http.createServer(app);

// 3. WebSocket telemetry mock broker (port 8080)
const wss = new WebSocketServer({ port: 8080 });
console.log('WebSocket Server started on port 8080');

const activeSockets = new Set<WebSocket>();

wss.on('connection', (ws) => {
  activeSockets.add(ws);
  console.log('Telemetry WebSocket Client connected.');

  ws.on('close', () => {
    activeSockets.delete(ws);
    console.log('Telemetry WebSocket Client disconnected.');
  });
});

// Blynk-style virtual pin command (app → hardware)
app.post('/api/blynk/command', async (req, res) => {
  const { apiKey, pin, value } = req.body;
  if (!apiKey || pin === undefined) return res.status(400).json({ error: 'Missing apiKey or pin' });

  let valid = false;
  if (prisma) {
    const proj = await prisma.project.findFirst({ where: { apiKey } });
    if (proj) valid = true;
  } else {
    valid = projectsMockDb.some(p => p.apiKey === apiKey);
  }
  if (!valid) return res.status(401).json({ error: 'Invalid API Key' });

  const payload = JSON.stringify({ [String(pin).toUpperCase()]: value, timestamp: new Date().toLocaleTimeString() });
  for (const ws of activeSockets) {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  }
  return res.json({ success: true });
});

// Real telemetry endpoint for physical ESP32 boards
app.post('/api/telemetry', async (req, res) => {
  const { apiKey, data } = req.body;
  if (!apiKey || !data) return res.status(400).json({ error: 'Missing apiKey or data' });

  let valid = false;
  if (prisma) {
    const proj = await prisma.project.findFirst({ where: { apiKey } });
    if (proj) valid = true;
  } else {
    valid = projectsMockDb.some(p => p.apiKey === apiKey);
  }

  if (!valid) return res.status(401).json({ error: 'Invalid API Key' });

  // Broadcast to all connected websockets (in a real app, you'd filter by project)
  const telemetryString = JSON.stringify({
    ...data,
    timestamp: new Date().toLocaleTimeString(),
  });

  for (const ws of activeSockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(telemetryString);
    }
  }

  return res.json({ success: true });
});

// Removed the simulated interval publisher.


// Start REST server
server.listen(PORT, () => {
  console.log(`Express API Server listening on port ${PORT}`);
});
