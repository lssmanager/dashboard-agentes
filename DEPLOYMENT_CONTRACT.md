# Deployment Contract - OpenClaw Studio

**Última actualización**: 2026-04-16
**Estado**: Ready for Coolify deployment (pending Node.js)

---

## Summary

OpenClaw Studio es un monolito Node.js:
- **Backend**: Express.js + TypeScript en `apps/api/src/`
- **Frontend**: React en `apps/web/src/` (served as static files)
- **Packages**: Shared libraries en `packages/`

Ambos sirven en **un solo puerto: 3400**

---

## Deployment Configuration

### Build Command

```bash
npm install && npm run build
```

**¿Qué hace?**
1. Instala dependencias (incluyendo zod)
2. Transpila TypeScript (`apps/**/*.ts` + `packages/**/*.ts`) → `dist/`
3. Copia archivos estáticos (templates/, .openclaw-studio/)

**Output**: `dist/` con estructura:
```
dist/
├── apps/api/src/main.js           ← Entry point
├── apps/api/src/server.js
├── apps/api/src/modules/...
├── packages/core-types/src/...
├── packages/schemas/src/...
├── packages/profile-engine/src/...
├── packages/workspace-engine/src/...
└── apps/web/src/index.html        ← Frontend HTML
```

### Start Command

```bash
npm start
```

**Equivale a:**
```bash
node dist/apps/api/src/main.js
```

### Port

**3400** (default) or `$PORT` / `$STUDIO_API_PORT` env var

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 3400 | Direct port override |
| `STUDIO_API_PORT` | 3400 | Explicit API port |
| `STUDIO_API_PREFIX` | `/api/studio/v1` | API route prefix |
| `GATEWAY_ADAPTER_URL` | `http://localhost:3000/api` | OpenClaw Gateway base URL |
| `OPENCLAW_WORKSPACE_ROOT` | `process.cwd()` | Workspace storage root |
| `NODE_ENV` | development | `production` for optimizations |

### Example for Coolify

```env
PORT=3400
STUDIO_API_PORT=3400
STUDIO_API_PREFIX=/api/studio/v1
GATEWAY_ADAPTER_URL=https://gateway.your-domain.com/api
OPENCLAW_WORKSPACE_ROOT=/app/workspaces
NODE_ENV=production
```

---

## Endpoints

### API Endpoints

All at `{baseurl}/api/studio/v1/`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/profiles` | GET | List profiles from markdown |
| `/routines` | GET | List routines |
| `/workspaces/bootstrap` | POST | Create workspace with profile |
| `/compile` | POST | Generate 12 artifacts |
| `/deploy/preview` | GET | Diff artifacts vs disk |
| `/deploy/apply` | POST | Write files to workspace |
| `/studio/state` | GET | Profiles + current workspace |
| `/gateway/health` | GET | Check OpenClaw Gateway health |

### UI Endpoints

| Path | Served | Purpose |
|------|--------|---------|
| `/` | `apps/web/src/index.html` | React app |
| `/bundle.js` | React compiled | Placeholder (not yet bundled) |
| `*` (SPA fallback) | `index.html` | Catch-all for React Router |

---

## Frontend Build Status

⚠️ **Important**: React frontend is NOT bundled yet.

**Current state:**
- ✅ React source exists: `apps/web/src/`
- ✅ TypeScript configured
- ❌ No bundler (webpack, vite, esbuild)
- ❌ `bundle.js` referenced in HTML but doesn't exist

**Two options:**

### Option A: Separate Frontend (Recommended for Coolify)

Deploy frontend separately:
```bash
# Coolify app #1: Backend
Build: npm install && npm run build
Start: npm start
Port: 3400

# Coolify app #2: Frontend
Build: npx create-react-app apps/web --template typescript
       # OR use Vite: npm create vite@latest apps/web -- --template react-ts
Start: npm run start (dev) or npm run build && serve (prod)
Port: 3000 (or proxy to 3400 via nginx)
```

### Option B: Monolith (Single Coolify App)

Bundle frontend into backend build (requires webpack added):

```bash
# In build setup:
npm install webpack webpack-cli react react-dom
npm run build  # builds both backend (tsc) + frontend (webpack)

