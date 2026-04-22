import { useEffect, useMemo, useState, useCallback } from 'react';
import { Play, RefreshCw, XCircle } from 'lucide-react';

import { cancelRun, getDashboardRuns } from '../../../lib/api';
import { Card, EmptyState, PageHeader } from '../../../components';
import { StepBadge } from '../../../components/ui/StepBadge';
import type { CanonicalNodeLevel, RunSpec, RunStep } from '../../../lib/types';
import { RunTimeline } from '../components/RunTimeline';
import { StepDetail } from '../components/StepDetail';
import { ApprovalPanel } from '../components/ApprovalPanel';
import { useHierarchy } from '../../../lib/HierarchyContext';

function resolveActiveScope(scope: {
  agencyId?: string | null;
  departmentId?: string | null;
  workspaceId?: string | null;
  agentId?: string | null;
  subagentId?: string | null;
}): { level: CanonicalNodeLevel; id: string } {
  if (scope.subagentId) return { level: 'subagent', id: scope.subagentId };
  if (scope.agentId) return { level: 'agent', id: scope.agentId };
  if (scope.workspaceId) return { level: 'workspace', id: scope.workspaceId };
  if (scope.departmentId) return { level: 'department', id: scope.departmentId };
  return { level: 'agency', id: scope.agencyId ?? 'agency-default' };
}

export default function RunsPage() {
  const { scope, selectedLineage } = useHierarchy();
  const [runs, setRuns] = useState<RunSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<RunStep | null>(null);
  const activeScope = useMemo(() => resolveActiveScope(scope), [scope]);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const data = await getDashboardRuns(activeScope.level, activeScope.id, 250);
      setRuns(data.runs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load runs');
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [activeScope.id, activeScope.level]);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    const hasActive = runs.some((r) => r.status === 'running' || r.status === 'queued' || r.status === 'waiting_approval');
    if (!hasActive) return;

    const interval = setInterval(() => void loadRuns(), 2000);
    return () => clearInterval(interval);
  }, [runs, loadRuns]);

  const selectedRun = runs.find((r) => r.id === selectedRunId) ?? null;
  const contextLabel = selectedLineage.map((node) => node.label).join(' / ');

  async function handleCancel(runId: string) {
    await cancelRun(runId);
    await loadRuns();
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <div className="space-y-2">
            <div className="text-xs uppercase font-semibold" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              Administration / Runs
            </div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Loading run activity...
            </div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Fetching runs for the current hierarchy scope.
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {!scope.agencyId && (
        <Card>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No agency selected. Create or connect an agency to inspect runs.
          </div>
        </Card>
      )}

      <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-secondary)' }}>
        <div className="text-xs uppercase font-semibold" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
          Active Context
        </div>
        <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{contextLabel || 'No context selected'}</div>
      </div>

      <div className="flex items-center justify-between">
        <PageHeader title="Runs" icon={Play} description="Flow execution history and step traces" />
        <button
          onClick={() => void loadRuns()}
          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ color: 'var(--color-primary)', background: 'var(--color-primary-soft)' }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-secondary)' }}>
        <div className="text-xs uppercase font-semibold" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
          Surface
        </div>
        <div className="text-sm" style={{ color: 'var(--text-primary)' }}>Administration / Runs</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Total', value: runs.length, tone: 'default' },
          { label: 'Running', value: runs.filter((r) => r.status === 'running').length, tone: 'success' },
          { label: 'Awaiting Approval', value: runs.filter((r) => r.status === 'waiting_approval').length, tone: 'warning' },
          { label: 'Failed', value: runs.filter((r) => r.status === 'failed').length, tone: 'danger' },
        ].map(({ label, value, tone }) => (
          <div
            key={label}
            style={{
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-primary)',
              background: tone === 'default' ? 'var(--bg-secondary)'
                : tone === 'success' ? 'var(--tone-success-bg, rgba(16,185,129,0.08))'
                : tone === 'warning' ? 'var(--tone-warning-bg, rgba(245,158,11,0.08))'
                : 'var(--tone-danger-bg, rgba(239,68,68,0.08))',
              padding: '10px 14px',
              display: 'grid',
              gap: 3,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
              {label}
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: tone === 'default' ? 'var(--text-primary)'
                  : tone === 'success' ? 'var(--tone-success-text, #10b981)'
                  : tone === 'warning' ? 'var(--tone-warning-text, #f59e0b)'
                  : 'var(--tone-danger-text, #ef4444)',
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <Card>
          <div className="text-sm" style={{ color: 'var(--tone-danger-text, #ef4444)' }}>
            {error}
          </div>
        </Card>
      )}

      {runs.length === 0 ? (
        <EmptyState
          icon={Play}
          title="No runs for current context"
          description="Execute a flow or broaden the hierarchy context to inspect more runs."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 space-y-2">
            {runs.map((run) => (
              <button
                key={run.id}
                type="button"
                onClick={() => {
                  setSelectedRunId(run.id);
                  setSelectedStep(null);
                }}
                className="w-full text-left rounded-lg border p-3 transition-colors"
                style={{
                  borderColor: selectedRunId === run.id ? 'var(--color-primary)' : 'var(--border-primary)',
                  background: selectedRunId === run.id ? 'var(--color-primary-soft)' : 'var(--bg-secondary)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {run.flowId}
                  </span>
                  <StepBadge status={run.status} />
                </div>
                <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  {run.trigger.type} - {new Date(run.startedAt).toLocaleString()}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {run.steps.length} step{run.steps.length !== 1 ? 's' : ''}
                  {run.error && <span style={{ color: 'var(--tone-danger-text, #ef4444)' }}> - {run.error}</span>}
                </div>
              </button>
            ))}
          </div>

          <div className="md:col-span-2 space-y-4">
            {selectedRun ? (
              <>
                <div className="rounded-lg border p-4 flex items-center justify-between" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-secondary)' }}>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Run {selectedRun.id.slice(0, 8)}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Flow: {selectedRun.flowId} - Trigger: {selectedRun.trigger.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StepBadge status={selectedRun.status} size="md" />
                    {(selectedRun.status === 'running' || selectedRun.status === 'queued') && (
                      <button
                        onClick={() => void handleCancel(selectedRun.id)}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium"
                        style={{ background: 'var(--tone-danger-text, #ef4444)', color: '#fff' }}
                      >
                        <XCircle size={12} />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-secondary)' }}>
                  <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Timeline
                  </h4>
                  <RunTimeline steps={selectedRun.steps} onStepClick={setSelectedStep} selectedStepId={selectedStep?.id} />
                </div>

                {selectedRun.steps
                  .filter((s) => s.status === 'waiting_approval')
                  .map((s) => (
                    <ApprovalPanel key={s.id} runId={selectedRun.id} step={s} onResolved={() => void loadRuns()} />
                  ))}

                {selectedStep && <StepDetail step={selectedStep} />}
              </>
            ) : (
              <div className="rounded-lg border p-8 text-center" style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-secondary)' }}>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Select a run to view its timeline and step details
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
