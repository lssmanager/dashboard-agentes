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

const GATEWAY_URL = process.env.GATEWAY_URL || 'ws://openclaw:18789';
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
        let connected = false;
        let timeoutHandle = null;
        let messageHandler = null;

        try {
          const ws = new WebSocket(GATEWAY_URL);

          timeoutHandle = setTimeout(() => {
            ws.close();
            reject(new Error(`WebSocket timeout after ${TIMEOUT}ms`));
          }, TIMEOUT);

          ws.on('open', () => {
            connected = true;
            console.log(`[GW] WebSocket connected to ${GATEWAY_URL}`);

            // Send JSON-RPC 2.0 request
            const jsonrpc = {
              jsonrpc: '2.0',
              id,
              method,
              params
            };

            console.log(`[GW] Sending request: ${method}`, params);
            ws.send(JSON.stringify(jsonrpc));
          });

          messageHandler = (data) => {
            try {
              const message = JSON.parse(data);

              // Check if this is our response
              if (message.id === id) {
                clearTimeout(timeoutHandle);
                ws.close();

                if (message.error) {
                  console.error(`[GW] Error response for ${method}:`, message.error);
                  reject(new Error(message.error.message || JSON.stringify(message.error)));
                } else {
                  console.log(`[GW] Success response for ${method}:`, message.result);
                  resolve(message.result);
                }
              }
            } catch (parseError) {
              console.error(`[GW] Failed to parse message:`, parseError);
            }
          };

          ws.on('message', messageHandler);

          ws.on('error', (error) => {
            clearTimeout(timeoutHandle);
            console.error(`[GW] WebSocket error for ${method}:`, error.message);
            reject(error);
          });

          ws.on('close', () => {
            clearTimeout(timeoutHandle);
            if (connected) {
              console.log(`[GW] WebSocket closed for ${method}`);
            }
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

  const nodeList = result.result || [];
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
 * Discover workspaces from Gateway API
 */
async function discoverWorkspaces() {
  // Gateway doesn't expose explicit workspaces endpoint
  // Return default workspace (agents will be grouped into it)
  return {
    workspaces: [{
      id: 'default',
      name: 'Default Workspace',
      type: 'orchestrator'
    }],
    offline: false
  };
}

/**
 * Get recent sessions
 */
async function getSessions(limit = 50) {
  const result = await callGateway('sessions.list', { limit });

  if (result.error) {
    console.error('[API] Failed to get sessions:', result.error);
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
}

/**
 * Get cost data
 */
async function getCosts(period = '7days') {
  // Gateway doesn't expose costs endpoint
  // Return null (frontend will handle gracefully)
  return { costs: null, offline: false };
}

/**
 * Health check via config.get
 */
async function healthCheck() {
  const result = await callGateway('config.get');
  return result.result ? true : false;
}

module.exports = {
  callGateway,
  discoverAgents,
  discoverWorkspaces,
  getSessions,
  getCosts,
  healthCheck,
  inferProvider
};
