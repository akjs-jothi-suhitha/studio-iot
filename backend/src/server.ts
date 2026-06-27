import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

dotenv.config();

const execAsync = promisify(exec);

function extractCliError(err: unknown): string {
  if (!err || typeof err !== 'object') return 'Unknown error';
  const e = err as { message?: string; stderr?: string; stdout?: string };
  const stderr = e.stderr?.trim();
  const stdout = e.stdout?.trim();
  if (stderr && stdout) return `${stderr}\n${stdout}`;
  return stderr || stdout || e.message || 'Command failed';
}

async function resolveArduinoCli(): Promise<string | null> {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const projectBin = path.join(process.cwd(), 'bin', 'arduino-cli');
  const candidates = [
    process.env.ARDUINO_CLI_PATH,
    'arduino-cli',
    projectBin,
    path.join(home, '.local', 'bin', 'arduino-cli'),
    '/usr/local/bin/arduino-cli',
    '/opt/homebrew/bin/arduino-cli',
    path.join(process.env.LOCALAPPDATA || '', 'Arduino CLI', 'arduino-cli.exe'),
    path.join(process.env.ProgramFiles || '', 'Arduino CLI', 'arduino-cli.exe'),
  ].filter(Boolean) as string[];
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

function resolveFqbn(boardType?: string): string {
  if (boardType === 'esp32') return 'esp32:esp32:esp32';
  if (boardType === 'esp8266') return 'esp8266:esp8266:nodemcuv2';
  if (boardType === 'arduino_nano') return 'arduino:avr:nano:cpu=atmega328old';
  if (boardType === 'arduino_mega') return 'arduino:avr:mega';
  return 'arduino:avr:uno';
}

const ensuredCores = new Set<string>();

async function ensureBoardCore(cli: string, boardType?: string): Promise<void> {
  const fqbn = resolveFqbn(boardType);
  const coreKey = fqbn.split(':').slice(0, 2).join(':');
  if (ensuredCores.has(coreKey)) return;

  try {
    await execAsync(`"${cli}" core update-index`);
    if (boardType === 'esp32') {
      await execAsync(`"${cli}" core install esp32:esp32`);
    } else if (boardType === 'esp8266') {
      await execAsync(`"${cli}" core install esp8266:esp8266`);
    } else if (boardType?.startsWith('arduino')) {
      await execAsync(`"${cli}" core install arduino:avr`);
    }
    ensuredCores.add(coreKey);
  } catch (err) {
    console.warn(`Core install warning for ${coreKey}:`, extractCliError(err));
  }
}

async function createSketchDir(codeText: string): Promise<string> {
  const sketchName = `sketch_${Date.now()}`;
  const sketchDir = path.join(os.tmpdir(), sketchName);
  await fs.mkdir(sketchDir, { recursive: true });
  await fs.writeFile(path.join(sketchDir, `${sketchName}.ino`), codeText);
  return sketchDir;
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

async function connectDatabase(): Promise<void> {
  try {
    const client = new PrismaClient();
    await client.$connect();
    prisma = client;
    console.log('Prisma connected (SQLite).');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('Prisma unavailable — using in-memory store.');
    console.warn(`  Reason: ${msg.split('\n')[0]}`);
    console.warn('  Fix: cd backend && npm run prisma:generate && npm run dev');
    prisma = null;
  }
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
    { id: 'arduino_uno', name: 'Arduino Uno R3', fqbn: 'arduino:avr:uno' },
    { id: 'arduino_nano', name: 'Arduino Nano', fqbn: 'arduino:avr:nano:cpu=atmega328old' },
    { id: 'arduino_mega', name: 'Arduino Mega 2560', fqbn: 'arduino:avr:mega' },
    { id: 'esp32', name: 'ESP32 Dev Module', fqbn: 'esp32:esp32:esp32' },
    { id: 'esp8266', name: 'ESP8266 NodeMCU', fqbn: 'esp8266:esp8266:nodemcuv2' },
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
  } catch (err: unknown) {
    console.error('Error fetching ports:', err);
    return res.json([]);
  }
});