# Serve together on port 3400
npm start
```

**Advantage**: Single deployment
**Disadvantage**: Requires webpack setup (not done yet)

---

## File Structure in Production

After `npm run build`:

```
dist/
├── apps/
│   ├── api/src/
│   │   ├── main.js                           ← ENTRY POINT
│   │   ├── server.js
│   │   ├── config.js
│   │   ├── routes.js
│   │   └── modules/
│   │       ├── profiles/
│   │       ├── routines/
│   │       ├── workspaces/
│   │       ├── compile/
│   │       ├── deploy/
│   │       ├── gateway/
│   │       └── studio/
│   └── web/src/
│       └── index.html
│
├── packages/
│   ├── core-types/src/
│   ├── schemas/src/
│   ├── profile-engine/src/
│   ├── workspace-engine/src/
│   └── skill-registry/src/
│
├── templates/                                ← NOT copied (reference in code)
│   ├── profiles/*.md + *.json
│   └── workspaces/*/routines/*.md
│
└── .openclaw-studio/                         ← Seed data (pre-created)
    ├── agents.spec.json
    ├── skills.spec.json
    ├── flows.spec.json
    ├── policies.spec.json
    └── workspace.spec.json
```

---

## Coolify Configuration

### New App in Coolify

1. **Source**: GitHub repository
   `https://github.com/lssmanager/dashboard-agentes`

2. **Build Command**:
   ```bash
   npm install && npm run build
   ```

3. **Start Command**:
   ```bash
   npm start
   ```

4. **Port**: 3400

5. **Root Directory**: `/` (default)

6. **Environment Variables**:
   ```
   STUDIO_API_PORT=3400
   NODE_ENV=production
   GATEWAY_ADAPTER_URL=https://gateway-prod.your-domain.com/api
   OPENCLAW_WORKSPACE_ROOT=/mnt/workspace-storage
   ```

7. **Persistent Volumes** (if needed):
   - `/app/.openclaw-studio` → agent/skill/flow data
   - `/mnt/workspace-storage` → generated workspace files

8. **Health Check**:
   - URL: `http://localhost:3400/api/studio/v1/studio/state`
   - Expected: 200 OK with profiles + workspace state

---

## Stopping Legacy Dashboard

### Current (Legacy)
```bash
# ❌ DO NOT USE:
npm start  # Runs backend/server.js
NODE_ENV=development node backend/server.js
```

### New (Studio)
```bash
# ✅ USE THIS:
npm start  # Runs dist/apps/api/src/main.js
NODE_ENV=development npm run dev  # ts-node with hot reload
```

In Coolify: **Remove or disable the legacy app**. The new Studio will serve both API and UI.

---

## Verification After Deploy

Once running:

### Test API
```bash
curl http://localhost:3400/api/studio/v1/profiles
# Expected: 200, JSON array of 7+ profiles
```

### Test UI
```bash
curl http://localhost:3400/
# Expected: 200, HTML (React app shell)
```

### Test Bootstrap
```bash
curl -X POST http://localhost:3400/api/studio/v1/workspaces/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "chief-of-staff",
    "workspaceSpec": {
      "name": "Production Workspace",
      "agentIds": [],
      "flowIds": []
    }
  }'
# Expected: 201, { workspaceSpec: {...}, created: true, ... }
```

### Test Compile
```bash
curl -X POST http://localhost:3400/api/studio/v1/compile
# Expected: 200, { artifacts: [...], diagnostics: [] }
```

---

## Known Limitations

1. **Frontend Not Bundled Yet**
   - React exists in source but no webpack/vite configured
   - `bundle.js` is referenced but won't exist until bundler is set up
   - Workaround: Serve React separately OR add bundler to build

2. **No Database**
   - State stored in `.openclaw-studio/*.spec.json` on disk
   - Manual scaling: requires shared filesystem

3. **No Authentication**
   - Gateway URL is not authenticated yet
   - Add `Authorization: Bearer $TOKEN` if needed

---

## Next Steps

1. **Immediate** (Phase 1):
   - Test build locally: `npm install && npm run build`
   - Test run: `npm start`
   - Test `/api/studio/v1/profiles` endpoint

2. **Short-term** (Phase 2):
   - Set up Coolify with build/start commands above
   - Point to production environment
   - Monitor 3400 port

3. **Frontend** (Phase 3):
   - Setup bundler (webpack or Vite)
   - Include in build command
   - Replace `/bundle.js` reference

4. **Scale** (Phase 4):
   - Add database backend (PostgreSQL for workspace state)
   - Add authentication (JWT/OAuth)
   - Add load balancer

---

## Summary for Coolify

| Setting | Value |
|---------|-------|
| Build | `npm install && npm run build` |
| Start | `npm start` |
| Port | 3400 |
| Persistent | `/mnt/workspace-storage` |
| Health Check | `GET /api/studio/v1/studio/state` |
| Status | ✅ Ready for deployment |

---

**Generated**: 2026-04-16
**System**: OpenClaw Studio (Backend: Express.js + TypeScript, Frontend: React)
**Next Release**: Bundle frontend into build
