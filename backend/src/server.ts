import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import http from 'http';

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
      const newProj = { id: `proj_${Date.now()}`, ...newProjData, createdAt: new Date(), updatedAt: new Date() };
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

// 3. Arduino CLI Integration Endpoint
app.post('/api/compile', async (req, res) => {
  const { codeText, boardType } = req.body;
  if (!codeText) {
    return res.status(400).json({ error: 'Source code is required for compilation' });
  }

  // Simulate Arduino CLI compilation logic.
  // In a real environment, this would spawn a child process running `arduino-cli compile`.
  // Here we validate syntax mockly.
  try {
    if (codeText.includes('syntax_error')) {
      return res.status(400).json({
        success: false,
        error: "Compilation error: missing ';' before '}'",
      });
    }

    // Simulate standard AVR Arduino compilation sizes
    const flashUsage = 1000 + Math.floor(Math.random() * 2000); // Bytes
    const sramUsage = 150 + Math.floor(Math.random() * 200); // Bytes

    return res.json({
      success: true,
      message: 'Compilation successful.',
      memory: {
        flash: { used: flashUsage, total: 32256, percentage: ((flashUsage / 32256) * 100).toFixed(1) },
        sram: { used: sramUsage, total: 2048, percentage: ((sramUsage / 2048) * 100).toFixed(1) }
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
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

// Periodic publisher simulating an active ESP32 board pushing data to Blynk Dashboard widgets
setInterval(() => {
  if (activeSockets.size === 0) return;

  const simulatedTelemetry = JSON.stringify({
    temperature: Math.round(25 + Math.random() * 8), // 25-33 deg
    humidity: Math.round(60 + Math.random() * 20),    // 60-80 %
    timestamp: new Date().toLocaleTimeString(),
  });

  for (const ws of activeSockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(simulatedTelemetry);
    }
  }
}, 3000); // every 3 seconds

// Start REST server
server.listen(PORT, () => {
  console.log(`Express API Server listening on port ${PORT}`);
});
