import { type CSSProperties } from 'react';
import { ZoomIn, ZoomOut, Undo2, Redo2, Save, ShieldCheck } from 'lucide-react';

interface CanvasToolbarOverlayProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onValidate?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  saving?: boolean;
  validating?: boolean;
}

export function CanvasToolbarOverlay({
  onZoomIn,
  onZoomOut,
  onUndo,
  onRedo,
  onSave,
  onValidate,
  canUndo = true,
  canRedo = false,
  saving = false,
  validating = false,
}: CanvasToolbarOverlayProps) {

  const btnStyle = (disabled?: boolean): CSSProperties => ({
    width: 36,
    height: 36,
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'transparent',
    color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
    display: 'grid',
    placeItems: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'background var(--transition)',
  });

  const sep: CSSProperties = {
    width: 1,
    height: 24,
    background: 'var(--border-secondary)',
    flexShrink: 0,
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        height: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '0 8px',
        borderRadius: 'var(--radius-lg)',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-md)',
        zIndex: 10,
      }}
    >
      <button style={btnStyle()} onClick={onZoomIn} title="Zoom In">
        <ZoomIn size={16} />
      </button>
      <button style={btnStyle()} onClick={onZoomOut} title="Zoom Out">
        <ZoomOut size={16} />
      </button>
      <div style={sep} />
      <button style={btnStyle(!canUndo)} onClick={canUndo ? onUndo : undefined} title="Undo">
        <Undo2 size={16} />
      </button>
      <button style={btnStyle(!canRedo)} onClick={canRedo ? onRedo : undefined} title="Redo">
        <Redo2 size={16} />
      </button>
      <div style={sep} />
      <button
        style={{
          ...btnStyle(saving),
          color: saving ? 'var(--text-muted)' : 'var(--color-primary)',
          opacity: 1,
        }}
        onClick={saving ? undefined : onSave}
        title="Save"
      >
        <Save size={16} />
      </button>
      <button
        style={{
          ...btnStyle(validating),
          color: validating ? 'var(--text-muted)' : 'var(--color-success)',
          opacity: 1,
        }}
        onClick={validating ? undefined : onValidate}
        title="Validate"
      >
        <ShieldCheck size={16} />
      </button>
    </div>
  );
}
