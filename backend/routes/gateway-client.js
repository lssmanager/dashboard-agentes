/**
 * Gateway API Client (WebSocket Protocol v1.0)
 * OpenClaw Gateway uses proprietary frame protocol, NOT JSON-RPC 2.0
 * Frame types: RequestFrame, ResponseFrame, EventFrame
 * Features: Persistent connection, handshake auth, tick keepalive, multiplexed requests
 */

const WebSocket = require('ws');
const crypto = require('crypto');
const os = require('os');

const GATEWAY_URL = (process.env.GATEWAY_URL || 'ws://openclaw:18789')
  .replace(/^http:\/\//, 'ws://')
  .replace(/^https:\/\//, 'wss://');
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || '';
const TIMEOUT = parseInt(process.env.TIMEOUT || '5000');
const PROTOCOL_VERSION = 1;
const INSTANCE_ID = crypto.randomUUID();

// Circuit breaker state
const circuitBreaker = {
  failureCount: 0,
  lastFailureTime: null,
  isOpen: false,
  resetTimeout: 60000  // 60 seconds
};

// Response cache
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Persistent WebSocket connection
let persistentWs = null;
let handshakeComplete = false;
let tickIntervalMs = 30000;
let lastTickTime = Date.now();
let tickWatchdog = null;

const pendingRequests = new Map(); // id → { resolve, reject, timeout }
const eventListeners = new Map();  // event → callback

/**
 * Get or create persistent WebSocket connection with handshake
 */
async function getConnection() {
  // Return existing connection if open and authed
  if (persistentWs?.readyState === WebSocket.OPEN && handshakeComplete) {
    return persistentWs;
  }

  // Create new connection or return connecting one
  if (persistentWs?.readyState === WebSocket.CONNECTING) {
    // Wait for connection to establish
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (persistentWs?.readyState === WebSocket.OPEN && handshakeComplete) {
          clearInterval(checkInterval);
          resolve(persistentWs);
        }
      }, 50);
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Connection establishment timeout'));
      }, TIMEOUT);
    });
  }

  // Create new connection
  return new Promise((resolve, reject) => {
    try {
      persistentWs = new WebSocket(GATEWAY_URL, {
        headers: GATEWAY_API_KEY
          ? { 'Authorization': `Bearer ${GATEWAY_API_KEY}` }
          : {}
      });

      const connectionTimeout = setTimeout(() => {
        persistentWs.close();
        reject(new Error('Connection timeout - no challenge received'));
      }, TIMEOUT);

      persistentWs.on('open', () => {
        console.log('[GW] WebSocket connected, awaiting challenge...');
      });

      persistentWs.on('message', (data) => {
        try {
          const frame = JSON.parse(data);

          // Handle challenge during handshake
          if (frame.event === 'connect.challenge' && !handshakeComplete) {
            clearTimeout(connectionTimeout);
            handleChallenge(frame.payload.nonce)
              .then(() => {
                handshakeComplete = true;
                console.log('[GW] Handshake complete, authenticated');
                startTickWatchdog();
                resolve(persistentWs);
              })
              .catch(reject);
            return;
          }

          // Handle tick keepalive
          if (frame.event === 'tick') {
            lastTickTime = Date.now();
            return;
          }

          // Handle response frames (for requests)
          if (frame.type === 'res' && frame.id) {
            const pending = pendingRequests.get(frame.id);
            if (pending) {
              clearTimeout(pending.timeout);
              pendingRequests.delete(frame.id);

              if (frame.ok) {
                pending.resolve(frame.payload);
              } else {
                pending.reject(new Error(
                  frame.error?.message || JSON.stringify(frame.error)
                ));
              }
            }
            return;
          }

          // Handle event frames (push from Gateway)
          if (frame.event) {
            const listener = eventListeners.get(frame.event);
            if (listener) listener(frame.payload);
            return;
          }
        } catch (error) {
          console.error('[GW] Failed to parse frame:', error);
        }
      });

      persistentWs.on('error', (error) => {
        console.error('[GW] WebSocket error:', error.message);
        handshakeComplete = false;
        reject(error);
      });

      persistentWs.on('close', () => {
        console.log('[GW] WebSocket closed');
        handshakeComplete = false;
        stopTickWatchdog();
        persistentWs = null;
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Handle connect challenge (part of handshake)
 */
async function handleChallenge(nonce) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const connectTimeout = setTimeout(() => {
      reject(new Error('Connect handshake timeout'));
    }, TIMEOUT);

    pendingRequests.set(id, {
      resolve: (payload) => {
        clearTimeout(connectTimeout);
        resolve();
      },
      reject: (err) => {
        clearTimeout(connectTimeout);
        reject(err);
      },
      timeout: connectTimeout
    });

    const connectFrame = {
      type: 'req',
      id,
      method: 'connect',
      params: {
        minProtocol: PROTOCOL_VERSION,
        maxProtocol: PROTOCOL_VERSION,
        client: {
          id: 'dashboard',
          displayName: 'OpenClaw Dashboard',
          version: '1.0.0',
          platform: os.platform(),
          mode: 'backend',
          instanceId: INSTANCE_ID
        },
        caps: ['sessions', 'agents', 'config', 'nodes', 'chat'],
        role: 'operator',
        scopes: ['operator.admin'],
        auth: {
          token: GATEWAY_API_KEY || undefined,
          deviceToken: null
        },
        device: {
          id: INSTANCE_ID,
          nonce
        }
      }
    };

    persistentWs.send(JSON.stringify(connectFrame));
    console.log('[GW] Sent connect request with nonce');
  });
}

/**
 * Start tick watchdog (detects connection loss)
 */
function startTickWatchdog() {
  stopTickWatchdog();
  lastTickTime = Date.now();

  tickWatchdog = setInterval(() => {
    const timeSinceLastTick = Date.now() - lastTickTime;
    if (timeSinceLastTick > tickIntervalMs * 2) {
      console.error('[GW] Tick timeout detected, closing connection');
      if (persistentWs) {
        persistentWs.close(4000, 'tick timeout');
      }
      handshakeComplete = false;
    }
  }, tickIntervalMs);
}

/**
 * Stop tick watchdog
 */
function stopTickWatchdog() {
  if (tickWatchdog) {
    clearInterval(tickWatchdog);
    tickWatchdog = null;
  }
}

/**
 * Check if circuit should be open
 */
function checkCircuitBreaker() {
  if (!circuitBreaker.isOpen) return true;

  const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailureTime;
  if (timeSinceLastFailure > circuitBreaker.resetTimeout) {
    console.log('[GW] Circuit breaker reset');
    circuitBreaker.isOpen = false;
    circuitBreaker.failureCount = 0;
    return true;
  }
  return false;
}

/**
 * Exponential backoff retry
 */
async function retryWithBackoff(fn, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(3, attempt) * 100;
        console.log(`[GW] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Call Gateway method via persistent WebSocket
 */
async function callGateway(method, params = {}) {
  const id = crypto.randomUUID();
  const cacheKey = `${method}:${JSON.stringify(params)}`;

  // Check circuit breaker
  if (!checkCircuitBreaker()) {
    console.log(`[GW] Circuit breaker OPEN, using cached data for ${method}`);
    const cached = responseCache.get(cacheKey);
    if (cached) {
      const ageMs = Date.now() - cached.timestamp;
      return {
        result: cached.data,
        offline: true,
        cached: true,
        age_ms: ageMs
      };
    }
    return { error: 'Gateway circuit breaker open', offline: true };
  }

  // Check cache first
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const ageMs = Date.now() - cached.timestamp;
    return { result: cached.data, cached: true, age_ms: ageMs };
  }

  try {
    const result = await retryWithBackoff(async () => {
      return new Promise(async (resolve, reject) => {
        const timeoutHandle = setTimeout(() => {
          pendingRequests.delete(id);
          reject(new Error(`Request timeout after ${TIMEOUT}ms`));
        }, TIMEOUT);

        try {
          const ws = await getConnection();

          // Send request frame
          const frame = {
            type: 'req',
            id,
            method,
            params
          };

          console.log(`[GW] Sending request: ${method}`, params);
          ws.send(JSON.stringify(frame));

          // Register pending request
          pendingRequests.set(id, {
            resolve: (payload) => {
              clearTimeout(timeoutHandle);
              console.log(`[GW] Success response for ${method}`);
              resolve(payload);
            },
            reject: (err) => {
              clearTimeout(timeoutHandle);
              console.error(`[GW] Error response for ${method}:`, err.message);
              reject(err);
            },
            timeout: timeoutHandle
          });
        } catch (error) {
          clearTimeout(timeoutHandle);
          reject(error);
        }
      });
    });

    // Cache successful response
    responseCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    // Reset circuit breaker on success
    circuitBreaker.failureCount = 0;
    circuitBreaker.isOpen = false;

    return { result };
  } catch (error) {
    circuitBreaker.failureCount++;
    circuitBreaker.lastFailureTime = Date.now();

    if (circuitBreaker.failureCount >= 3) {
      circuitBreaker.isOpen = true;
      console.log(`[GW] Circuit breaker OPEN after ${circuitBreaker.failureCount} failures`);
    }

    console.error(`[GW] Request failed for ${method}: ${error.message}`);

    // Return cached data if available
    const cached = responseCache.get(cacheKey);
    if (cached) {
      const ageMs = Date.now() - cached.timestamp;
      return {
        result: cached.data,
        error: error.message,
        offline: true,
        cached: true,
        age_ms: ageMs
      };
    }

    return { error: error.message, offline: true };
  }
}

/**
 * Discover providers from model name
 */
function inferProvider(modelStr) {
  if (!modelStr) return 'unknown';
  const model = modelStr.toLowerCase();

  if (model.includes('gpt')) return 'openai';
  if (model.includes('grok')) return 'xai';
  if (model.includes('claude')) return 'anthropic';
  if (model.includes('minimax')) return 'minimax';
  if (model.includes('unsloth') || model.includes('lmstudio')) return 'lmstudio';

  return 'unknown';
}

/**
 * Discover agents from Gateway via node.list
 */
async function discoverAgents() {
  const result = await callGateway('node.list');

  if (result.error) {
    console.error('[API] Failed to discover agents:', result.error);
    return { agents: [], offline: result.offline, error: result.error };
  }

  const raw = result.result;
  const nodeList = Array.isArray(raw) ? raw
    : Array.isArray(raw?.nodes) ? raw.nodes
    : Array.isArray(raw?.agents) ? raw.agents
    : [];
  const agents = [];

  for (const node of nodeList) {
    agents.push({
      id: node.id || node.name || 'unknown',
      name: node.name || node.id || 'Unknown Agent',
      model: node.model || 'unknown',
      provider: inferProvider(node.model),
      role: node.role || 'subagent',
      parent: node.parent_id || null,
      status: node.status || 'ACTIVE',
      channels: node.channels || []
    });
  }

  console.log(`[API] Discovered ${agents.length} agent(s)`);
  return { agents, offline: result.offline };
}

/**
 * Discover workspaces from Gateway API (derived from agents)
 */
async function discoverWorkspaces(agentsOffline = false) {
  // Gateway doesn't expose workspaces endpoint — return default with real offline status
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
 * Get recent sessions (with silent fallback)
 */
async function getSessions(limit = 50) {
  try {
    const result = await callGateway('sessions.list', { limit });

    if (result.offline || result.error) {
      console.warn('[API] Sessions endpoint offline or errored, returning empty');
      return { sessions: [], offline: result.offline };
    }

    const sessionList = Array.isArray(result.result) ? result.result : [];
    const sessions = sessionList.slice(0, limit).map(session => ({
      agent: session.agent_id || session.agent || 'unknown',
      agent_name: session.agent_name || session.agent || 'Unknown',
      type: session.type || 'chat',
      status: session.status || 'active',
      model: session.model || 'unknown',
      channels: session.channels || [],
      timestamp: session.timestamp || Date.now(),
      message: session.message || session.last_message || ''
    }));

    console.log(`[API] Retrieved ${sessions.length} session(s)`);
    return { sessions, offline: result.offline };
  } catch (error) {
    console.warn(`[API] Sessions.list not available: ${error.message}, returning empty`);
    return { sessions: [], offline: false };
  }
}

/**
 * Health check via node.list
 */
async function healthCheck() {
  const result = await callGateway('node.list');
  return !!(result.result && !result.offline);
}

module.exports = {
  callGateway,
  discoverAgents,
  discoverWorkspaces,
  getSessions,
  healthCheck,
  inferProvider
};
