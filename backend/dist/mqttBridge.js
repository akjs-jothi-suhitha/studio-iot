"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMqttStatus = getMqttStatus;
exports.startMqttBridge = startMqttBridge;
exports.publishMqttCommand = publishMqttCommand;
exports.stopMqttBridge = stopMqttBridge;
const mqtt_1 = __importDefault(require("mqtt"));
let client = null;
let bridgeStatus = { connected: false, message: 'MQTT paused. Add project credentials and press Start.' };
let lastErrorMessage = '';
let lastErrorAt = 0;
function getMqttStatus() {
    return { ...bridgeStatus };
}
function startMqttBridge(options) {
    const host = (options.brokerUrl || process.env.HIVEMQ_BROKER_URL || '').trim();
    const username = (options.username || process.env.HIVEMQ_USERNAME || '').trim();
    const password = (options.password || process.env.HIVEMQ_PASSWORD || '').trim();
    const isPlaceholder = host.includes('your-cluster') ||
        username.includes('your_') ||
        password.includes('your_');
    if (!host || !username || !password || isPlaceholder) {
        bridgeStatus = {
            connected: false,
            message: 'MQTT not configured. Enter HiveMQ broker URL, username, and password for this project.',
        };
        options.onStatus?.(bridgeStatus);
        return;
    }
    client?.end(true);
    const url = host.startsWith('mqtt') ? host : `mqtts://${host}:8883`;
    bridgeStatus = { connected: false, message: `Connecting to ${host}...` };
    options.onStatus?.(bridgeStatus);
    try {
        client = mqtt_1.default.connect(url, {
            username,
            password,
            rejectUnauthorized: true,
            reconnectPeriod: 5000,
        });
        client.on('connect', () => {
            bridgeStatus = { connected: true, message: `Connected to ${host}` };
            options.onStatus?.(bridgeStatus);
            client?.subscribe('device/+/telemetry');
            client?.subscribe('device/+/status');
            console.log('[MQTT] Bridge connected:', host);
        });
        client.on('message', (topic, payload) => {
            try {
                const text = payload.toString();
                const data = JSON.parse(text);
                const parts = topic.split('/');
                const deviceId = parts[1] || 'unknown';
                const normalized = { ...data, deviceId, mqttTopic: topic };
                if (data.gas !== undefined)
                    normalized.V0 = data.gas;
                if (data.alarm !== undefined)
                    normalized.V4 = data.alarm ? 1 : 0;
                if (data.temperature !== undefined)
                    normalized.V1 = data.temperature;
                if (data.humidity !== undefined)
                    normalized.V7 = data.humidity;
                if (data.online !== undefined)
                    normalized.V6 = data.online ? 1 : 0;
                options.broadcast(JSON.stringify(normalized), deviceId);
            }
            catch {
                options.broadcast(JSON.stringify({ raw: payload.toString(), topic }), undefined);
            }
        });
        client.on('error', (err) => {
            bridgeStatus = { connected: false, message: err.message };
            options.onStatus?.(bridgeStatus);
            const now = Date.now();
            if (err.message !== lastErrorMessage || now - lastErrorAt > 30000) {
                console.warn('[MQTT] Error:', err.message);
                lastErrorMessage = err.message;
                lastErrorAt = now;
            }
        });
        client.on('close', () => {
            bridgeStatus = { connected: false, message: 'MQTT disconnected — reconnecting…' };
            options.onStatus?.(bridgeStatus);
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'MQTT init failed';
        bridgeStatus = { connected: false, message };
        options.onStatus?.(bridgeStatus);
    }
}
function publishMqttCommand(deviceId, payload) {
    if (!client?.connected)
        return false;
    const topic = `device/${deviceId}/commands`;
    client.publish(topic, JSON.stringify(payload));
    return true;
}
function stopMqttBridge() {
    client?.end(true);
    client = null;
    bridgeStatus = { connected: false, message: 'MQTT paused. Press Start when you want cloud data.' };
}
