import { useMemo } from 'react';
import ReactFlow, { Background, Controls, Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';

import { FlowSpec } from '../../../lib/types';

interface FlowCanvasProps {
  flow?: FlowSpec;
}

export function FlowCanvas({ flow }: FlowCanvasProps) {
  const nodes = useMemo<Node[]>(
    () =>
      (flow?.nodes ?? []).map((node) => ({
        id: node.id,
        type: 'default',
        position: node.position ?? { x: 120, y: 120 },
        data: { label: node.type },
      })),
    [flow?.nodes],
  );

  const edges = useMemo<Edge[]>(
    () =>
      (flow?.edges ?? []).map((edge, index) => ({
        id: edge.from + '-' + edge.to + '-' + index,
        source: edge.from,
        target: edge.to,
        label: edge.condition,
      })),
    [flow?.edges],
  );

  return (
    <div className="h-[420px] overflow-hidden rounded border border-slate-300 bg-white">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
