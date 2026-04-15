#!/usr/bin/env bash
# bootstrap-clone.sh — Cluster dashboard-agentes
#
# Usa `gh` (GitHub CLI) en lugar de `git` directo para evitar problemas
# de credenciales HTTPS en entornos donde gh ya está autenticado.
#
# PREREQUISITO: gh auth status  →  debe mostrar cuenta activa
#
# Uso (primera vez o cualquier momento):
#   bash <(gh api repos/lssmanager/dashboard-agentes/contents/bootstrap-clone.sh --jq '.content' | base64 -d)
#
# O si el repo ya está clonado:
#   bash ~/.openclaw/workspace-dashboard/dashboard-agentes/bootstrap-clone.sh

set -euo pipefail

REPO_SLUG="lssmanager/dashboard-agentes"
WORKSPACE="$HOME/.openclaw/workspace-dashboard"
REPO_DIR="$WORKSPACE/dashboard-agentes"

echo ""
echo "🦞  Bootstrap — Cluster dashboard-agentes"
echo "   Workspace : $WORKSPACE"
echo "   Repo dir  : $REPO_DIR"
echo ""

# ── 0. Verificar gh disponible y autenticado ──────────────────────────────────
if ! command -v gh &>/dev/null; then
  echo "❌  gh (GitHub CLI) no encontrado."
  echo "    Instalar: https://cli.github.com"
  exit 1
fi
if ! gh auth status &>/dev/null; then
  echo "❌  gh no está autenticado. Ejecutar: gh auth login"
  exit 1
fi
echo "✅  gh autenticado como: $(gh api user --jq '.login')"
echo ""

# ── 1. Crear workspace ────────────────────────────────────────────────────────
mkdir -p "$WORKSPACE"

# ── 2. Clonar o sincronizar con gh ────────────────────────────────────────────
if [ -d "$REPO_DIR/.git" ]; then
  echo "📦 Repo ya existe. Sincronizando con gh repo sync..."
  cd "$REPO_DIR"
  gh repo sync
  cd - >/dev/null
  echo "✅  Sync completado."
else
  echo "📦 Clonando con gh repo clone..."
  gh repo clone "$REPO_SLUG" "$REPO_DIR"
  echo "✅  Clone completado."
fi

# ── 3. AgentDirs — mapeo agentId → subdirectorio dentro del repo ──────────────
# Estos paths deben coincidir exactamente con agentDir en openclaw.json
# Principales (con canal Discord)
PRINCIPALES="orquestador-panel dev-panel connectivity-panel monitoring-panel"
# Subagentes (sin canal, invocados vía sessions_spawn)
SUBAGENTES="ui-fixer-panel api-coder-panel ws-probe-panel cost-watcher-panel"

get_subdir() {
  echo "agents/$1"
}

# ── 4. Archivos de identidad que OpenClaw inyecta como contexto ───────────────
BOOTSTRAP_FILES=(AGENTS.md SOUL.md IDENTITY.md TOOLS.md USER.md HEARTBEAT.md BOOTSTRAP.md)

# ── 5. Auditoría por agente ────────────────────────────────────────────────────
echo ""
echo "🤖 Auditando archivos de identidad por agente..."
echo ""

ALL_OK=true

for AGENT_ID in $PRINCIPALES $SUBAGENTES; do
  SUBDIR=$(get_subdir "$AGENT_ID")
  AGENT_PATH="$REPO_DIR/$SUBDIR"
  echo "  [$AGENT_ID]"
  echo "    agentDir → $AGENT_PATH"
  for FILE in "${BOOTSTRAP_FILES[@]}"; do
    if [ -f "$AGENT_PATH/$FILE" ]; then
      echo "    ✅  $FILE"
    else
      echo "    ⚠️   FALTA: $FILE"
      ALL_OK=false
    fi
  done
  echo ""
done

# ── 6. Resultado ─────────────────────────────────────────────────────────────
if [ "$ALL_OK" = true ]; then
  echo "✅  Todos los archivos de identidad presentes. Cluster listo."
else
  echo "⚠️   Faltan archivos en algunos agentDirs."
  echo "    Verifica que existan en el repo: https://github.com/$REPO_SLUG"
fi

echo ""
echo "📋 AgentDirs activos:"
for AGENT_ID in $PRINCIPALES $SUBAGENTES; do
  echo "   $AGENT_ID  →  $REPO_DIR/agents/$AGENT_ID"
done

echo ""
echo "💡 OpenClaw lee los archivos DIRECTAMENTE desde el repo clonado."
echo "   Para actualizar: cd $REPO_DIR && gh repo sync"
echo ""
echo "🔄 Para recargar el gateway sin reiniciar:"
echo "   kill -USR1 \$(pgrep -f openclaw-gateway)"
echo ""
