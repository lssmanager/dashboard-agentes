import { DeployPreview } from '../../../lib/types';

interface WorkspaceFileTreeProps {
  preview: DeployPreview | null;
}

export function WorkspaceFileTree({ preview }: WorkspaceFileTreeProps) {
  return (
    <div className="rounded border border-slate-300 bg-white p-3">
      <h3 className="mb-2 text-sm font-semibold">Workspace File Tree</h3>
      <ul className="space-y-1 text-xs">
        {(preview?.artifacts ?? []).map((artifact) => (
          <li key={artifact.id}>{artifact.path}</li>
        ))}
        {!preview && <li>No compiled artifacts.</li>}
      </ul>
    </div>
  );
}
