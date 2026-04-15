/**
 * Topology Visualizer Component
 * D3.js-based interactive topology map
 */

class TopologyVisualizer {
  constructor() {
    this.container = null;
    this.layout = 'orchestrator';
    this.svg = null;
    this.zoom = null;
  }

  setLayout(layout) {
    this.layout = layout;
    // Trigger re-render by getting current state
    if (window.appState && appState.workspaces.length > 0) {
      const ws = appState.workspaces.find(w => w.id === appState.activeWorkspace);
      if (ws) {
        const topology = appState.topology[ws.id] || {};
        this.render(ws, topology, appState.agentColors);
      }
    }
  }

  render(workspace, topology, agentColors) {
    this.container = document.getElementById('topologyMap');
    if (!this.container) return;

    this.container.innerHTML = '';

    const width = Math.max(this.container.clientWidth || 0, 320);
    const height = 400;

    // Create SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'topology-svg');

    // Add zoom behavior
    const g = this.svg.append('g');
    this.zoom = d3.zoom()
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    this.svg.call(this.zoom);

    // Create node links
    const agents = workspace.agents || [];
    const nodes = agents.map(a => ({
      id: a.id,
      name: a.name,
      status: a.status,
      model: a.model
    }));

    if (nodes.length === 0) {
      g.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#9AA7BD')
        .text('No agents to display');
      return null;
    }

    // Create links based on topology
    const links = [];
    const parentChildMap = topology.parentChildMap || {};
    for (const [parent, children] of Object.entries(parentChildMap)) {
      for (const child of children || []) {
        links.push({ source: parent, target: child });
      }
    }

    // Choose layout
    let simulation;
    if (this.layout === 'orchestrator') {
      simulation = this.createOrchestratorLayout(g, nodes, links, width, height, agentColors);
    } else if (this.layout === 'peer') {
      simulation = this.createPeerLayout(g, nodes, links, width, height, agentColors);
    } else {
      simulation = this.createHierarchicalLayout(g, nodes, links, width, height, agentColors);
    }

    if (simulation) {
      simulation.on('tick', () => {
        g.selectAll('.link').attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);

        g.selectAll('.node').attr('transform', d => `translate(${d.x},${d.y})`);
      });
    }
  }

  createOrchestratorLayout(g, nodes, links, width, height, agentColors) {
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('y', d3.forceY(height / 2).strength(0.5));

    const linkGroup = g.selectAll('.link')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#22304A')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    // Add arrowhead marker
    g.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('refX', 9)
      .attr('refY', 3)
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 10 3, 0 6')
      .attr('fill', '#22304A');

    const nodeGroup = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node');

    nodeGroup.append('circle')
      .attr('r', 20)
      .attr('fill', d => agentColors[d.id] || '#3C8DFF')
      .attr('stroke', d => d.status === 'ACTIVE' ? '#22C55E' : '#6B7A99')
      .attr('stroke-width', 3);

    nodeGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('font-size', '12px')
      .attr('fill', '#E6EDF7')
      .attr('font-weight', 'bold')
      .text(d => d.name.substring(0, 3))
      .style('pointer-events', 'none');

    // Add tooltips
    nodeGroup.append('title')
      .text(d => `${d.name}\nModel: ${d.model}\nStatus: ${d.status}`);

    return simulation;
  }

  createPeerLayout(g, nodes, links, width, height, agentColors) {
    const angle = (2 * Math.PI) / nodes.length;
    const radius = Math.min(width, height) / 3;

    nodes.forEach((node, i) => {
      node.x = width / 2 + radius * Math.cos(i * angle);
      node.y = height / 2 + radius * Math.sin(i * angle);
      node.fx = node.x;
      node.fy = node.y;
    });

    g.selectAll('.link')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#22304A')
      .attr('stroke-width', 2)
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    const nodeGroup = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    nodeGroup.append('circle')
      .attr('r', 20)
      .attr('fill', d => agentColors[d.id] || '#3C8DFF')
      .attr('stroke', d => d.status === 'ACTIVE' ? '#22C55E' : '#6B7A99')
      .attr('stroke-width', 3);

    nodeGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('font-size', '12px')
      .attr('fill', '#E6EDF7')
      .attr('font-weight', 'bold')
      .text(d => d.name.substring(0, 3))
      .style('pointer-events', 'none');

    nodeGroup.append('title')
      .text(d => `${d.name}\nModel: ${d.model}\nStatus: ${d.status}`);

    if (nodes.length > 5) {
      const banner = g.append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('fill', '#F3B723')
        .attr('font-weight', 'bold')
        .text('⚠ Warning: >5 agents in peer-to-peer mode');
    }

    return null;
  }

  createHierarchicalLayout(g, nodes, links, width, height, agentColors) {
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(120))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2));

    g.selectAll('.link')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#22304A')
      .attr('stroke-width', 2);

    const nodeGroup = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    nodeGroup.append('circle')
      .attr('r', 20)
      .attr('fill', d => agentColors[d.id] || '#3C8DFF')
      .attr('stroke', d => d.status === 'ACTIVE' ? '#22C55E' : '#6B7A99')
      .attr('stroke-width', 3);

    nodeGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('font-size', '12px')
      .attr('fill', '#E6EDF7')
      .attr('font-weight', 'bold')
      .text(d => d.name.substring(0, 3));

    nodeGroup.append('title')
      .text(d => `${d.name}\nModel: ${d.model}\nStatus: ${d.status}`);

    return simulation;
  }
}

window.TopologyVisualizer = TopologyVisualizer;