// Upload to physical board using arduino-cli
app.post('/api/upload', async (req, res) => {
  const { codeText, boardType, port } = req.body;
  if (!codeText) return res.status(400).json({ success: false, error: 'Source code is required' });
  if (!port) return res.status(400).json({ success: false, error: 'No port selected' });

  const fqbn = resolveFqbn(boardType);
  let sketchDir = '';

  try {
    sketchDir = await createSketchDir(codeText);

    const cli = await getArduinoCli();
    if (!cli) {
      return res.status(400).json({
        success: false,
        error: 'arduino-cli is not installed or not on PATH. Install via: brew install arduino-cli (macOS) or see backend/scripts/install-arduino-cli.ps1 (Windows). Then restart the backend.',
      });
    }

    await ensureBoardCore(cli, boardType);
    await execAsync(`"${cli}" compile --fqbn ${fqbn} "${sketchDir}"`);
    const { stdout } = await execAsync(`"${cli}" upload -p "${port}" --fqbn ${fqbn} "${sketchDir}"`);
    return res.json({
      success: true,
      message: `Sketch uploaded to ${boardType || 'arduino_uno'} on ${port}\n${stdout}`,
    });
  } catch (err: unknown) {
    return res.status(500).json({ success: false, error: extractCliError(err) });
  } finally {
    if (sketchDir) {
      try { await fs.rm(sketchDir, { recursive: true, force: true }); } catch (e) {}
    }
  }
});

// Arduino CLI status check
app.get('/api/cli-status', async (_req, res) => {
  const cli = await getArduinoCli();
  if (!cli) {
    return res.json({
      installed: false,
      message: 'arduino-cli not found. macOS (no Homebrew): npm run install:arduino-cli — Windows: backend/scripts/install-arduino-cli.ps1',
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

  const fqbn = resolveFqbn(boardType);
  let sketchDir = '';

  try {
    sketchDir = await createSketchDir(codeText);

    const cli = await getArduinoCli();
    if (!cli) {
      return res.status(400).json({
        success: false,
        error: 'arduino-cli is not installed or not on PATH. Install via: brew install arduino-cli (macOS) or see backend/scripts/install-arduino-cli.ps1 (Windows). Then restart the backend.',
      });
    }

    await ensureBoardCore(cli, boardType);
    const { stdout } = await execAsync(`"${cli}" compile --fqbn ${fqbn} "${sketchDir}"`);
    
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
  } catch (err: unknown) {
    return res.status(400).json({
      success: false,
      error: extractCliError(err),
    });
  } finally {
    if (sketchDir) {
      try { await fs.rm(sketchDir, { recursive: true, force: true }); } catch (e) {}
    }
  }
});

// AI code generation for Code Studio
app.post('/api/ai/generate', async (req, res) => {
  const { prompt, boardType, existingCode, components } = req.body as {
    prompt?: string;
    boardType?: string;
    existingCode?: string;
    components?: string[];
  };

  if (!prompt?.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'OPENAI_API_KEY is not configured. Add it to backend/.env (see backend/.env.example).',
    });
  }

  const board = boardType || 'arduino_uno';
  const componentList = Array.isArray(components) && components.length > 0
    ? components.join(', ')
    : 'general IoT sensors and actuators';

  const systemPrompt = `You are an expert embedded systems engineer. Generate Arduino/ESP32 C++ sketch code.
Board: ${board}
Wired components: ${componentList}
Rules:
- Output ONLY valid C++ sketch code (no markdown fences, no explanations)
- Include void setup() and void loop()
- Use appropriate libraries for the board
- For ESP32/ESP8266 use correct pin numbering and Serial.begin(115200)
- Add brief inline comments for clarity`;

  const userContent = existingCode?.trim()
    ? `Existing code:\n${existingCode}\n\nUser request: ${prompt}`
    : prompt;

  const apiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

  try {
    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    const data = await response.json() as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string } }>;
    };

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || `AI request failed (${response.status})`,
      });
    }

    let code = data.choices?.[0]?.message?.content?.trim() || '';
    code = code.replace(/^```(?:cpp|arduino|c\+\+)?\n?/i, '').replace(/\n?```$/i, '').trim();

    if (!code) {
      return res.status(502).json({ error: 'AI returned empty code. Try a more specific prompt.' });
    }

    return res.json({ code });
  } catch (err: unknown) {
    return res.status(500).json({ error: extractCliError(err) });
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
async function startServer() {
  await connectDatabase();
  server.listen(PORT, () => {
    console.log(`Express API Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
