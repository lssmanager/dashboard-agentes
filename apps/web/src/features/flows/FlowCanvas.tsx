/**
 * FlowCanvas
 * Main React Flow canvas for the Agent Visual Studio Flow Builder.
 * Registers all custom node types: LLMCall, Condition, HumanApproval, Supervisor, N8nWorkflow.
 * Toolbar on the right to add nodes. Persists to API on save.
 */
import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  BackgroundVariant,
  ReactFlowProvider,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

import LLMCallNode from './nodes/LLMCallNode';
import ConditionNode from './nodes/ConditionNode';
import HumanApprovalNode from './nodes/HumanApprovalNode';
import SupervisorNode from './nodes/SupervisorNode';

const NODE_TYPES = {
  LLM_CALL: LLMCallNode,
  CONDITION: ConditionNode,
  HUMAN_APPROVAL: HumanApprovalNode,
  SUPERVISOR: SupervisorNode,
};

const INITIAL_NODES = [
  {
    id: 'start-1',
    type: 'input',
    position: { x: 250, y: 50 },
    data: { label: '▶ START' },
  },
];

interface FlowCanvasProps {
  flowId?: string;
  agentId?: string;
  onSave?: (nodes: any[], edges: any[]) => void;
}

export const FlowCanvas: React.FC<FlowCanvasProps> = ({ flowId, agentId, onSave }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const rfInstance = useRef<ReactFlowInstance | null>(null);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  const addNode = (type: string, label: string) => {
    const id = `${type}-${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type,
        position: { x: 200 + Math.random() * 200, y: 200 + nds.length * 120 },
        data: { label },
      },
    ]);
  };

  const handleSave = () => {
    onSave?.(nodes, edges);
  };

  return (
    <ReactFlowProvider>
      <div className="flex h-full w-full" ref={reactFlowWrapper}>
        {/* Node Palette Sidebar */}
        <div className="w-48 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 p-3 flex flex-col gap-2 overflow-y-auto">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Add Node</p>
          {([
            { type: 'LLM_CALL', label: '🧠 LLM Call', color: 'teal' },
            { type: 'CONDITION', label: '🔀 Condition', color: 'amber' },
            { type: 'HUMAN_APPROVAL', label: '⏸ Approval', color: 'purple' },
            { type: 'SUPERVISOR', label: '👔 Supervisor', color: 'blue' },
            { type: 'output', label: '⬛ End', color: 'zinc' },
          ] as const).map(({ type, label }) => (
            <button
              key={type}
              onClick={() => addNode(type as string, label)}
              className="text-left text-sm px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
            >
              {label}
            </button>
          ))}

          <div className="flex-1" />

          <button
            onClick={handleSave}
            className="text-sm px-3 py-2 rounded-md bg-teal-600 text-white hover:bg-teal-700 transition-colors font-medium"
          >
            💾 Save Flow
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={NODE_TYPES}
            onInit={(rf) => { rfInstance.current = rf; }}
            fitView
            attributionPosition="bottom-left"
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#d1d5db" />
            <Controls />
            <MiniMap
              nodeStrokeColor="#6b7280"
              nodeColor="#f3f4f6"
              nodeBorderRadius={6}
            />
          </ReactFlow>
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default FlowCanvas;
