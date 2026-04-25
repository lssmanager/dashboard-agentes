/**
 * SupervisorNode — React Flow custom node
 * Process.hierarchical pattern (CrewAI-inspired).
 * Displays the manager agent + subordinate list.
 * Handles fan-out to subordinates and fan-in to validation.
 */
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface Subordinate {
  agentId: string;
  name: string;
}

interface SupervisorConfig {
  label?: string;
  managerAgentId?: string;
  managerName?: string;
  subordinates?: Subordinate[];
  maxRetries?: number;
}

const SupervisorNode = memo(({ data, selected }: NodeProps<SupervisorConfig>) => {
  const subs = data.subordinates ?? [];

  return (
    <div
      className={`rounded-lg border px-4 py-3 min-w-[220px] shadow-sm bg-white dark:bg-zinc-900 ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-300'
          : 'border-zinc-200 dark:border-zinc-700'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />

      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          supervisor
        </span>
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
          {data.label ?? 'Supervisor'}
        </span>
      </div>

      {data.managerName && (
        <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          <span>👔</span>
          <span className="truncate">Manager: {data.managerName}</span>
        </div>
      )}

      {subs.length > 0 && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2">
          <p className="text-xs text-zinc-400 mb-1">Subordinates ({subs.length})</p>
          {subs.map((sub, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300 py-0.5">
              <span className="text-zinc-300">└</span>
              <span className="truncate">{sub.name}</span>
            </div>
          ))}
        </div>
      )}

      {data.maxRetries !== undefined && (
        <p className="text-xs text-zinc-400 mt-2">Max retries: {data.maxRetries}</p>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
    </div>
  );
});

SupervisorNode.displayName = 'SupervisorNode';
export default SupervisorNode;
