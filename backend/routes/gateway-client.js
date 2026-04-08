/**
 * Gateway API Client — OpenClaw Protocol v3
 *
 * Based on the official OpenClaw Gateway WebSocket protocol:
 *   https://github.com/openclaw/openclaw/blob/main/scripts/dev/gateway-ws-client.ts
 *   https://github.com/openclaw/openclaw/blob/main/src/gateway/client.ts
 *
 * Flow:
 *   1. Open WebSocket to ws://openclaw:18789
 *   2. Gateway sends event: { type:"event", event:"connect.challenge", payload:{ nonce } }
 *   3. Client sends request: { type:"req", id, method:"connect", params:{ auth:{token}, ... } }
 *   4. Gateway responds: { type:"res", id, ok:true, payload:{...} }  (hello ok)
 *   5. Now client can send RPC requests (health, agents.list, sessions.list, usage.cost, etc.)
 *
 * Methods used: health, agents.list, sessions.list, usage.cost, status
 */

const WebSocket = require('ws');
const crypto = require('crypto');
const os = require('os');

// Circular log buffer
const logBuffer = [];
const LOG_BUFFER_MAX = 100;

function gwLog(level, msg, data) {
  const entry = { time: new Date().toISOString(), level, msg };
  if (data !== undefined) entry.data = data;
  logBuffer.push(entry);
  if (logBuffer.length > LOG_BUFFER_MAX) logBuffer.shift();
  if (level === 'error') {
    console.error(`[GW] [${level}] ${msg}`, data !== undefined ? data : '');
  } else if (level === 'warn') {
    console.warn(`[GW] [${level}] ${msg}`, data !== undefined ? data : '');
  } else {
    console.log(`[GW] [${level}] ${msg}`, data !== undefined ? data : '');
  }
}

function getLogBuffer() {
  return logBuffer.slice();
}

