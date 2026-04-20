import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowLeftRight, GitBranch, Plus, RotateCcw, Upload } from 'lucide-react';
import { createVersion, getVersion, getVersionDiff, getVersions, rollbackVersion } from '../../../lib/api';
import type { VersionSnapshot } from '../../../lib/types';
import { SnapshotList } from '../components/SnapshotList';
import { SnapshotDiff } from '../components/SnapshotDiff';
import { RollbackConfirm } from '../components/RollbackConfirm';
import {
  ConsoleEmpty,
  ConsolePanel,
  ObservabilityShell,
  consoleToolButtonStyle,
} from '../../operations/components/ObservabilityShell';

type ViewMode = 'list' | 'diff' | 'rollback';

interface DiffResult {
  snapshotId: string;
  snapshotLabel?: string;
  snapshotCreatedAt?: string;
  diffs: Array<{ path: string; type: 'added' | 'removed' | 'changed' | 'unchanged'; before?: unknown; after?: unknown }>;
}

export default function VersionsPage() {
  const [snapshots, setSnapshots] = useState<VersionSnapshot[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<VersionSnapshot | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [label, setLabel] = useState('');

  const loadSnapshots = useCallback(async () => {
    try {
      setSnapshots(await getVersions());
    } catch {
      setSnapshots([]);
    }
  }, []);

  useEffect(() => {
    void loadSnapshots();
  }, [loadSnapshots]);

  async function handleSelect(id: string) {
    setSelectedId(id);
    setViewMode('list');
    setDiffResult(null);
    try {
      setSelectedSnapshot(await getVersion(id));
    } catch {
      setSelectedSnapshot(null);
    }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const snapshot = await createVersion(label || undefined);
      setLabel('');
      await loadSnapshots();
      setSelectedId(snapshot.id);
      setSelectedSnapshot(snapshot);
    } finally {
      setCreating(false);
    }
  }

  async function handleViewDiff() {
    if (!selectedId) return;
    setLoading(true);
    try {
      const result = await getVersionDiff(selectedId);
      setDiffResult(result);
      setViewMode('diff');
    } finally {
      setLoading(false);
    }
  }

  async function handleRollback() {
    if (!selectedId) return;
    setRollingBack(true);
    try {
      await rollbackVersion(selectedId);
      await loadSnapshots();
      setViewMode('list');
    } finally {
      setRollingBack(false);
    }
  }

  async function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const data = JSON.parse(text);
      await fetch('/api/studio/v1/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      await loadSnapshots();
    };
    input.click();
  }

  return (
    <ObservabilityShell
      title="Versions"
      description="Snapshot, diff, and rollback control for workspace state and deployment lineage."
      icon={GitBranch}
      runtimeOk={snapshots.length > 0}
      kpis={[
        { label: 'Snapshots', value: snapshots.length, helper: 'Version history depth' },
        {
          label: 'Selected',
          value: selectedSnapshot ? selectedSnapshot.id.slice(0, 8) : 'None',
          helper: selectedSnapshot ? 'Inspector target' : 'Pick from list',
        },
        {
          label: 'Mode',
          value: viewMode.toUpperCase(),
          helper: 'Inspector state',
          tone: viewMode === 'rollback' ? 'warning' : 'default',
        },
      ]}
      actions={
        <button type="button" style={buttonStyle(true)} onClick={() => void handleCreate()} disabled={creating}>
          <Plus size={14} />
          {creating ? 'Creating...' : 'Snapshot'}
        </button>
      }
    >
      <ConsolePanel title="Version Controls" description="Create/import snapshots and manage history">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <input
            type="text"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Snapshot label (optional)"
            style={{
              minWidth: 260,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--input-border)',
              background: 'var(--input-bg)',
              color: 'var(--input-text)',
              padding: '8px 12px',
              fontSize: 13,
            }}
          />
          <button type="button" style={buttonStyle()} onClick={() => void handleCreate()} disabled={creating}>
            <Plus size={14} />
            Create Snapshot
          </button>
          <button type="button" style={buttonStyle()} onClick={() => void handleImport()}>
            <Upload size={14} />
            Import
          </button>
        </div>
      </ConsolePanel>

      {snapshots.length === 0 && !creating ? (
        <ConsolePanel title="Snapshots" description="No snapshots recorded">
          <ConsoleEmpty
            title="No snapshots yet"
            description="Create a snapshot to capture the current workspace state."
          />
        </ConsolePanel>
      ) : (
        <section className="studio-console-master-detail" style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: 14 }}>
          <ConsolePanel title="Snapshot List" description={`${snapshots.length} snapshot(s)`}>
            <SnapshotList snapshots={snapshots} selectedId={selectedId ?? undefined} onSelect={handleSelect} />
          </ConsolePanel>

          <ConsolePanel title="Snapshot Inspector" description={selectedSnapshot ? selectedSnapshot.id : 'Select a snapshot'}>
            {!selectedSnapshot ? (
              <ConsoleEmpty
                title="No snapshot selected"
                description="Select a snapshot to inspect details, diff, or rollback."
              />
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button type="button" style={buttonStyle()} onClick={() => void handleViewDiff()} disabled={loading}>
                    <ArrowLeftRight size={14} />
                    {loading ? 'Loading...' : 'View Diff'}
                  </button>
                  <button type="button" style={dangerButton()} onClick={() => setViewMode('rollback')}>
                    <RotateCcw size={14} />
                    Rollback
                  </button>
                </div>

                {viewMode === 'diff' && diffResult && (
                  <SnapshotDiff
                    snapshotLabel={diffResult.snapshotLabel}
                    snapshotCreatedAt={diffResult.snapshotCreatedAt}
                    diffs={diffResult.diffs}
                  />
                )}

                {viewMode === 'rollback' && (
                  <RollbackConfirm
                    snapshot={selectedSnapshot}
                    onConfirm={handleRollback}
                    onCancel={() => setViewMode('list')}
                    loading={rollingBack}
                  />
                )}

                {viewMode === 'list' && (
                  <div style={{ display: 'grid', gap: 8 }}>
                    <MetadataRow label="Snapshot ID" value={selectedSnapshot.id} mono />
                    <MetadataRow label="Hash" value={selectedSnapshot.hash} mono />
                    <MetadataRow label="Created" value={new Date(selectedSnapshot.createdAt).toLocaleString()} />
                    <MetadataRow label="Label" value={selectedSnapshot.label || '—'} />
                    {selectedSnapshot.parentId && (
                      <MetadataRow label="Parent" value={selectedSnapshot.parentId} mono />
                    )}
                  </div>
                )}
              </div>
            )}
          </ConsolePanel>
        </section>
      )}
    </ObservabilityShell>
  );
}

function buttonStyle(primary = false): CSSProperties {
  return primary
    ? {
        ...consoleToolButtonStyle(),
        border: 'none',
        background: 'var(--btn-primary-bg)',
        color: 'var(--btn-primary-text)',
      }
    : consoleToolButtonStyle();
}

function dangerButton(): CSSProperties {
  return {
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--tone-danger-border)',
    background: 'var(--tone-danger-bg)',
    color: 'var(--tone-danger-text)',
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
  };
}

function MetadataRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-primary)',
        background: 'var(--bg-secondary)',
        padding: '10px 12px',
      }}
    >
      <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
      <p style={{ marginTop: 4, fontSize: 13, color: 'var(--text-primary)', fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)' }}>
        {value}
      </p>
    </div>
  );
}
