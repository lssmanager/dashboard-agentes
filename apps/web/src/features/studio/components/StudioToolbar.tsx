interface StudioToolbarProps {
  onRefresh: () => void;
  onPreview: () => void;
  onApply: () => void;
  isBusy?: boolean;
}

export function StudioToolbar({ onRefresh, onPreview, onApply, isBusy }: StudioToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">OpenClaw Studio</h1>
        <p className="text-xs text-slate-600">Authoring + validation + compile + deploy</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onRefresh} className="rounded border border-slate-300 px-3 py-1.5 text-sm" disabled={isBusy}>
          Refresh
        </button>
        <button onClick={onPreview} className="rounded border border-slate-900 px-3 py-1.5 text-sm" disabled={isBusy}>
          Preview Diff
        </button>
        <button onClick={onApply} className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white" disabled={isBusy}>
          Deploy
        </button>
      </div>
    </div>
  );
}