const RAW_GATEWAY_URL = process.env.GATEWAY_URL || 'ws://openclaw:18789';
const GATEWAY_URL = RAW_GATEWAY_URL
  .replace(/^http:\/\//, 'ws://')
  .replace(/^https:\/\//, 'wss://');
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || '';
const TIMEOUT = parseInt(process.env.TIMEOUT || '10000');
const PROTOCOL_VERSION = 3;
const INSTANCE_ID = crypto.randomUUID();

// Diagnostic state
const diagnosticState = {
  lastError: null,
  lastErrorTime: null,
  connectionAttempts: 0,
  lastConnectionAttempt: null,
  handshakeErrors: [],
  lastFrameReceived: null,
  lastFrameSent: null,
  lastConnectResponse: null,
};

// Circuit breaker
const circuitBreaker = {
  failureCount: 0,
  lastFailureTime: null,
  isOpen: false,
  resetTimeout: 60000
};

// Cache
const responseCache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

// Persistent connection
let persistentWs = null;
let handshakeComplete = false;
let connectNonce = null;
let connectSent = false;
let lastTickTime = Date.now();
let tickWatchdog = null;

const pendingRequests = new Map();

/**
 * Get or create persistent WebSocket connection
 */
async function getConnection() {
  if (persistentWs?.readyState === WebSocket.OPEN && handshakeComplete) {
    return persistentWs;
  }

  if (persistentWs?.readyState === WebSocket.CONNECTING) {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (persistentWs?.readyState === WebSocket.OPEN && handshakeComplete) {
          clearInterval(checkInterval);
          resolve(persistentWs);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Connection establishment timeout'));
      }, TIMEOUT);
    });
  }

  // Clean up stale socket
  if (persistentWs) {
    try { persistentWs.close(); } catch {}
    persistentWs = null;
  }

  handshakeComplete = false;
  connectNonce = null;
  connectSent = false;

  return new Promise((resolve, reject) => {
    diagnosticState.connectionAttempts++;
    diagnosticState.lastConnectionAttempt = new Date().toISOString();
    gwLog('info', `Connecting to: ${GATEWAY_URL} (attempt #${diagnosticState.connectionAttempts})`);

    try {
      persistentWs = new WebSocket(GATEWAY_URL, {
        handshakeTimeout: 8000,
        maxPayload: 25 * 1024 * 1024,
      });

      const connectionTimeout = setTimeout(() => {
        const msg = connectSent
          ? 'Timeout waiting for connect response'
          : connectNonce
            ? 'Timeout - nonce received but connect not sent'
            : 'Timeout - no connect.challenge received from Gateway';
        gwLog('error', msg);
        diagnosticState.lastError = msg;
        diagnosticState.lastErrorTime = new Date().toISOString();
        try { persistentWs.close(); } catch {}
        reject(new Error(msg));
      }, TIMEOUT);

      persistentWs.on('open', () => {
        gwLog('info', 'WebSocket connected, waiting for connect.challenge...');
        // Gateway should send connect.challenge event automatically after open
      });

      persistentWs.on('message', (data) => {
        try {
          const raw = typeof data === 'string' ? data : Buffer.from(data).toString('utf8');
          const frame = JSON.parse(raw);
          diagnosticState.lastFrameReceived = { type: frame.type, event: frame.event, time: new Date().toISOString() };

          // Handle connect.challenge event (step 2 of handshake)
          if (frame.type === 'event' && frame.event === 'connect.challenge') {
            const nonce = frame.payload?.nonce;
            if (!nonce || typeof nonce !== 'string') {
              const err = 'connect.challenge missing nonce';
              gwLog('error', err);
              diagnosticState.lastError = err;
              reject(new Error(err));
              return;
            }
            connectNonce = nonce.trim();
            gwLog('info', 'Received connect.challenge, sending connect request...');
            sendConnectRequest(resolve, reject, connectionTimeout);
            return;
          }

          // Handle connect response (step 4 of handshake)
          if (frame.type === 'res' && frame.id) {
            const pending = pendingRequests.get(frame.id);
            if (pending) {
              // Store full frame before processing
              diagnosticState.lastConnectResponse = { ok: frame.ok, error: frame.error, payload: frame.payload, id: frame.id, receivedAt: new Date().toISOString() };
              gwLog('info', 'Received connect response frame', { ok: frame.ok, error: frame.error });
              clearTimeout(pending.timeout);
              pendingRequests.delete(frame.id);
              if (frame.ok) {
                pending.resolve(frame.payload);
              } else {
                const errMsg = frame.error?.message || JSON.stringify(frame.error);
                pending.reject(new Error(errMsg));
              }
              return;
            }
          }

          // Handle tick keepalive
          if (frame.type === 'event' && frame.event === 'tick') {
            lastTickTime = Date.now();
            return;
          }

          // Handle other events
          if (frame.type === 'event') {
            // Ignore other events silently
            return;
          }
        } catch (error) {
          gwLog('error', 'Failed to parse frame', { message: error.message });
        }
      });

      persistentWs.on('error', (error) => {
        gwLog('error', `WebSocket error: ${error.message}`, { code: error.code || 'none' });
        diagnosticState.lastError = `${error.message} (code: ${error.code || 'none'})`;
        diagnosticState.lastErrorTime = new Date().toISOString();
        diagnosticState.handshakeErrors.push({
          time: new Date().toISOString(),
          message: error.message,
          code: error.code || null
        });
        if (diagnosticState.handshakeErrors.length > 10) diagnosticState.handshakeErrors.shift();
        handshakeComplete = false;
        reject(error);
      });

      persistentWs.on('close', (code, reason) => {
        const reasonText = reason ? Buffer.from(reason).toString('utf8') : 'none';
        gwLog('info', `WebSocket closed: code=${code} reason=${reasonText}`);
        diagnosticState.lastError = `WS closed: code=${code} reason=${reasonText}`;
        diagnosticState.lastErrorTime = new Date().toISOString();
        handshakeComplete = false;
        connectNonce = null;
        connectSent = false;
        stopTickWatchdog();
        persistentWs = null;
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Send the connect request (step 3 of handshake)
 */
function sendConnectRequest(resolve, reject, connectionTimeout) {
  if (connectSent) return;
  connectSent = true;

  const id = crypto.randomUUID();
  const connectFrame = {
    type: 'req',
    id,
    method: 'connect',
    params: {
      minProtocol: PROTOCOL_VERSION,
      maxProtocol: PROTOCOL_VERSION,
      client: {
        id: 'gateway-client',
        displayName: 'OpenClaw Dashboard',
        version: '1.0.0',
        platform: os.platform(),
        mode: 'backend',
        instanceId: INSTANCE_ID,
      },
      locale: 'en-US',
      userAgent: 'openclaw-dashboard/1.0.0',
      role: 'operator',
      scopes: ['operator.read', 'operator.write', 'operator.admin', 'operator.approvals', 'operator.pairing'],
      caps: [],
      auth: {
        token: GATEWAY_API_KEY || undefined,
      },
    }
  };

  // Register pending request for connect response
  pendingRequests.set(id, {
    resolve: (payload) => {
      clearTimeout(connectionTimeout);
      handshakeComplete = true;
      gwLog('info', 'Connect handshake complete! Authenticated as operator.');
      if (payload?.tick?.intervalMs) {
        startTickWatchdog(payload.tick.intervalMs);
      } else {
        startTickWatchdog(30000);
      }
      resolve(persistentWs);
    },
    reject: (err) => {
      clearTimeout(connectionTimeout);
      gwLog('error', `Connect rejected: ${err.message}`);
      diagnosticState.lastError = `Connect rejected: ${err.message}`;
      diagnosticState.lastErrorTime = new Date().toISOString();
      reject(err);
    },
    timeout: setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error('Connect response timeout'));
    }, TIMEOUT)
  });

  diagnosticState.lastFrameSent = { type: 'req', method: 'connect', time: new Date().toISOString() };
  persistentWs.send(JSON.stringify(connectFrame));
  gwLog('info', 'Sent connect request with token auth');
}

/**
 * Tick watchdog
 */
function startTickWatchdog(intervalMs = 30000) {
  stopTickWatchdog();
  lastTickTime = Date.now();
  tickWatchdog = setInterval(() => {
    if (Date.now() - lastTickTime > intervalMs * 3) {
      gwLog('error', 'Tick timeout, closing connection');
      if (persistentWs) persistentWs.close(4000, 'tick timeout');
      handshakeComplete = false;
    }
  }, intervalMs);
}

function stopTickWatchdog() {
  if (tickWatchdog) {
    clearInterval(tickWatchdog);
    tickWatchdog = null;
  }
}

/**
 * Check circuit breaker
 */
function checkCircuitBreaker() {
  if (!circuitBreaker.isOpen) return true;
  if (Date.now() - circuitBreaker.lastFailureTime > circuitBreaker.resetTimeout) {
    circuitBreaker.isOpen = false;
    circuitBreaker.failureCount = 0;
    return true;
  }
  return false;
}

/**
 * Call Gateway RPC method
 */
async function callGateway(method, params = {}) {
  const cacheKey = `${method}:${JSON.stringify(params)}`;

  // Circuit breaker check
  if (!checkCircuitBreaker()) {
    const cached = responseCache.get(cacheKey);
    if (cached) return { result: cached.data, offline: true, cached: true };
    return { error: 'Gateway circuit breaker open', offline: true };
  }

  // Cache check
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { result: cached.data, cached: true };
  }

  try {
    const ws = await getConnection();
    const id = crypto.randomUUID();

    const result = await new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        pendingRequests.delete(id);
        reject(new Error(`Request timeout after ${TIMEOUT}ms for ${method}`));
      }, TIMEOUT);

      pendingRequests.set(id, {
        resolve: (payload) => {
          clearTimeout(timeoutHandle);
          resolve(payload);
        },
        reject: (err) => {
          clearTimeout(timeoutHandle);
          reject(err);
        },
        timeout: timeoutHandle
      });

      const frame = { type: 'req', id, method, params };
      diagnosticState.lastFrameSent = { type: 'req', method, time: new Date().toISOString() };
      ws.send(JSON.stringify(frame));
      gwLog('info', `→ ${method}`);
    });

    // Cache response
    responseCache.set(cacheKey, { data: result, timestamp: Date.now() });
    circuitBreaker.failureCount = 0;
    circuitBreaker.isOpen = false;

    return { result };
  } catch (error) {
    circuitBreaker.failureCount++;
    circuitBreaker.lastFailureTime = Date.now();
    if (circuitBreaker.failureCount >= 3) {
      circuitBreaker.isOpen = true;
      gwLog('warn', `Circuit breaker OPEN after ${circuitBreaker.failureCount} failures`);
    }
    gwLog('error', `${method} failed: ${error.message}`);

    const cached = responseCache.get(cacheKey);
    if (cached) return { result: cached.data, error: error.message, offline: true, cached: true };
    return { error: error.message, offline: true };
  }
}

