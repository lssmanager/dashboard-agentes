import { WorkspaceSpec } from '../../../lib/types';

interface WorkspaceListProps {
  current: WorkspaceSpec | null;
}

export function WorkspaceList({ current }: WorkspaceListProps) {
  return (
    <div className="rounded border border-slate-300 bg-white p-3">
      <h3 className="mb-2 text-sm font-semibold">Workspace List</h3>
      {!current && <p className="text-sm text-slate-600">No workspace yet.</p>}
      {current && (
        <div className="text-sm">
          <p className="font-medium">{current.name}</p>
          <p className="text-slate-600">{current.slug}</p>
        </div>
      )}
    </div>
  );
}
