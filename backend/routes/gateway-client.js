/**
 * Gateway API Client (WebSocket JSON-RPC 2.0)
 * Handles all communication with the OpenClaw Gateway via WebSocket
 * with:
 * - Circuit breaker (60s timeout after 3 failures)
 * - Retry logic (3 retries with exponential backoff)
 * - Response caching (5 minutes per endpoint)
 * - Automatic error recovery
 */

const WebSocket = require('ws');
const crypto = require('crypto');

const GATEWAY_URL = (process.env.GATEWAY_URL || 'ws://openclaw:18789')
  .replace(/^http:\/\//, 'ws://')
  .replace(/^https:\/\//, 'wss://');
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || '';
const TIMEOUT = parseInt(process.env.TIMEOUT || '5000');

// Circuit breaker state
const circuitBreaker = {
  failureCount: 0,
  lastFailureTime: null,
  isOpen: false,
  resetTimeout: 60000  // 60 seconds
};

// Response cache: { endpoint: { data, timestamp } }
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Persistent WebSocket connection
let persistentWs = null;
const pendingRequests = new Map(); // id → { resolve, reject, timeout }

/**
 * Get or create persistent WebSocket connection
 */
function getConnection() {
  // Return existing connection if open
  if (persistentWs?.readyState === WebSocket.OPEN) {
    return persistentWs;
  }

  // Create new connection
  persistentWs = new WebSocket(GATEWAY_URL, {
    headers: GATEWAY_API_KEY
      ? { 'Authorization': `Bearer ${GATEWAY_API_KEY}` }
      : {}
  });

  // Handle incoming messages
  persistentWs.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      const pending = pendingRequests.get(msg.id);

      if (pending) {
        clearTimeout(pending.timeout);
        pendingRequests.delete(msg.id);
        pending.resolve(msg);
      }
    } catch (error) {
      console.error('[GW] Failed to parse message:', error);
    }
  });

  // Handle connection close
  persistentWs.on('close', () => {
    console.log('[GW] WebSocket connection closed, will reconnect on next request');
    persistentWs = null;
  });

  // Handle connection errors
  persistentWs.on('error', (error) => {
    console.error('[GW] WebSocket error:', error.message);
  });

  return persistentWs;
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
        const delay = Math.pow(3, attempt) * 100; // 100ms, 300ms, 900ms
        console.log(`[GW] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Call Gateway method via WebSocket JSON-RPC 2.0
 */
async function callGateway(method, params = {}) {
  // Generate unique request ID
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

  // Execute with retry
  try {
    const result = await retryWithBackoff(async () => {
      return new Promise((resolve, reject) => {
        const timeoutHandle = setTimeout(() => {
          pendingRequests.delete(id);
          reject(new Error(`Request timeout after ${TIMEOUT}ms`));
        }, TIMEOUT);

        try {
          const ws = getConnection();

          // Helper to wait for connection and send
          const sendRequest = () => {
            if (ws.readyState === WebSocket.OPEN) {
              console.log(`[GW] Sending request: ${method}`, params);

              pendingRequests.set(id, {
                resolve: (msg) => {
                  clearTimeout(timeoutHandle);
                  if (msg.error) {
                    console.error(`[GW] Error response for ${method}:`, msg.error);
                    reject(new Error(msg.error.message || JSON.stringify(msg.error)));
                  } else {
                    console.log(`[GW] Success response for ${method}:`, msg.result);
                    resolve(msg.result);
                  }
                },
                reject: (err) => {
                  clearTimeout(timeoutHandle);
                  reject(err);
                },
                timeout: timeoutHandle
              });

              ws.send(JSON.stringify({
                jsonrpc: '2.0',
                id,
                method,
                params
              }));
            } else {
              // Still connecting, retry soon
              setTimeout(sendRequest, 50);
            }
          };

          // Initiate send
          sendRequest();
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
async function discoverWorkspaces() {
  const agentsResult = await discoverAgents();
  if (agentsResult.offline) return { workspaces: [], offline: true };

  // Agrupar por parent: null = orchestrator workspace
  const wsMap = new Map();
  for (const agent of agentsResult.agents) {
    const wsId = agent.parent ? 'default' : agent.id;
    if (!wsMap.has('default')) {
      wsMap.set('default', { id: 'default', name: 'Default Workspace', type: 'orchestrator' });
    }
  }
  return { workspaces: Array.from(wsMap.values()), offline: false };
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