/**
 * Infer provider from model name
 */
function inferProvider(modelStr) {
  if (!modelStr) return 'unknown';
  const model = modelStr.toLowerCase();
  if (model.includes('gpt') || model.includes('openai') || model.includes('o1') || model.includes('o3')) return 'openai';
  if (model.includes('grok') || model.includes('xai')) return 'xai';
  if (model.includes('claude') || model.includes('anthropic')) return 'anthropic';
  if (model.includes('gemini') || model.includes('google')) return 'google';
  if (model.includes('minimax')) return 'minimax';
  if (model.includes('unsloth') || model.includes('lmstudio')) return 'lmstudio';
  return 'unknown';
}

/**
 * Discover agents via agents.list
 */
async function discoverAgents() {
  const result = await callGateway('agents.list');

  if (result.error && !result.result) {
    gwLog('error', `Failed to discover agents: ${result.error}`);
    return { agents: [], offline: result.offline, error: result.error };
  }

  const raw = result.result;
  // agents.list returns { agents: [...] } or just an array
  const agentList = Array.isArray(raw) ? raw
    : Array.isArray(raw?.agents) ? raw.agents
    : [];

  const agents = agentList.map(agent => ({
    id: agent.id || agent.agentId || agent.name || 'unknown',
    name: agent.name || agent.displayName || agent.id || 'Unknown Agent',
    model: agent.model || agent.defaultModel || 'unknown',
    provider: inferProvider(agent.model || agent.defaultModel),
    role: agent.role || (agent.isDefault ? 'orchestrator' : 'subagent'),
    parent: agent.parentId || agent.parent || null,
    status: agent.status || 'ACTIVE',
    channels: agent.channels || [],
    lastActive: agent.lastActive || agent.lastActiveAt || null,
  }));

  gwLog('info', `Discovered ${agents.length} agent(s)`);
  return { agents, offline: result.offline };
}

