/**
 * HumanApprovalNode — React Flow custom node
 * interrupt() pattern (LangGraph-inspired): pauses run, waits for human decision.
 * Shows interrupt reason and context in Operations > Pending Actions panel.
 */
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface HumanApprovalConfig {
  label?: string;
  title?: string;
  description?: string;
}

const HumanApprovalNode = memo(({ data, selected }: NodeProps<HumanApprovalConfig>) => {
  return (
    <div
      className={`rounded-lg border px-4 py-3 min-w-[200px] shadow-sm bg-white dark:bg-zinc-900 ${
        selected
          ? 'border-purple-500 ring-2 ring-purple-300'
          : 'border-zinc-200 dark:border-zinc-700'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-purple-500" />

      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">⏸</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
          interrupt()
        </span>
      </div>

      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 mt-1">
        {data.label ?? data.title ?? 'Human Approval'}
      </p>

      {data.description && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 line-clamp-2">
          {data.description}
        </p>
      )}

      <div className="mt-2 flex gap-2">
        <Handle
          type="source"
          position={Position.Bottom}
          id="approved"
          style={{ left: '33%', bottom: -8 }}
          className="!bg-green-500 !w-2.5 !h-2.5"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="rejected"
          style={{ left: '66%', bottom: -8 }}
          className="!bg-red-500 !w-2.5 !h-2.5"
        />
      </div>

      <div className="flex justify-between text-xs text-zinc-400 mt-3 px-1">
        <span className="text-green-500">✓ approve</span>
        <span className="text-red-500">✗ reject</span>
      </div>
    </div>
  );
});

HumanApprovalNode.displayName = 'HumanApprovalNode';
export default HumanApprovalNode;
