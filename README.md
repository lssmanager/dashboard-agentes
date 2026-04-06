# OpenClaw Dashboard

A real-time monitoring dashboard for OpenClaw AI agents. Connects exclusively to the OpenClaw Gateway via REST API, with zero hardcoded agent data.

## Features

- **Auto-Discovery**: Agents and workspaces discovered dynamically from Gateway API
- **Real-Time Monitoring**: Live agent status, sessions, and costs
- **Interactive Topology**: D3.js visualization with 3 layout modes (orchestrator, peer-to-peer, hierarchical)
- **Graceful Disconnection**: Cached data fallback when Gateway is unreachable
- **Dark Theme**: Modern, responsive UI with dark mode
- **Mobile Friendly**: Works on desktop, tablet, and mobile devices

## Architecture

**Backend**: Node.js + Express
- Gateway client with circuit breaker, retry logic, and response caching
- API routes for dashboard state, topology, and YAML generation
- Persistent storage for topology configuration only (not agent data)

**Frontend**: Vanilla JavaScript + D3.js
- State-driven rendering with in-memory state management
- No external CSS frameworks (custom dark theme)
- Auto-refresh every 30 seconds (configurable)

**Deployment**: Nixpacks-compatible (Coolify, Railway)
- No Dockerfile or docker-compose needed
- Environment variables configured in deployment UI
- Persistent volume for `/app/data`

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Running OpenClaw Gateway (or mock it for testing)

### Setup

```bash
# Install dependencies
npm install

# Set environment variables
export GATEWAY_URL=http://localhost:18789
export PORT=3000

# Start the server
npm start
```

Navigate to http://localhost:3000

## Deployment

### Using Nixpacks (Coolify/Railway)

1. **Push repo to Git** (GitHub, GitLab, etc.)
2. **Create new service in Coolify/Railway**
3. **Select Git repository** and this project
4. **Configure Environment Variables:**
   - `GATEWAY_URL` = `http://openclaw-gateway:18789` (or FQDN)
   - `GATEWAY_API_KEY` = `<Bearer token if needed>`
   - `REFRESH_INTERVAL` = `30000`
   - `TIMEOUT` = `5000`
   - `PORT` = `3000`
   - `NODE_ENV` = `production`

5. **Add Persistent Storage:**
   - Mount `/app/data` volume
   - This preserves topology configuration across redeployments

6. **Configure Network:**
   - Attach to same Docker network as openclaw-gateway
   - Services can reference each other by service name

7. **Deploy** - Nixpacks automatically builds and starts the dashboard

## API Endpoints

### Dashboard State
```
GET /api/dashboard/state
Returns: { connected, workspaces, agents, sessions, costs, lastFetch }
```

### Topology Configuration
```
GET /api/topology
Returns: topology JSON (topology type + parent relationships)

POST /api/topology
Body: { workspaceId, type, parentChildMap, description }
Returns: updated topology
```

### YAML Generation
```
POST /api/agents/yaml
Body: { id, name, model, provider, role, parentId, channels }
Returns: { yaml }
```

### Health Check
```
GET /api/health
Returns: { status, timestamp }
```

## Data Storage

### Local Persistence (`/app/data/workspaces-topology.json`)

Stores ONLY topology configuration - NOT agent models or session data:

```json
{
  "workspaces": {
    "workspace_id": {
      "type": "orchestrator",
      "description": "optional",
      "parentChildMap": {
        "agent_main": ["agent_sub1", "agent_sub2"]
      }
    }
  },
  "last_cache": {
    "agents": [...],        // populated on refresh
    "workspaces": [...],    // populated on refresh
    "timestamp": 0
  }
}
```

**Agent Models, Providers, Session Data**: Always fetched fresh from Gateway API on refresh, never stored locally.

## Gateway API Integration

### Required Endpoints

The dashboard calls these Gateway endpoints:

- `GET /api/health` - Connectivity check
- `GET /api/agents` - Full agent list (or falls back to `/api/status`)
- `GET /api/workspaces` - Workspace list
- `GET /api/sessions?limit=50&order=recent` - Recent session activity
- `GET /api/costs?period=7days` - 7-day cost breakdown
- `GET /api/status` - Fallback for agent discovery if `/api/agents` returns 404

