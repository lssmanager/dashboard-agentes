/**
 * ConditionNode — React Flow custom node
 * @router pattern (CrewAI-inspired): branches flow based on state variable.
 * Supports N output handles, one per branch.
 */
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface Branch {
  label: string;
  pattern: string;
  targetNodeId?: string;
}

interface ConditionConfig {
  label?: string;
  stateKey?: string;
  branches?: Branch[];
}

const ConditionNode = memo(({ data, selected }: NodeProps<ConditionConfig>) => {
  const branches = data.branches ?? [];

  return (
    <div
      className={`rounded-lg border px-4 py-3 min-w-[200px] shadow-sm bg-white dark:bg-zinc-900 ${
        selected ? 'border-amber-500 ring-2 ring-amber-300' : 'border-zinc-200 dark:border-zinc-700'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-amber-500" />

      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
          @router
        </span>
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
          {data.label ?? 'Condition'}
        </span>
      </div>

      {data.stateKey && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          evaluates: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{data.stateKey}</code>
        </p>
      )}

      <div className="flex flex-col gap-1">
        {branches.map((branch, i) => (
          <div key={i} className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
            <span className="truncate max-w-[120px]">{branch.label}</span>
            <Handle
              type="source"
              position={Position.Bottom}
              id={`branch-${i}`}
              style={{ left: `${(i + 1) * (100 / (branches.length + 1))}%`, bottom: -8 }}
              className="!bg-amber-500 !w-2.5 !h-2.5"
            />
          </div>
        ))}
        {branches.length === 0 && (
          <p className="text-xs text-zinc-400 italic">No branches configured</p>
        )}
      </div>
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
export default ConditionNode;
