import { useForm } from 'react-hook-form';

import { updateWorkspace } from '../../../lib/api';
import { WorkspaceSpec } from '../../../lib/types';

interface RouteEditorProps {
  workspace: WorkspaceSpec;
  onSaved: (workspace: WorkspaceSpec) => void;
}

export function RouteEditor({ workspace, onSaved }: RouteEditorProps) {
  const { register, handleSubmit, reset } = useForm<{ from: string; to: string; when: string; priority: number }>({
    defaultValues: { from: '', to: '', when: 'always', priority: 100 },
  });

  return (
    <form
      className="space-y-2 rounded border border-slate-300 bg-white p-3"
      onSubmit={handleSubmit(async (values) => {
        const updated = await updateWorkspace({
          routingRules: [
            ...workspace.routingRules,
            {
              id: crypto.randomUUID(),
              from: values.from,
              to: values.to,
              when: values.when,
              priority: Number(values.priority),
            },
          ],
        });

        onSaved(updated);
        reset({ from: '', to: '', when: 'always', priority: 100 });
      })}
    >
      <h3 className="text-sm font-semibold">Route Editor</h3>
      <input {...register('from', { required: true })} placeholder="from" className="w-full rounded border px-2 py-1" />
      <input {...register('to', { required: true })} placeholder="to" className="w-full rounded border px-2 py-1" />
      <input {...register('when', { required: true })} placeholder="when" className="w-full rounded border px-2 py-1" />
      <input {...register('priority', { required: true, valueAsNumber: true })} type="number" className="w-full rounded border px-2 py-1" />
      <button className="rounded bg-slate-900 px-3 py-1 text-sm text-white">Add Route</button>
    </form>
  );
}
