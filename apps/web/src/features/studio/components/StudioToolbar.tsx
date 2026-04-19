import { RefreshCw, Eye, Rocket, Cpu } from 'lucide-react';

interface StudioToolbarProps {
  onRefresh: () => void;
  onPreview: () => void;
  onApply: () => void;
  isBusy?: boolean;
}

export function StudioToolbar({ onRefresh, onPreview, onApply, isBusy }: StudioToolbarProps) {
  const ghostBtn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-primary)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    cursor: isBusy ? 'not-allowed' : 'pointer',
    opacity: isBusy ? 0.5 : 1,
    transition: 'background var(--transition)',
  };

  const softBtn: React.CSSProperties = {
    ...ghostBtn,
    border: '1px solid var(--color-primary)',
    background: 'var(--color-primary-soft)',
    color: 'var(--color-primary)',
  };

  const primaryBtn: React.CSSProperties = {
    ...ghostBtn,
    border: 'none',
    background: 'var(--btn-primary-bg)',
    color: 'var(--btn-primary-text)',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-primary)',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Cpu size={16} style={{ color: '#fff' }} />
        </div>
        <div>
          <h1
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            OpenClaw Studio
          </h1>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
            Authoring · Compile · Deploy
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onRefresh} disabled={isBusy} style={ghostBtn}>
          <RefreshCw size={14} className={isBusy ? 'animate-spin' : ''} />
          Refresh
        </button>
        <button onClick={onPreview} disabled={isBusy} style={softBtn}>
          <Eye size={14} />
          Preview Diff
        </button>
        <button
          onClick={onApply}
          disabled={isBusy}
          style={primaryBtn}
          onMouseEnter={(e) => { if (!isBusy) (e.currentTarget as HTMLElement).style.background = 'var(--btn-primary-hover)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--btn-primary-bg)'; }}
        >
          <Rocket size={14} />
          Deploy
        </button>
      </div>
    </div>
  );
}
