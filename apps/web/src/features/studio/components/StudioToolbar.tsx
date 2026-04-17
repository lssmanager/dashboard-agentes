import { RefreshCw, Eye, Rocket, Cpu } from 'lucide-react';

interface StudioToolbarProps {
  onRefresh: () => void;
  onPreview: () => void;
  onApply: () => void;
  isBusy?: boolean;
}

export function StudioToolbar({ onRefresh, onPreview, onApply, isBusy }: StudioToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
          <Cpu size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-900 leading-tight">OpenClaw Studio</h1>
          <p className="text-xs text-slate-500 leading-tight">Authoring · Compile · Deploy</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={isBusy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={14} className={isBusy ? 'animate-spin' : ''} />
          Refresh
        </button>

        <button
          onClick={onPreview}
          disabled={isBusy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eye size={14} />
          Preview Diff
        </button>

        <button
          onClick={onApply}
          disabled={isBusy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Rocket size={14} />
          Deploy
        </button>
      </div>
    </div>
  );
}
