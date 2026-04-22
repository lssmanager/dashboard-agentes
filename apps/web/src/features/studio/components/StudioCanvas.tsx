import { useCallback, useEffect, useMemo, useState } from 'react';

import { saveFlow, validateFlow } from '../../../lib/api';
import type { AgentSpec, FlowSpec, SkillSpec } from '../../../lib/types';
import { EditableFlowCanvas } from '../../canvas/components/EditableFlowCanvas';
import { CanvasToolbarOverlay } from './CanvasToolbarOverlay';

interface StudioCanvasProps {
  agents: AgentSpec[];
  flows: FlowSpec[];
  skills: SkillSpec[];
  onNodeSelect?: (nodeId: string | null) => void;
  selectedNodeId?: string | null;
}

export function StudioCanvas({ agents, flows, skills, onNodeSelect, selectedNodeId }: StudioCanvasProps) {
  const [editableFlow, setEditableFlow] = useState<FlowSpec | null>(flows[0] ?? null);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);

  // Undo/redo history.
  const [history, setHistory] = useState<FlowSpec[]>(editableFlow ? [editableFlow] : []);
  const [historyIndex, setHistoryIndex] = useState(0);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    const nextFlow = flows[0] ?? null;
    setEditableFlow(nextFlow);
    setHistory(nextFlow ? [nextFlow] : []);
    setHistoryIndex(0);
  }, [flows]);

  const handleFlowChange = useCallback(
    (flow: FlowSpec) => {
      setEditableFlow(flow);
      setHistory((previous) => {
        const trimmed = previous.slice(0, historyIndex + 1);
        return [...trimmed, flow];
      });
      setHistoryIndex((previous) => previous + 1);
    },
    [historyIndex],
  );

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    setEditableFlow(history[nextIndex] ?? null);
  }, [canUndo, history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    setEditableFlow(history[nextIndex] ?? null);
  }, [canRedo, history, historyIndex]);

  async function handleSave() {
    if (!editableFlow) return;
    setSaving(true);
    try {
      await saveFlow(editableFlow);
    } finally {
      setSaving(false);
    }
  }

  async function handleValidate() {
    if (!editableFlow) return;
    setValidating(true);
    try {
      await validateFlow(editableFlow.id);
    } finally {
      setValidating(false);
    }
  }

  const emptyState = useMemo(
    () => (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          color: 'var(--text-muted)',
          fontSize: 13,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            padding: '24px 32px',
            borderRadius: 16,
            border: '1.5px dashed var(--border-primary)',
            background: 'var(--shell-chip-bg)',
            textAlign: 'center',
          }}
        >
          No flow loaded
        </div>
      </div>
    ),
    [],
  );

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {editableFlow ? (
        <EditableFlowCanvas
          flow={editableFlow}
          onChange={handleFlowChange}
          agents={agents}
          skills={skills}
          onNodeSelect={onNodeSelect}
          selectedNodeId={selectedNodeId}
        />
      ) : (
        emptyState
      )}

      <CanvasToolbarOverlay
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        onValidate={handleValidate}
        canUndo={canUndo}
        canRedo={canRedo}
        saving={saving}
        validating={validating}
      />
    </div>
  );
}
