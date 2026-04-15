interface WorkspaceDeployPanelProps {
  onPreview: () => void;
  onDeploy: () => void;
}

export function WorkspaceDeployPanel({ onPreview, onDeploy }: WorkspaceDeployPanelProps) {
  return (
    <div className="rounded border border-slate-300 bg-white p-3">
      <h3 className="mb-2 text-sm font-semibold">Deploy</h3>
      <div className="flex gap-2">
        <button className="rounded border border-slate-300 px-3 py-1 text-sm" onClick={onPreview}>
          Preview
        </button>
        <button className="rounded bg-slate-900 px-3 py-1 text-sm text-white" onClick={onDeploy}>
          Apply
        </button>
      </div>
    </div>
  );
}
