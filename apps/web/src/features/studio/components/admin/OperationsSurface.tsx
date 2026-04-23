import { useEffect, useState, type CSSProperties } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, AlertCircle, PlayCircle, DollarSign, Shield } from 'lucide-react';

import type { DashboardOperationsDto, DashboardScopeCapabilities, TopologyRuntimeAction } from '../../../../lib/types';
import { getDashboardOperationsBudgets, getDashboardOperationsPolicies } from '../../../../lib/api';

interface BudgetEntry {
  id: string; name: string; scope: string; limitUsd: number;
  periodDays: number; currentUsageUsd: number; enabled: boolean;
  createdAt: string; updatedAt: string;
}

interface PolicyEntry {
  id: string; name: string; [key: string]: unknown;
}

const ACTION_META: Record<TopologyRuntimeAction, { label: string; description: string }> = {
  pause:      { label: 'Pause',      description: 'Suspend active processing' },
  reactivate: { label: 'Reactivate', description: 'Resume paused operations' },
  redirect:   { label: 'Redirect',   description: 'Move to a different target' },
  continue:   { label: 'Continue',   description: 'Signal to proceed' },
  connect:    { label: 'Connect',    description: 'Initiate runtime connection' },
  disconnect: { label: 'Disconnect', description: 'Terminate runtime connection' },
};

const ALL_ACTIONS: TopologyRuntimeAction[] = ['connect', 'disconnect', 'pause', 'reactivate', 'redirect', 'continue'];

