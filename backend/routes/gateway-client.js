/**
 * Gateway API Client
 * Handles all communication with the OpenClaw Gateway with:
 * - Circuit breaker (60s timeout after 3 failures)
 * - Retry logic (3 retries with exponential backoff)
 * - Response caching (5 minutes per endpoint)
 * - Automatic discovery fallback
 */

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://openclaw-gateway:18789';
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
 * Build authorization headers
 */
function buildHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  if (GATEWAY_API_KEY) {
    headers['Authorization'] = `Bearer ${GATEWAY_API_KEY}`;
  }
  return headers;
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
 * GET request to Gateway with retry and caching
 */
async function gatewayGet(path) {
  // Check circuit breaker
  if (!checkCircuitBreaker()) {
    console.log(`[GW] Circuit breaker OPEN, using cached data for ${path}`);
    const cached = responseCache.get(path);
    if (cached) {
      const ageMs = Date.now() - cached.timestamp;
      return {
        data: cached.data,
        offline: true,
        cached: true,
        age_ms: ageMs
      };
    }
    return { error: 'Gateway circuit breaker open', offline: true };
  }

  // Check cache first
  const cached = responseCache.get(path);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const ageMs = Date.now() - cached.timestamp;
    return { data: cached.data, cached: true, age_ms: ageMs };
  }

  // Fetch with retry
  try {
    const result = await retryWithBackoff(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

      try {
        const response = await fetch(`${GATEWAY_URL}${path}`, {
          headers: buildHeaders(),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } finally {
        clearTimeout(timeoutId);
      }
    });

    // Cache successful response
    responseCache.set(path, {
      data: result,
      timestamp: Date.now()
    });

    // Reset circuit breaker on success
    circuitBreaker.failureCount = 0;
    circuitBreaker.isOpen = false;

    return { data: result };
  } catch (error) {
    circuitBreaker.failureCount++;
    circuitBreaker.lastFailureTime = Date.now();

    if (circuitBreaker.failureCount >= 3) {
      circuitBreaker.isOpen = true;
      console.log(`[GW] Circuit breaker OPEN after ${circuitBreaker.failureCount} failures`);
    }

    console.error(`[GW] Request failed for ${path}: ${error.message}`);

    // Return cached data if available
    const cached = responseCache.get(path);
    if (cached) {
      const ageMs = Date.now() - cached.timestamp;
      return {
        data: cached.data,
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
 * Discover agents from Gateway API
 */
async function discoverAgents() {
  // Try GET /api/agents first
  const agentsResult = await gatewayGet('/api/agents');
  if (agentsResult.data && Array.isArray(agentsResult.data)) {
    return { agents: agentsResult.data, offline: agentsResult.offline };
  }

  // Fallback: extract from /api/status → sessions.recent
  const statusResult = await gatewayGet('/api/status');
  if (!statusResult.data) {
    return { agents: [], offline: statusResult.offline, error: statusResult.error };
  }

  const sessions = statusResult.data.sessions?.recent || [];
  const seen = new Set();
  const agents = [];

  for (const session of sessions) {
    const agentId = session.agent || 'unknown';
    if (!seen.has(agentId)) {
      seen.add(agentId);
      agents.push({
        id: agentId,
        name: session.agent_name || agentId,
        model: session.model || 'unknown',
        provider: inferProvider(session.model),
        role: 'subagent',
        parent: null,
        status: 'ACTIVE',
        channels: session.channels || []
      });
    }
  }

  return { agents, offline: statusResult.offline };
}

/**
 * Discover workspaces from Gateway API
 */
async function discoverWorkspaces() {
  // Try GET /api/workspaces
  const wsResult = await gatewayGet('/api/workspaces');
  if (wsResult.data && Array.isArray(wsResult.data)) {
    return { workspaces: wsResult.data, offline: wsResult.offline };
  }

  // Fallback: create default workspace
  return {
    workspaces: [{
      id: 'default',
      name: 'Default Workspace',
      type: 'orchestrator'
    }],
    offline: wsResult.offline
  };
}

/**
 * Get recent sessions
 */
async function getSessions(limit = 50) {
  const result = await gatewayGet(`/api/sessions?limit=${limit}&order=recent`);
  if (!result.data) {
    return { sessions: [], offline: result.offline };
  }
  return { sessions: result.data.sessions || result.data || [], offline: result.offline };
}

/**
 * Get cost data
 */
async function getCosts(period = '7days') {
  const result = await gatewayGet(`/api/costs?period=${period}`);
  if (!result.data) {
    return { costs: null, offline: result.offline };
  }
  return { costs: result.data, offline: result.offline };
}

/**
 * Health check
 */
async function healthCheck() {
  const result = await gatewayGet('/api/status');
  return result.data ? true : false;
}

module.exports = {
  gatewayGet,
  discoverAgents,
  discoverWorkspaces,
  getSessions,
  getCosts,
  healthCheck,
  inferProvider
};
