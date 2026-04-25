/**
 * LLMCallNode — React Flow custom node
 * Represents a direct LLM call in the flow canvas.
 * Config panel: model override, system prompt, user prompt template, temperature.
 */
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface LLMCallConfig {
  label?: string;
  modelOverride?: string;
  systemPrompt?: string;
  userPromptTemplate?: string;
  temperature?: number;
  maxTokens?: number;
}

const LLMCallNode = memo(({ data, selected }: NodeProps<LLMCallConfig>) => {
  return (
    <div
      className={`rounded-lg border px-4 py-3 min-w-[180px] shadow-sm bg-white dark:bg-zinc-900 ${
        selected ? 'border-teal-500 ring-2 ring-teal-300' : 'border-zinc-200 dark:border-zinc-700'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-teal-500" />

      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
          LLM
        </span>
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
          {data.label ?? 'LLM Call'}
        </span>
      </div>

      {data.modelOverride && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
          {data.modelOverride}
        </p>
      )}

      {data.userPromptTemplate && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 truncate italic">
          {data.userPromptTemplate.slice(0, 50)}{data.userPromptTemplate.length > 50 ? '…' : ''}
        </p>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-teal-500" />
    </div>
  );
});

LLMCallNode.displayName = 'LLMCallNode';
export default LLMCallNode;
