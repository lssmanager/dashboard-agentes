import { useEffect, type CSSProperties } from 'react';
import { X } from 'lucide-react';

interface ShortcutGroup {
  group: string;
  items: Array<{ keys: string[]; description: string }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    group: 'Navigation',
    items: [
      { keys: ['Alt', '1'], description: 'Go to Administration' },
      { keys: ['Alt', '2'], description: 'Go to Studio' },
      { keys: ['Alt', '3'], description: 'Go to Entity Editor' },
    ],
  },
  {
    group: 'Shell panels',
    items: [
      { keys: ['Alt', '['], description: 'Toggle hierarchy panel / library' },
      { keys: ['Alt', ']'], description: 'Toggle inspector panel' },
    ],
  },
  {
    group: 'Other',
    items: [
      { keys: ['?'], description: 'Show / hide this help' },
      { keys: ['Esc'], description: 'Close dialogs & overlays' },
    ],
  },
];

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={backdropStyle}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" style={dialogStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 2 }}>
              Quick reference
            </div>
            <strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>Keyboard Shortcuts</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts help"
            style={closeBtnStyle}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.group}>
              <div style={groupLabelStyle}>{group.group}</div>
              <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
                {group.items.map((item) => (
                  <div key={item.description} style={rowStyle}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.description}</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {item.keys.map((k, i) => (
                        <span key={`${k}-${i}`} style={kbdStyle}>{k}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-primary)', fontSize: 11, color: 'var(--text-muted)' }}>
          Press <span style={kbdStyle}>?</span> to toggle this panel
        </div>
      </div>
    </>
  );
}

const backdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(2,8,23,0.45)',
  zIndex: 200,
};

const dialogStyle: CSSProperties = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 201,
  width: 440,
  maxWidth: 'calc(100vw - 32px)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-primary)',
  padding: 20,
  boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
};

const closeBtnStyle: CSSProperties = {
  width: 28,
  height: 28,
  border: '1px solid var(--border-primary)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
};

const groupLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--color-primary)',
};

const rowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
};

const kbdStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 22,
  padding: '1px 6px',
  borderRadius: 4,
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-secondary)',
  fontSize: 10,
  fontWeight: 700,
  fontFamily: 'var(--font-mono)',
  color: 'var(--text-primary)',
};