/**
 * Discover workspaces (derived from agents since Gateway doesn't have workspace concept)
 */
async function discoverWorkspaces(agentsOffline = false) {
  return {
    workspaces: [{
      id: 'default',
      name: 'Default Workspace',
      type: 'orchestrator'
    }],
    offline: agentsOffline
  };
}

/**
 * Get sessions via sessions.list
 */
async function getSessions(limit = 50) {
  try {
    const result = await callGateway('sessions.list', { limit });

    if (result.offline || (result.error && !result.result)) {
      return { sessions: [], offline: result.offline };
    }

    const raw = result.result;
    const sessionList = Array.isArray(raw) ? raw
      : Array.isArray(raw?.sessions) ? raw.sessions
      : [];

    const sessions = sessionList.slice(0, limit).map(session => ({
      agent: session.agentId || session.agent || 'unknown',
      agent_name: session.agentName || session.agent || 'Unknown',
      type: session.type || 'chat',
      status: session.status || 'active',
      model: session.model || 'unknown',
      channels: session.channels || [],
      timestamp: session.timestamp || session.updatedAt || session.createdAt || Date.now(),
      id: session.sessionKey || session.id || null,
      message: session.message || session.lastMessage || '',
    }));

    gwLog('info', `Retrieved ${sessions.length} session(s)`);
    return { sessions, offline: result.offline };
  } catch (error) {
    gwLog('warn', `sessions.list error: ${error.message}`);
    return { sessions: [], offline: false };
  }
}