### Fallback Strategy

If Gateway endpoints are unavailable:
1. Dashboard shows red "OFFLINE" badge
2. All agents display as "OFFLINE" status
3. Cached data from last successful fetch is displayed
4. Dashboard continues polling every 30s for reconnection
5. On reconnect, data automatically refreshes

### Provider Detection

Models are mapped to providers automatically:
- `gpt-*` → openai
- `grok-*` → xai
- `claude-*` → anthropic
- `minimax/*` → minimax
- `unsloth/*` → lmstudio

## Configuration

### Environment Variables

```bash
GATEWAY_URL              # Gateway API base URL (default: http://openclaw-gateway:18789)
GATEWAY_API_KEY          # Optional Bearer token for Gateway authentication
REFRESH_INTERVAL         # Auto-refresh interval in ms (default: 30000)
TIMEOUT                  # Request timeout in ms (default: 5000)
PORT                     # Server port (default: 3000)
DATA_FILE                # Path to topology JSON (default: /app/data/workspaces-topology.json)
NODE_ENV                 # "development" or "production"
```

### Port Forwarding

For local development with Docker:
```bash
docker run -p 3000:3000 \
  -e GATEWAY_URL=http://host.docker.internal:18789 \
  openclaw-dashboard
```

## UI Components

### Summary Cards
- Active Agents (last hour)
- Total Subagents
- Hierarchical Connections
- Peer Connections
- External Channels

### Topology Visualization
- **Orchestrator**: Central main agent with subagents arranged below
- **Peer-to-Peer**: Circular layout with full interconnection
- **Hierarchical**: Tree layout with multiple levels
- Zoom and pan support
- Hover for detailed tooltips
- Color-coded by agent

### Agents Table
- Sortable columns
- Live/activity status color coding
- Model, provider, channels per agent

### Channels Panel
- List of all configured channels
- Agents per channel

### Costs Panel
- 7-day total spend
- Token counts (input/output)
- Daily bar chart

### Activity Feed
- Last 10 unique sessions
- Timestamps in local time
- Agent color coding

## Security

- API keys only used in backend (never sent to frontend)
- All agent/workspace names sanitized before DOM insertion (XSS prevention)
- CORS configured to same-origin in production
- Rate limit: 10 requests/second to backend API
- No localStorage (state in-memory only)
- No authentication UI (assumed secured by network)

## Development

### File Structure
```
openclaw-dashboard/
├── backend/
│   ├── server.js         # Express entry point
│   └── routes/
│       ├── api.js        # Dashboard API endpoints
│       └── gateway-client.js  # Gateway HTTP client
├── frontend/
│   ├── index.html        # Main HTML
│   ├── app.js            # State management
│   ├── services/
│   │   └── gateway-client.js  # Fetch wrapper
│   ├── components/       # UI components
│   └── styles.css        # Dark theme styles
├── data/
│   └── workspaces-topology.json  # Local topology cache
├── package.json
└── nixpacks.toml         # Nixpacks build config
```

### Adding Components

1. Create new file in `frontend/components/`
2. Implement class with `render(data)` method
3. Import in `frontend/index.html` before `app.js`
4. Initialize in `initializeComponents()` in `app.js`

### Testing Locally

```bash
# Terminal 1: Start Gateway (or mock)
# Terminal 2: Start Dashboard
npm start

# Terminal 3: Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/dashboard/state
```

## Troubleshooting

### Dashboard shows OFFLINE
- Check `GATEWAY_URL` environment variable
- Verify Gateway is running and accessible
- Check network connectivity and firewall rules
- Review browser console for error messages

### Agents not appearing
- Verify Gateway API returns `/api/agents` or `/api/status`
- Check agent model names for provider detection
- Refresh dashboard manually or wait 30s for auto-refresh

### Data not persisting
- Verify persistent volume mounted to `/app/data`
- Check file permissions in data directory
- Ensure `DATA_FILE` path is correct

### Performance issues
- Reduce `REFRESH_INTERVAL` if needed (impacts API calls)
- Limit agent count if topology visualization is slow
- Check network latency to Gateway

## License

MIT
