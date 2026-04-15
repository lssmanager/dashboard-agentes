import { FlowSpec } from '../../core-types/src';

export interface CompiledFlow {
  id: string;
  trigger: string;
  nodes: Array<{ id: string; type: string; config: Record<string, unknown> }>;
  edges: Array<{ from: string; to: string; condition?: string }>;
}

export function compileFlow(flow: FlowSpec): CompiledFlow {
  return {
    id: flow.id,
    trigger: flow.trigger,
    nodes: flow.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      config: node.config,
    })),
    edges: flow.edges.map((edge) => ({
      from: edge.from,
      to: edge.to,
      condition: edge.condition,
    })),
  };
}

export function compileFlows(flows: FlowSpec[]): CompiledFlow[] {
  return flows.filter((flow) => flow.isEnabled).map(compileFlow);
}
