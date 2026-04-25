import { useEffect, useState } from 'react';
import {
  applyCoreFiles,
  createVersion,
  diffCoreFiles,
  generateAgentCoreFiles,
  getVersions,
  rollbackVersion,
} from '../../../../lib/api';
import type { DeployPreview, VersionSnapshot } from '../../../../lib/types';

type Props = {
  agentId: string;
};

const FILES = ['IDENTITY.md', 'SOUL.md', 'USER.md', 'TOOLS.md', 'AGENTS.md', 'BOOTSTRAP.md'];

export function AgentVersionsSection({ agentId }: Props) {
  const [generated, setGenerated] = useState<DeployPreview | null>(null);
  const [snapshots, setSnapshots] = useState<VersionSnapshot[]>([]);
  const [activeVersion, setActiveVersion] = useState<string>('draft');
  const [activeFile, setActiveFile] = useState<string>(FILES[0]);
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [busy, setBusy] = useState<string>('');

  useEffect(() => {
    void (async () => {
      try {
        const versions = await getVersions();
        setSnapshots(versions);
      } catch {
        setSnapshots([]);
      }
    })();
  }, []);

  const runGenerate = async () => {
    setBusy('generate');
    try {
      const preview = await generateAgentCoreFiles(agentId);
      setGenerated(preview);
    } finally {
      setBusy('');
    }
  };

  const handleExport = async () => {
    // TODO: Implement export functionality
  };

  const handleRollback = async () => {
    if (!activeVersion || activeVersion === 'draft') return;
    setBusy('rollback');
    try {
      await rollbackVersion(activeVersion);
      await runGenerate();
    } finally {
      setBusy('');
    }
  };

  const handleApply = async () => {
    setBusy('apply');
    try {
      if (activeVersion !== 'draft' && generated) {
        await applyCoreFiles(agentId, generated);
      }
    } finally {
      setBusy('');
    }
  };

  const toggleDiff = async () => {
    if (!isDiffMode) {
      setBusy('diff');
      try {
        const diff = await diffCoreFiles();
        // Store diff result
      } finally {
        setBusy('');
      }
    }
    setIsDiffMode(!isDiffMode);
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        height: '100%',
        minHeight: 400,
      }}
    >
      {/* Left column: snapshots */}
      <div
        style={{
          width: 200,
          flexShrink: 0,
          borderRight: '1px solid var(--builder-border-subtle)',
          paddingRight: 16,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: 'var(--builder-text-muted)',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          SNAPSHOTS
        </div>

        {snapshots.map((v) => (
          <div
            key={v.id}
            onClick={() => setActiveVersion(v.id)}
            style={{
              padding: '8px 10px',
              borderRadius: 6,
              cursor: 'pointer',
              marginBottom: 2,
              borderLeft: activeVersion === v.id ? '2px solid var(--builder-accent)' : '2px solid transparent',
              background: activeVersion === v.id ? 'var(--builder-bg-active)' : 'transparent',
              transition: 'var(--transition)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: 12,
                  color: activeVersion === v.id ? 'var(--builder-text-primary)' : 'var(--builder-text-secondary)',
                }}
              >
                {v.label || v.id}
              </span>
              {v.isDraft && (
                <span
                  style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 20,
                    background: 'var(--builder-accent-dim)',
                    color: 'var(--builder-text-accent)',
                    border: '1px solid var(--builder-border-accent)',
                  }}
                >
                  DRAFT
                </span>
              )}
            </div>
            {v.date && (
              <div style={{ fontSize: 11, color: 'var(--builder-text-disabled)', marginTop: 2 }}>
                {v.date}
              </div>
            )}
          </div>
        ))}

        <button
          onClick={runGenerate}
          disabled={busy === 'generate'}
          style={{
            marginTop: 12,
            color: 'var(--builder-text-accent)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            textAlign: 'left',
            padding: '6px 10px',
            opacity: busy === 'generate' ? 0.6 : 1,
          }}
        >
          + Create snapshot
        </button>
      </div>

      {/* Right column: preview */}
      <div
        style={{
          flex: 1,
          paddingLeft: 20,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* File tabs */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 12,
            borderBottom: '1px solid var(--builder-border-subtle)',
            paddingBottom: 8,
            overflowX: 'auto',
          }}
        >
          {FILES.map((file) => (
            <button
              key={file}
              onClick={() => setActiveFile(file)}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                background: activeFile === file ? 'var(--builder-bg-tertiary)' : 'transparent',
                border: `1px solid ${activeFile === file ? 'var(--builder-border-strong)' : 'transparent'}`,
                color: activeFile === file ? 'var(--builder-text-primary)' : 'var(--builder-text-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {file}
            </button>
          ))}
        </div>

        {/* Diff toggle & content */}
        {isDiffMode ? (
          <div style={{ display: 'flex', gap: 0, flex: 1 }}>
            <div
              style={{
                flex: 1,
                padding: 16,
                background: 'rgba(252,129,129,0.04)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                whiteSpace: 'pre-wrap',
                color: 'var(--builder-text-primary)',
                borderRight: '1px solid var(--builder-border-subtle)',
                overflowY: 'auto',
              }}
            >
              {/* Deployed content in red */}
            </div>
            <div
              style={{
                flex: 1,
                padding: 16,
                background: 'rgba(104,211,145,0.04)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                whiteSpace: 'pre-wrap',
                color: 'var(--builder-text-primary)',
                overflowY: 'auto',
              }}
            >
              {/* Draft content in green */}
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--builder-border-subtle)',
              borderRadius: 6,
              padding: 16,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--builder-text-primary)',
              whiteSpace: 'pre-wrap',
              overflowY: 'auto',
              minHeight: 280,
            }}
          >
            {generated?.artifacts?.find((a) => a.name === activeFile)?.content || (
              <span style={{ color: 'var(--builder-text-disabled)' }}>
                {`# ${activeFile}\n# (Fill in the ${activeFile.replace('.md', '')} section to generate this file.)`}
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {[
            { label: isDiffMode ? '✕ Close diff' : '↔ Compare with deployed', action: toggleDiff },
            { label: '↓ Export .zip', action: handleExport },
            ...(activeVersion !== 'draft' ? [{ label: '↩ Rollback', action: handleRollback }] : []),
            { label: '✓ Apply / Publish', action: handleApply },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              disabled={busy !== ''}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                background: 'var(--builder-bg-tertiary)',
                border: '1px solid var(--builder-border-color)',
                color: 'var(--builder-text-secondary)',
                cursor: busy !== '' ? 'not-allowed' : 'pointer',
                transition: 'var(--transition)',
                opacity: busy !== '' ? 0.5 : 1,
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
