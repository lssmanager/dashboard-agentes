import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import {
  applyCoreFiles,
  getBuilderAgentFunction,
  getCanonicalStudioState,
  getVersions,
  previewCoreFiles,
  rollbackCoreFiles,
} from '../../../lib/api';
import type {
  BuilderAgentFunctionOutput,
  CanonicalStudioStateResponse,
  CoreFilesPreviewResponse,
  VersionSnapshot,
} from '../../../lib/types';
import { AlertTriangle, Building2, RefreshCw, RotateCcw, Wand2 } from 'lucide-react';

export default function AgencyBuilderPage() {
  const [canonical, setCanonical] = useState<CanonicalStudioStateResponse | null>(null);
  const [builderOutput, setBuilderOutput] = useState<BuilderAgentFunctionOutput | null>(null);
  const [preview, setPreview] = useState<CoreFilesPreviewResponse | null>(null);
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const counts = useMemo(() => ({
    departments: canonical?.departments.length ?? 0,
    workspaces: canonical?.workspaces.length ?? 0,
    agents: canonical?.agents.length ?? 0,
    subagents: canonical?.subagents.length ?? 0,
    skills: canonical?.catalog.skills.length ?? 0,
    tools: canonical?.catalog.tools.length ?? 0,
  }), [canonical]);

  async function load() {
    setBusy(true);
    setError(null);
    try {
      const canonicalState = await getCanonicalStudioState();
      setCanonical(canonicalState);

      const [builder, corePreview, snapshots] = await Promise.all([
        getBuilderAgentFunction('agency', canonicalState.agency.id),
        previewCoreFiles(),
        getVersions(),
      ]);
      setBuilderOutput(builder);
      setPreview(corePreview);
      setVersions(snapshots);
      if (!selectedSnapshotId && snapshots[0]?.id) {
        setSelectedSnapshotId(snapshots[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Agency Builder');
    } finally {
      setBusy(false);
    }
  }

  async function applyChanges() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await applyCoreFiles({ applyRuntime: true });
      if (!result.ok) {
        throw new Error(`Core files apply failed: ${(result.diagnostics ?? []).join(', ')}`);
      }
      setNotice('Core files applied successfully');
      setPreview(await previewCoreFiles());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply core files');
    } finally {
      setBusy(false);
    }
  }

  async function rollbackSnapshot() {
    if (!selectedSnapshotId) {
      setError('Select a snapshot to rollback');
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await rollbackCoreFiles(selectedSnapshotId);
      if (!result.ok) {
        throw new Error(result.error ?? 'Rollback failed');
      }
      setNotice(result.message ?? 'Rollback completed');
      setPreview(await previewCoreFiles());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rollback snapshot');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gap: 16 }}>
      <section
        style={{
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-primary)',
          background: 'var(--bg-primary)',
          padding: 20,
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={18} />
            <div>
              <h1 style={{ margin: 0, fontSize: 'var(--text-xl)' }}>Agency Builder</h1>
              <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                Setup Helper for Agency/Department/Workspace with canonical model.
              </p>
            </div>
          </div>
          <button
            onClick={() => void load()}
            disabled={busy}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-primary)',
              background: 'var(--bg-secondary)',
              padding: '8px 12px',
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 10 }}>
          <Stat label="Departments" value={counts.departments} />
          <Stat label="Workspaces" value={counts.workspaces} />
          <Stat label="Agents" value={counts.agents} />
          <Stat label="Subagents" value={counts.subagents} />
          <Stat label="Skills" value={counts.skills} />
          <Stat label="Tools" value={counts.tools} />
        </div>
      </section>

      <section
        style={{
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-primary)',
          background: 'var(--bg-primary)',
          padding: 20,
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wand2 size={16} />
          <h2 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Builder Agent Function</h2>
        </div>
        {builderOutput ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{builderOutput.whatItDoes}</p>
            <MetaRow label="Inputs" values={builderOutput.inputs} />
            <MetaRow label="Outputs" values={builderOutput.outputs} />
            <MetaRow label="Skills" values={builderOutput.skills} />
            <MetaRow label="Tools" values={builderOutput.tools} />
            <MetaRow label="Collaborators" values={builderOutput.collaborators} />
          </div>
        ) : (
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>No builder output available.</p>
        )}
      </section>

      <section
        style={{
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-primary)',
          background: 'var(--bg-primary)',
          padding: 20,
          display: 'grid',
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Core Files Diff / Apply / Rollback</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => void load()}
            disabled={busy}
            style={actionBtnStyle()}
          >
            Preview
          </button>
          <button
            onClick={() => void applyChanges()}
            disabled={busy}
            style={actionBtnStyle('var(--btn-primary-bg)', 'var(--btn-primary-text)')}
          >
            Apply
          </button>
          <select
            value={selectedSnapshotId}
            onChange={(event) => setSelectedSnapshotId(event.target.value)}
            style={{
              minWidth: 220,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--input-border)',
              background: 'var(--input-bg)',
              color: 'var(--input-text)',
              padding: '8px 10px',
            }}
          >
            <option value="">Select rollback snapshot</option>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.label ?? version.id}
              </option>
            ))}
          </select>
          <button
            onClick={() => void rollbackSnapshot()}
            disabled={busy || !selectedSnapshotId}
            style={actionBtnStyle('var(--bg-secondary)', 'var(--text-primary)')}
          >
            <RotateCcw size={14} />
            Rollback
          </button>
        </div>

        {preview ? (
          <div style={{ border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead style={{ background: 'var(--bg-secondary)' }}>
                <tr>
                  <th style={thStyle}>Path</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.diff.map((item) => (
                  <tr key={item.path} style={{ borderTop: '1px solid var(--border-primary)' }}>
                    <td style={tdStyle}>{item.path}</td>
                    <td style={tdStyle}>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>No diff preview available.</p>
        )}
      </section>

      {notice && (
        <div style={{ borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.15)', padding: 12, color: 'var(--text-primary)' }}>
          {notice}
        </div>
      )}
      {error && (
        <div style={{ borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.15)', padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-primary)',
        padding: 12,
        background: 'var(--bg-secondary)',
      }}
    >
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function MetaRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8 }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
        {values.length > 0 ? values.join(', ') : 'None'}
      </span>
    </div>
  );
}

function actionBtnStyle(bg = 'var(--bg-secondary)', color = 'var(--text-primary)'): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-primary)',
    background: bg,
    color,
    padding: '8px 12px',
    cursor: 'pointer',
  };
}

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const tdStyle: CSSProperties = {
  padding: '10px 12px',
  color: 'var(--text-primary)',
};
