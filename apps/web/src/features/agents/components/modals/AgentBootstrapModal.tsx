type Props = {
  open: boolean;
  onSelectProfile: () => void;
  onStartBlank: () => void;
  onImportCoreFiles: () => void;
};

export function AgentBootstrapModal({ open, onSelectProfile, onStartBlank, onImportCoreFiles }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4" role="dialog" aria-modal="true" aria-label="Agent bootstrap">
      <div className="w-full max-w-2xl rounded-xl border p-5 space-y-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-primary)' }}>
        <p className="text-base font-semibold">This agent has not been initialized yet. Define who this agent is.</p>
        <p className="text-sm opacity-80">BOOTSTRAP intake only appears in create mode until Identity minimum is set.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button type="button" className="rounded-md border px-3 py-3 text-sm text-left" onClick={onSelectProfile}>
            <p className="font-semibold">Select profile template</p>
            <p className="text-xs opacity-75 mt-1">Start from reusable profile defaults.</p>
          </button>
          <button type="button" className="rounded-md border px-3 py-3 text-sm text-left" onClick={onStartBlank}>
            <p className="font-semibold">Start from blank agent</p>
            <p className="text-xs opacity-75 mt-1">Open Identity section with empty fields.</p>
          </button>
          <button type="button" className="rounded-md border px-3 py-3 text-sm text-left" onClick={onImportCoreFiles}>
            <p className="font-semibold">Import from Core Files</p>
            <p className="text-xs opacity-75 mt-1">Parse .md files and prefill builder fields.</p>
          </button>
        </div>
      </div>
    </div>
  );
}
