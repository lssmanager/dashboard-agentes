import { useForm } from 'react-hook-form';

import { createWorkspace } from '../../../lib/api';
import { WorkspaceSpec } from '../../../lib/types';

interface WorkspaceEditorProps {
  onCreated: (workspace: WorkspaceSpec) => void;
}

export function WorkspaceEditor({ onCreated }: WorkspaceEditorProps) {
  const { register, handleSubmit } = useForm<{ id: string; name: string; slug: string }>();

  return (
    <form
      className="rounded border border-slate-300 bg-white p-3"
      onSubmit={handleSubmit(async (values) => {
        const workspace = await createWorkspace(values);
        onCreated(workspace);
      })}
    >
      <h3 className="mb-2 text-sm font-semibold">Workspace Editor</h3>
      <div className="grid grid-cols-1 gap-2">
        <input {...register('id', { required: true })} placeholder="workspace-id" className="rounded border px-2 py-1" />
        <input {...register('name', { required: true })} placeholder="Workspace Name" className="rounded border px-2 py-1" />
        <input {...register('slug', { required: true })} placeholder="workspace-slug" className="rounded border px-2 py-1" />
      </div>
      <button className="mt-3 rounded bg-slate-900 px-3 py-1 text-sm text-white">Create Workspace</button>
    </form>
  );
}