/**
 * Health check via health method
 */
async function healthCheck() {
  const result = await callGateway('health');
  return !!(result.result && !result.offline);
}

/**
 * Deep diagnostics for /api/diagnostics
 */
async function getDiagnostics() {
  // HTTP health check
  let httpHealth = null;
  const httpUrl = RAW_GATEWAY_URL
    .replace(/^ws:\/\//, 'http://')
    .replace(/^wss:\/\//, 'https://');
  try {
    const http = require('http');
    httpHealth = await new Promise((resolve) => {
      const req = http.get(`${httpUrl}/health`, { timeout: 3000 }, (res) => {
        let body = '';
        res.on('data', (d) => body += d);
        res.on('end', () => resolve({ status: res.statusCode, body: body.substring(0, 500) }));
      });
      req.on('error', (e) => resolve({ error: e.message, code: e.code }));
      req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
    });
  } catch (e) {
    httpHealth = { error: e.message };
  }

  // DNS check
  let dnsResult = null;
  try {
    const dns = require('dns');
    const url = new URL(GATEWAY_URL.replace('ws://', 'http://').replace('wss://', 'https://'));
    dnsResult = await new Promise((resolve) => {
      dns.lookup(url.hostname, (err, address, family) => {
        if (err) resolve({ error: err.message, code: err.code });
        else resolve({ address, family });
      });
    });
  } catch (e) {
    dnsResult = { error: e.message };
  }

  return {
    config: {
      GATEWAY_URL,
      RAW_GATEWAY_URL,
      GATEWAY_API_KEY_SET: !!GATEWAY_API_KEY,
      GATEWAY_API_KEY_LENGTH: GATEWAY_API_KEY ? GATEWAY_API_KEY.length : 0,
      TIMEOUT,
      PROTOCOL_VERSION,
    },
    connection: {
      wsReadyState: persistentWs?.readyState ?? 'no_socket',
      wsReadyStateLabel: persistentWs ? ['CONNECTING','OPEN','CLOSING','CLOSED'][persistentWs.readyState] : 'no_socket',
      handshakeComplete,
      connectNonce: connectNonce ? 'present' : 'none',
      connectSent,
      connectionAttempts: diagnosticState.connectionAttempts,
      lastConnectionAttempt: diagnosticState.lastConnectionAttempt,
      lastFrameReceived: diagnosticState.lastFrameReceived,
      lastFrameSent: diagnosticState.lastFrameSent,
      lastConnectResponse: diagnosticState.lastConnectResponse,
    },
    errors: {
      lastError: diagnosticState.lastError,
      lastErrorTime: diagnosticState.lastErrorTime,
      recentErrors: diagnosticState.handshakeErrors,
    },
    circuitBreaker: { ...circuitBreaker },
    cache: { entries: responseCache.size },
    logs: logBuffer.slice(-20),
    network: {
      dns: dnsResult,
      httpHealthCheck: httpHealth,
    },
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  callGateway,
  discoverAgents,
  discoverWorkspaces,
  getSessions,
  healthCheck,
  inferProvider,
  getDiagnostics,
  getLogBuffer
};
