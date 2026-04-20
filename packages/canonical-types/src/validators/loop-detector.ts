export interface DirectedEdge {
  from: string;
  to: string;
}

export interface CycleDetectionResult {
  hasCycle: boolean;
  cyclePath?: string;
}

export function detectConnectionCycle(
  nodes: string[],
  edges: DirectedEdge[],
  proposedEdge: DirectedEdge,
): CycleDetectionResult {
  const allNodes = new Set<string>([...nodes, proposedEdge.from, proposedEdge.to]);
  const allEdges = [...edges, proposedEdge];
  const adjacency = new Map<string, string[]>();

  for (const node of allNodes) {
    adjacency.set(node, []);
  }

  for (const edge of allEdges) {
    const list = adjacency.get(edge.from);
    if (list) {
      list.push(edge.to);
    }
  }

  const visited = new Set<string>();
  const recursion = new Set<string>();
  const stack: string[] = [];

  for (const node of allNodes) {
    if (walk(node, adjacency, visited, recursion, stack)) {
      const cycleStart = stack[stack.length - 1];
      const startIndex = stack.lastIndexOf(cycleStart);
      const cycle = [...stack.slice(startIndex), cycleStart];
      return {
        hasCycle: true,
        cyclePath: cycle.join(' -> '),
      };
    }
  }

  return { hasCycle: false };
}

function walk(
  node: string,
  adjacency: Map<string, string[]>,
  visited: Set<string>,
  recursion: Set<string>,
  stack: string[],
): boolean {
  if (recursion.has(node)) {
    stack.push(node);
    return true;
  }
  if (visited.has(node)) {
    return false;
  }

  visited.add(node);
  recursion.add(node);
  stack.push(node);

  const neighbors = adjacency.get(node) ?? [];
  for (const next of neighbors) {
    if (walk(next, adjacency, visited, recursion, stack)) {
      return true;
    }
  }

  recursion.delete(node);
  stack.pop();
  return false;
}
