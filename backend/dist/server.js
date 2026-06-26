"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const ws_1 = require("ws");
const client_1 = require("@prisma/client");
const http_1 = __importDefault(require("http"));
const serialport_1 = require("serialport");
const child_process_1 = require("child_process");
const util_1 = require("util");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const crypto_1 = __importDefault(require("crypto"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function resolveArduinoCli() {
    const candidates = [
        'arduino-cli',
        path_1.default.join(process.env.LOCALAPPDATA || '', 'Arduino CLI', 'arduino-cli.exe'),
        path_1.default.join(process.env.ProgramFiles || '', 'Arduino CLI', 'arduino-cli.exe'),
    ];
    for (const cli of candidates) {
        try {
            await execAsync(`"${cli}" version`);
            return cli;
        }
        catch {
            /* try next */
        }
    }
    return null;
}
let cachedCliPath;
async function getArduinoCli() {
    if (cachedCliPath === undefined) {
        cachedCliPath = await resolveArduinoCli();
    }
    return cachedCliPath;
}
function resolveFqbn(boardType) {
    if (boardType === 'esp32')
        return 'esp32:esp32:esp32';
    if (boardType === 'esp8266')
        return 'esp8266:esp8266:nodemcuv2';
    if (boardType === 'arduino_nano')
        return 'arduino:avr:nano:cpu=atmega328old';
    if (boardType === 'arduino_mega')
        return 'arduino:avr:mega';
    return 'arduino:avr:uno';
}
async function createSketchDir(payload) {
    const sketchName = payload.sketchName?.replace(/\.ino$/i, '') || `sketch_${Date.now()}`;
    const sketchDir = path_1.default.join(os_1.default.tmpdir(), sketchName);
    await promises_1.default.mkdir(sketchDir, { recursive: true });
    await promises_1.default.writeFile(path_1.default.join(sketchDir, `${sketchName}.ino`), payload.mainCode);
    for (const [filename, content] of Object.entries(payload.extraFiles || {})) {
        if (filename === `${sketchName}.ino`)
            continue;
        const safeName = path_1.default.basename(filename);
        if (!safeName.endsWith('.ino') && !safeName.endsWith('.h') && !safeName.endsWith('.cpp'))
            continue;
        await promises_1.default.writeFile(path_1.default.join(sketchDir, safeName), content);
    }
    return { sketchDir, sketchName };
}
function extractCliError(err) {
    if (err && typeof err === 'object') {
        const e = err;
        const combined = [e.stderr, e.stdout, e.message].filter(Boolean).join('\n').trim();
        if (combined)
            return combined;
    }
    return err instanceof Error ? err.message : 'Operation failed';
}
// Initialize Express
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Resilient database initialization with in-memory fallback
let prisma = null;
let projectsMockDb = [];
let usersMockDb = [
    {
        id: 'user-default',
        email: 'student@iot.edu',
        name: 'Smart IOT User',
        passwordHash: 'password123',
    }
];
try {
    prisma = new client_1.PrismaClient();
    console.log('Prisma client initialized successfully.');
}
catch (e) {
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
        }
        else {
            const exists = usersMockDb.find(u => u.email === email);
            if (exists)
                return res.status(400).json({ error: 'Email already registered' });
            const newUser = { id: `user_${Date.now()}`, email, name, passwordHash: password };
            usersMockDb.push(newUser);
            return res.json({ id: newUser.id, email: newUser.email, name: newUser.name });
        }
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = null;
        if (prisma) {
            user = await prisma.user.findUnique({ where: { email } });
        }
        else {
            user = usersMockDb.find(u => u.email === email);
        }
        if (!user || user.passwordHash !== password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        return res.json({ id: user.id, email: user.email, name: user.name, token: 'mock-jwt-token-123' });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// 2. Project CRUD APIs
app.get('/api/projects', async (req, res) => {
    try {
        if (prisma) {
            const list = await prisma.project.findMany({ orderBy: { updatedAt: 'desc' } });
            return res.json(list);
        }
        else {
            return res.json(projectsMockDb);
        }
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
app.get('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let project = null;
        if (prisma) {
            project = await prisma.project.findUnique({ where: { id } });
        }
        else {
            project = projectsMockDb.find(p => p.id === id);
        }
        if (!project)
            return res.status(404).json({ error: 'Project not found' });
        return res.json(project);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
app.post('/api/projects', async (req, res) => {
    const { name, boardType, circuitJson, codeText, widgetsJson } = req.body;
    if (!name)
        return res.status(400).json({ error: 'Project name is required' });
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
        }
        else {
            const newProj = { id: `proj_${Date.now()}`, ...newProjData, apiKey: crypto_1.default.randomUUID(), createdAt: new Date(), updatedAt: new Date() };
            projectsMockDb.push(newProj);
            return res.json(newProj);
        }
    }
    catch (err) {
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
        }
        else {
            const idx = projectsMockDb.findIndex(p => p.id === id);
            if (idx === -1)
                return res.status(404).json({ error: 'Project not found' });
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
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
app.delete('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    try {
        if (prisma) {
            await prisma.project.delete({ where: { id } });
        }
        else {
            projectsMockDb = projectsMockDb.filter(p => p.id !== id);
        }
        return res.json({ success: true });
    }
    catch (err) {
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
        { id: 'esp8266', name: 'ESP8266 NodeMCU', fqbn: 'esp8266:esp8266:nodemcuv2' },
    ]);
});
// Serial port discovery using serialport package
app.get('/api/ports', async (_req, res) => {
    try {
        const ports = await serialport_1.SerialPort.list();
        const formattedPorts = ports.map(p => ({
            id: p.path,
            label: `${p.path} — ${p.manufacturer || p.friendlyName || 'Unknown Device'}`,
            connected: true,
        }));
        return res.json(formattedPorts);
    }
    catch (err) {
        console.error('Error fetching ports:', err);
        return res.json([
            { id: 'COM3', label: 'COM3 — Unknown', connected: false },
            { id: 'COM6', label: 'COM6 — Arduino Uno', connected: true },
        ]);
    }
});
// Upload to physical board using arduino-cli
app.post('/api/upload', async (req, res) => {
    const { codeText, boardType, port, extraFiles, sketchName } = req.body;
    if (!codeText)
        return res.status(400).json({ success: false, error: 'Source code is required' });
    if (!port)
        return res.status(400).json({ success: false, error: 'No port selected' });
    const fqbn = resolveFqbn(boardType);
    let sketchDir = '';
    try {
        const created = await createSketchDir({ mainCode: codeText, extraFiles, sketchName });
        sketchDir = created.sketchDir;
        const cli = await getArduinoCli();
        if (!cli) {
            return res.status(400).json({
                success: false,
                error: 'arduino-cli is not installed or not on PATH. Run backend/scripts/install-arduino-cli.ps1, then restart your terminal and the backend server.',
            });
        }
        const compileCmd = `"${cli}" compile --fqbn ${fqbn} "${sketchDir}"`;
        await execAsync(compileCmd, { maxBuffer: 10 * 1024 * 1024 });
        const uploadCmd = `"${cli}" upload -p ${port} --fqbn ${fqbn} "${sketchDir}"`;
        const { stdout, stderr } = await execAsync(uploadCmd, { maxBuffer: 10 * 1024 * 1024 });
        return res.json({
            success: true,
            message: `Sketch uploaded to ${boardType || 'arduino_uno'} on ${port}\n${stdout || stderr || ''}`.trim(),
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: extractCliError(err) });
    }
    finally {
        if (sketchDir) {
            try {
                await promises_1.default.rm(sketchDir, { recursive: true, force: true });
            }
            catch { /* ignore */ }
        }
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
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.json({ installed: false, message });
    }
});
// Arduino CLI Integration Endpoint for compilation
app.post('/api/compile', async (req, res) => {
    const { codeText, boardType, extraFiles, sketchName } = req.body;
    if (!codeText) {
        return res.status(400).json({ error: 'Source code is required for compilation' });
    }
    const fqbn = resolveFqbn(boardType);
    let sketchDir = '';
    try {
        const created = await createSketchDir({ mainCode: codeText, extraFiles, sketchName });
        sketchDir = created.sketchDir;
        const cli = await getArduinoCli();
        if (!cli) {
            return res.status(400).json({
                success: false,
                error: 'arduino-cli is not installed or not on PATH. Run backend/scripts/install-arduino-cli.ps1, then restart your terminal and the backend server.',
            });
        }
        const { stdout } = await execAsync(`"${cli}" compile --fqbn ${fqbn} "${sketchDir}"`, {
            maxBuffer: 10 * 1024 * 1024,
        });
        const flashMatch = stdout.match(/Sketch uses (\d+) bytes .*?(\d+) bytes/gi);
        const sramMatch = stdout.match(/Global variables use (\d+) bytes .*?(\d+) bytes/gi);
        const flashUsed = flashMatch ? parseInt(flashMatch[0].match(/(\d+)/)?.[1] || '0', 10) : 0;
        const sramUsed = sramMatch ? parseInt(sramMatch[0].match(/(\d+)/)?.[1] || '0', 10) : 0;
        return res.json({
            success: true,
            message: stdout.trim() || 'Compilation successful.',
            memory: {
                flash: { used: flashUsed, total: 32256, percentage: flashUsed ? ((flashUsed / 32256) * 100).toFixed(1) : '0' },
                sram: { used: sramUsed, total: 2048, percentage: sramUsed ? ((sramUsed / 2048) * 100).toFixed(1) : '0' },
            },
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: extractCliError(err),
        });
    }
    finally {
        if (sketchDir) {
            try {
                await promises_1.default.rm(sketchDir, { recursive: true, force: true });
            }
            catch { /* ignore */ }
        }
    }
});
// AI code generation — Gemini (default) or OpenAI-compatible
app.post('/api/ai/generate-code', async (req, res) => {
    const { prompt, boardType, context, currentCode } = req.body;
    if (!prompt?.trim()) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
    const provider = process.env.AI_PROVIDER || (geminiKey ? 'gemini' : 'openai');
    const board = boardType || 'arduino_uno';
    const systemPrompt = `You are an expert embedded systems developer for IoT projects.
Generate Arduino/C++ sketch code for ${board.replace(/_/g, ' ')}.
Rules:
- Include void setup() and void loop()
- Use standard Arduino APIs unless ESP32/ESP8266-specific code is needed
- Return ONLY the sketch code, no markdown fences
- Keep code concise and well-commented`;
    const userContent = [
        context ? `Circuit context:\n${context}` : '',
        currentCode ? `Current sketch:\n${currentCode}` : '',
        `User request: ${prompt}`,
    ]
        .filter(Boolean)
        .join('\n\n');
    try {
        if (provider === 'gemini' && geminiKey) {
            const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: `${systemPrompt}\n\n${userContent}` }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.35,
                        maxOutputTokens: 4096,
                    },
                }),
            });
            const data = (await response.json());
            if (!response.ok) {
                return res.status(response.status).json({
                    error: data.error?.message || `Gemini request failed (${response.status})`,
                });
            }
            let code = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
            code = code.replace(/^```(?:cpp|arduino|c\+\+)?\n?/i, '').replace(/\n?```$/i, '').trim();
            if (!code) {
                return res.status(502).json({ error: 'Gemini returned empty response' });
            }
            return res.json({ code, model });
        }
        if (!openaiKey) {
            return res.status(503).json({
                error: 'AI API key not configured. Add GEMINI_API_KEY (recommended) or OPENAI_API_KEY to backend/.env',
            });
        }
        const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
        const model = process.env.AI_MODEL || 'gpt-4o-mini';
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userContent },
                ],
                temperature: 0.4,
                max_tokens: 2048,
            }),
        });
        const data = (await response.json());
        if (!response.ok) {
            return res.status(response.status).json({
                error: data.error?.message || `AI request failed (${response.status})`,
            });
        }
        let code = data.choices?.[0]?.message?.content?.trim() || '';
        code = code.replace(/^```(?:cpp|arduino|c\+\+)?\n?/i, '').replace(/\n?```$/i, '').trim();
        return res.json({ code, model });
    }
    catch (err) {
        return res.status(500).json({
            error: err instanceof Error ? err.message : 'AI generation failed',
        });
    }
});
// Create HTTP server
const server = http_1.default.createServer(app);
// 3. WebSocket telemetry mock broker (port 8080)
const wss = new ws_1.WebSocketServer({ port: 8080 });
console.log('WebSocket Server started on port 8080');
const activeSockets = new Set();
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
    if (!apiKey || pin === undefined)
        return res.status(400).json({ error: 'Missing apiKey or pin' });
    let valid = false;
    if (prisma) {
        const proj = await prisma.project.findFirst({ where: { apiKey } });
        if (proj)
            valid = true;
    }
    else {
        valid = projectsMockDb.some(p => p.apiKey === apiKey);
    }
    if (!valid)
        return res.status(401).json({ error: 'Invalid API Key' });
    const payload = JSON.stringify({ [String(pin).toUpperCase()]: value, timestamp: new Date().toLocaleTimeString() });
    for (const ws of activeSockets) {
        if (ws.readyState === ws_1.WebSocket.OPEN)
            ws.send(payload);
    }
    return res.json({ success: true });
});
// Real telemetry endpoint for physical ESP32 boards
app.post('/api/telemetry', async (req, res) => {
    const { apiKey, data } = req.body;
    if (!apiKey || !data)
        return res.status(400).json({ error: 'Missing apiKey or data' });
    let valid = false;
    if (prisma) {
        const proj = await prisma.project.findFirst({ where: { apiKey } });
        if (proj)
            valid = true;
    }
    else {
        valid = projectsMockDb.some(p => p.apiKey === apiKey);
    }
    if (!valid)
        return res.status(401).json({ error: 'Invalid API Key' });
    // Broadcast to all connected websockets (in a real app, you'd filter by project)
    const telemetryString = JSON.stringify({
        ...data,
        timestamp: new Date().toLocaleTimeString(),
    });
    for (const ws of activeSockets) {
        if (ws.readyState === ws_1.WebSocket.OPEN) {
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
