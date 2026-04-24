type Props = {
  open: boolean;
  onClose: () => void;
  onParsed: (files: Record<string, string>) => void;
};

export function CoreFilesImportModal({ open, onClose, onParsed }: Props) {
  if (!open) return null;

  const fields = ['IDENTITY.md', 'SOUL.md', 'USER.md', 'AGENTS.md', 'TOOLS.md'] as const;

  const values: Record<string, HTMLTextAreaElement | null> = {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4" role="dialog" aria-modal="true" aria-label="Import core files">
      <div className="w-full max-w-4xl rounded-xl border p-4 space-y-3" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-primary)' }}>
        <p className="text-sm font-semibold">Import Core Files</p>
        <p className="text-xs opacity-80">Paste .md content and parse into builder fields.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-auto pr-1">
          {fields.map((name) => (
            <div key={name} className="space-y-1">
              <p className="text-xs font-semibold">{name}</p>
              <textarea
                rows={8}
                ref={(el) => {
                  values[name] = el;
                }}
                className="w-full rounded-md border px-3 py-2 text-xs"
                placeholder={`Paste ${name} content here`}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border px-3 py-1 text-xs"
            onClick={() => {
              const files: Record<string, string> = {};
              for (const key of fields) {
                const value = values[key]?.value?.trim();
                if (value) files[key] = value;
              }
              onParsed(files);
            }}
          >
            Parse files
          </button>
          <button type="button" className="rounded-md border px-3 py-1 text-xs" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
