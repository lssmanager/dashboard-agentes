#!/usr/bin/env bash
# bootstrap-clone.sh — Cluster dashboard-agentes
# Clona el repo en workspace-dashboard y copia los archivos de identidad
# a las rutas exactas que OpenClaw espera (agentDir de cada agente).
#
# Uso:
#   bash ~/.openclaw/workspace-dashboard/dashboard-agentes/bootstrap-clone.sh
# O bien desde cualquier lugar:
#   bash <(curl -fsSL https://raw.githubusercontent.com/lssmanager/dashboard-agentes/main/bootstrap-clone.sh)

set -euo pipefail

WORKSPACE="$HOME/.openclaw/workspace-dashboard"
REPO_URL="https://github.com/lssmanager/dashboard-agentes.git"
REPO_DIR="$WORKSPACE/dashboard-agentes"

echo "🔧 Bootstrap Cluster dashboard-agentes"
echo "   Workspace: $WORKSPACE"

# 1. Crear workspace si no existe
mkdir -p "$WORKSPACE"

# 2. Clonar o actualizar el repo
if [ -d "$REPO_DIR/.git" ]; then
  echo "📦 Actualizando repo existente..."
  git -C "$REPO_DIR" pull --ff-only
else
  echo "📦 Clonando repo..."
  git clone "$REPO_URL" "$REPO_DIR"
fi

# 3. Lista de agentes con sus directorios de destino
# Formato: AGENT_ID:SUBDIR_EN_REPO
declare -A AGENTS
AGENTS=(
  [orquestador-panel]="agents/orquestador-panel"
  [dev-panel]="agents/dev-panel"
  [connectivity-panel]="agents/connectivity-panel"
  [monitoring-panel]="agents/monitoring-panel"
  [ui-fixer-panel]="agents/ui-fixer-panel"
  [api-coder-panel]="agents/api-coder-panel"
  [ws-probe-panel]="agents/ws-probe-panel"
  [cost-watcher-panel]="agents/cost-watcher-panel"
)

# 4. Archivos de identidad a copiar
FILES=(AGENTS.md SOUL.md IDENTITY.md TOOLS.md USER.md HEARTBEAT.md BOOTSTRAP.md)

# 5. Para cada agente: verificar que los archivos existen en el repo
echo ""
echo "🤖 Verificando archivos por agente..."
for AGENT_ID in "${!AGENTS[@]}"; do
  AGENT_SUBDIR="${AGENTS[$AGENT_ID]}"
  SRC_DIR="$REPO_DIR/$AGENT_SUBDIR"
  echo ""
  echo "  [$AGENT_ID] → $SRC_DIR"
  for FILE in "${FILES[@]}"; do
    if [ -f "$SRC_DIR/$FILE" ]; then
      echo "    ✅ $FILE"
    else
      echo "    ⚠️  FALTA: $FILE (agentDir lo necesita)"
    fi
  done
done

echo ""
echo "✅ Bootstrap completo."
echo ""
echo "📋 AgentDirs configurados en openclaw.json:"
for AGENT_ID in "${!AGENTS[@]}"; do
  AGENT_SUBDIR="${AGENTS[$AGENT_ID]}"
  echo "   $AGENT_ID → $REPO_DIR/$AGENT_SUBDIR"
done
echo ""
echo "💡 Los agentDirs en openclaw.json YA apuntan a estas rutas."
echo "   No se necesita copiar — OpenClaw lee directamente desde el repo clonado."
echo ""
echo "🔄 Para recargar el gateway después de un git pull:"
echo "   kill -USR1 \$(pgrep -f openclaw-gateway)"