export function OperationsSurface({
  data,
  busyAction,
  capabilities,
  onRuntimeAction,
  level,
  id,
}: {
  data: DashboardOperationsDto;
  busyAction: TopologyRuntimeAction | null;
  capabilities?: DashboardScopeCapabilities;
  onRuntimeAction: (action: TopologyRuntimeAction) => void;
  level?: string;
  id?: string;
}) {
  const supportedActions = capabilities?.topologyActions ?? [];
  const hasCapabilities = supportedActions.length > 0;

  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
  const [policies, setPolicies] = useState<PolicyEntry[]>([]);

  useEffect(() => {
    if (!level || !id) return;
    const lvl = level as import('../../../../lib/types').CanonicalNodeLevel;
    void getDashboardOperationsBudgets(lvl, id).then((r) => setBudgets(r.budgets)).catch(() => null);
    void getDashboardOperationsPolicies(lvl, id).then((r) => setPolicies(r.policies)).catch(() => null);
  }, [level, id]);

  return (
    <section style={panelStyle}>
      {/* ── Header + Runtime Actions ───────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'start', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Operations</h2>
          {!hasCapabilities && capabilities !== undefined && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              No runtime actions available at this scope.
            </p>
          )}
        </div>

        {/* Action buttons — shown for all actions, gated by capability */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ALL_ACTIONS.map((action) => {
            const meta = ACTION_META[action];
            const isSupported = capabilities === undefined || supportedActions.includes(action);
            const isBusy = busyAction === action;

            return (
              <button
                key={action}
                type="button"
                title={isSupported ? meta.description : `${meta.label}: not supported at this scope`}
                onClick={() => isSupported && !busyAction && onRuntimeAction(action)}
                disabled={!isSupported || busyAction !== null}
                style={{
                  ...actionBtnBase,
                  background: isBusy
                    ? 'var(--color-primary-soft)'
                    : isSupported
                      ? 'var(--bg-secondary)'
                      : 'var(--bg-tertiary)',
                  color: isBusy
                    ? 'var(--color-primary)'
                    : isSupported
                      ? 'var(--text-primary)'
                      : 'var(--text-muted)',
                  borderColor: isBusy
                    ? 'var(--color-primary)'
                    : isSupported
                      ? 'var(--border-primary)'
                      : 'transparent',
                  cursor: isSupported && !busyAction ? 'pointer' : 'not-allowed',
                  opacity: !isSupported ? 0.5 : 1,
                  position: 'relative',
                }}
              >
                {isBusy && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      border: '2px solid var(--color-primary)',
                      borderTopColor: 'transparent',
                      animation: 'spin 0.8s linear infinite',
                      display: 'inline-block',
                      marginRight: 4,
                    }}
                  />
                )}
                {meta.label}
                {!isSupported && capabilities !== undefined && (
                  <span style={{ marginLeft: 3, fontSize: 9, opacity: 0.7 }}>⊘</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Metrics strip ─────────────────────────────────────────────── */}
      <div style={metaGrid}>
        <Metric
          label="Recent runs"
          value={String(data.recentRuns.length)}
          tone={data.recentRuns.some((r) => r.status === 'failed') ? 'danger' : 'default'}
        />
        <Metric label="Recent sessions" value={String(data.recentSessions.length)} tone="default" />
        <Metric
          label="Approval queue"
          value={String(data.approvalQueue.length)}
          tone={data.approvalQueue.length > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* ── Pending actions ───────────────────────────────────────────── */}
      {data.pendingActions.length > 0 && (
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={sectionLabelStyle}>Pending Actions</div>
          {data.pendingActions.map((item) => (
            <PendingActionRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* ── Approval queue ────────────────────────────────────────────── */}
      {data.approvalQueue.length > 0 && (
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={sectionLabelStyle}>Awaiting Approval</div>
          {data.approvalQueue.map((item) => (
            <ApprovalRow key={`${item.runId}-${item.stepId}`} item={item} />
          ))}
        </div>
      )}

      {/* ── Recent runs ───────────────────────────────────────────────── */}
      {data.recentRuns.length > 0 && (
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={sectionLabelStyle}>Recent Runs</div>
          {data.recentRuns.slice(0, 5).map((run) => (
            <RecentRunRow key={run.id} run={run} />
          ))}
        </div>
      )}

      {/* ── Deployment timeline ───────────────────────────────────────── */}
      {data.deploymentState.timeline.length > 0 && (
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={sectionLabelStyle}>Deployment Timeline</div>
          {data.deploymentState.timeline.slice(0, 4).map((entry, idx) => (
            <div key={idx} style={timelineRowStyle}>
              <Clock size={11} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {entry.type}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>{entry.detail}</span>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                {new Date(entry.at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Governance: Budgets ───────────────────────────────────────── */}
      {budgets.length > 0 && (
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <DollarSign size={11} style={{ color: 'var(--text-muted)' }} />
            <div style={sectionLabelStyle}>Budgets</div>
          </div>
          {budgets.slice(0, 5).map((b) => {
            const pct = b.limitUsd > 0 ? Math.min(100, (b.currentUsageUsd / b.limitUsd) * 100) : 0;
            const tone = pct > 90 ? 'var(--tone-danger-text, #ef4444)' : pct > 75 ? 'var(--tone-warning-text, #f59e0b)' : 'var(--tone-success-text, #10b981)';
            return (
              <div key={b.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{b.name}</span>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 6, textTransform: 'uppercase' }}>{b.scope} · {b.periodDays}d</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: tone }}>
                    ${b.currentUsageUsd.toFixed(2)} / ${b.limitUsd.toFixed(2)}
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: 'var(--border-primary)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: tone, borderRadius: 99, transition: 'width 0.4s' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Governance: Policies ─────────────────────────────────────── */}
      {policies.length > 0 && (
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={11} style={{ color: 'var(--text-muted)' }} />
            <div style={sectionLabelStyle}>Policies ({policies.length})</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {policies.slice(0, 8).map((p) => (
              <span key={p.id} style={{ fontSize: 10, fontWeight: 600, borderRadius: 999, padding: '2px 8px', background: 'var(--color-primary-soft)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}>
                {String(p.name)}
              </span>
            ))}
            {policies.length > 8 && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>+{policies.length - 8} more</span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Metric({ label, value, tone }: { label: string; value: string; tone: 'default' | 'warning' | 'danger' }) {
  const bg =
    tone === 'warning' ? 'var(--tone-warning-bg, rgba(245,158,11,0.08))'
    : tone === 'danger'  ? 'var(--tone-danger-bg, rgba(239,68,68,0.08))'
    : 'var(--bg-secondary)';
  const color =
    tone === 'warning' ? 'var(--tone-warning-text, #f59e0b)'
    : tone === 'danger'  ? 'var(--tone-danger-text, #ef4444)'
    : 'var(--text-primary)';

  return (
    <div style={{ ...metricStyle, background: bg }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 22, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

const SEVERITY_CONFIG = {
  info:     { Icon: AlertCircle, color: 'var(--color-primary)', bg: 'var(--color-primary-soft)' },
  warning:  { Icon: AlertTriangle, color: 'var(--tone-warning-text, #f59e0b)', bg: 'var(--tone-warning-bg, rgba(245,158,11,0.08))' },
  critical: { Icon: XCircle, color: 'var(--tone-danger-text, #ef4444)', bg: 'var(--tone-danger-bg, rgba(239,68,68,0.08))' },
} as const;

function PendingActionRow({ item }: { item: { id: string; type: string; message: string; severity: 'info' | 'warning' | 'critical' } }) {
  const cfg = SEVERITY_CONFIG[item.severity];
  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        border: `1px solid var(--border-primary)`,
        background: cfg.bg,
        padding: '8px 10px',
        display: 'flex',
        gap: 8,
        alignItems: 'start',
      }}
    >
      <cfg.Icon size={13} style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{item.type}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.message}</div>
      </div>
    </div>
  );
}

function ApprovalRow({ item }: { item: { runId: string; stepId: string; nodeId: string; requestedAt: string } }) {
  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--tone-warning-border, rgba(245,158,11,0.3))',
        background: 'var(--tone-warning-bg, rgba(245,158,11,0.08))',
        padding: '8px 10px',
        display: 'flex',
        gap: 8,
        alignItems: 'start',
      }}
    >
      <Clock size={13} style={{ color: 'var(--tone-warning-text, #f59e0b)', flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
          Run <code style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{item.runId.slice(0, 10)}</code>
          {' → '}Step <code style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{item.nodeId}</code>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
          Requested {new Date(item.requestedAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

const RUN_STATUS_COLOR: Record<string, string> = {
  completed: 'var(--tone-success-text, #10b981)',
  failed:    'var(--tone-danger-text, #ef4444)',
  running:   'var(--color-primary)',
  queued:    'var(--text-muted)',
};

function RecentRunRow({ run }: { run: { id: string; flowId: string; status: string; startedAt: string; completedAt?: string; costUsd: number } }) {
  const statusColor = RUN_STATUS_COLOR[run.status] ?? 'var(--text-muted)';
  const StatusIcon = run.status === 'completed' ? CheckCircle : run.status === 'failed' ? XCircle : PlayCircle;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-primary)' }}>
      <StatusIcon size={13} style={{ color: statusColor, flexShrink: 0 }} />
      <code style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
        {run.id.slice(0, 8)}
      </code>
      <span style={{ fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
        {run.flowId}
      </span>
      <span style={{ fontSize: 11, color: statusColor, flexShrink: 0, fontWeight: 700, textTransform: 'capitalize' }}>
        {run.status}
      </span>
      {run.costUsd > 0 && (
        <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
          ${run.costUsd.toFixed(4)}
        </span>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const panelStyle: CSSProperties = {
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-primary)',
  padding: 16,
  display: 'grid',
  gap: 14,
};

const actionBtnBase: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  padding: '6px 10px',
  fontSize: 11,
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
};

const metaGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
  gap: 10,
};

const metricStyle: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-secondary)',
  padding: 10,
};

const sectionLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
};

const timelineRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'start',
  gap: 6,
  fontSize: 11,
  padding: '4px 0',
  borderBottom: '1px solid var(--border-primary)',
};
