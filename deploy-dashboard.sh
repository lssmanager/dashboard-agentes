#!/usr/bin/env bash
# ============================================================
#  deploy-dashboard.sh
#  Deploy EXCLUSIVO del cluster dashboard-agentes
#  repo: github.com/lssmanager/dashboard-agentes
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OC_DIR="${HOME}/.openclaw"
CONFIG_SRC="${SCRIPT_DIR}/openclaw-dashboard.json"
CONFIG_DST="${OC_DIR}/openclaw-dashboard.json"

echo ""
echo "🦞  OpenClaw — Deploy cluster dashboard-agentes"
echo "================================================"

# 0. Dependencias
for cmd in git node npm; do
  command -v "$cmd" &>/dev/null || { echo "❌ Falta: $cmd"; exit 1; }
done
command -v openclaw &>/dev/null || npm install -g openclaw
echo "✅  Dependencias OK"

# 1. Directorios
echo ""
echo "📁  Creando directorios..."
mkdir -p "${OC_DIR}/workspace"
mkdir -p "${OC_DIR}/workspace-dashboard"

# 2. Clonar / actualizar repo
echo ""
echo "📦  Sincronizando dashboard-agentes..."
DEST="${OC_DIR}/workspace-dashboard/dashboard-agentes"
if [ -d "${DEST}/.git" ]; then
  echo "  🔄  Actualizando (git pull)..."
  git -C "$DEST" pull --quiet
else
  echo "  ⬇️   Clonando..."
  git clone --quiet https://github.com/lssmanager/dashboard-agentes "$DEST"
  echo "  ✅  Clonado"
fi

# 3. Verificar agentDirs
echo ""
echo "🔍  Verificando agentes..."
check() {
  local dir="$1" label="$2"
  [ -d "$dir" ] \
    && echo "  ✅  ${label}  ($(ls "$dir"/*.md 2>/dev/null | wc -l) .md)" \
    || echo "  ❌  ${label} — no encontrado: ${dir}"
}
check "${DEST}/agents/orquestador-panel"  "orquestador-panel  (Panel 🗂️)"
check "${DEST}/agents/dev-panel"          "dev-panel          (Dev Panel 💻)"
check "${DEST}/agents/connectivity-panel" "connectivity-panel (Conn 🔌)"
check "${DEST}/agents/monitoring-panel"   "monitoring-panel   (Monitor 📊)"
check "${DEST}/agents/ui-fixer-panel"     "ui-fixer-panel     (UI Fixer 🎨)"
check "${DEST}/agents/api-coder-panel"    "api-coder-panel    (API Coder 🔗)"
check "${DEST}/agents/ws-probe-panel"     "ws-probe-panel     (WS Probe 🔍)"
check "${DEST}/agents/cost-watcher-panel" "cost-watcher-panel (Cost Watcher 💰)"

# 4. Config
echo ""
echo "⚙️   Copiando openclaw-dashboard.json..."
if [ ! -f "$CONFIG_SRC" ]; then
  curl -fsSL https://raw.githubusercontent.com/lssmanager/dashboard-agentes/main/openclaw-dashboard.json -o "$CONFIG_SRC"
fi
cp "$CONFIG_SRC" "$CONFIG_DST"

# 5. Token
if grep -q "REEMPLAZAR-openssl-rand-hex-32" "$CONFIG_DST"; then
  TOKEN=$(openssl rand -hex 32)
  sed -i "s/REEMPLAZAR-openssl-rand-hex-32/${TOKEN}/" "$CONFIG_DST"
  echo "  🔑  Token generado — GUÁRDALO: ${TOKEN}"
fi
echo "  ✅  Config: ${CONFIG_DST}"

# 6. Listo
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅  Deploy dashboard-agentes completado"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  🚀  Arrancar:"
echo "      openclaw start --config ~/.openclaw/openclaw-dashboard.json"
echo ""
echo "  Canal → Agente"
echo "  #panel     1491563594184130723  → Panel 🗂️"
echo "  #devia     1491582962637209750  → Dev Panel 💻"
echo "  #contreras 1491583250974511244  → Conn 🔌"
echo "  #monica    1491583332478095400  → Monitor 📊"
echo ""
echo "  SUBAGENTES (sin canal, via sessions_spawn):"
echo "  ui-fixer · api-coder · ws-probe · cost-watcher"
echo ""
