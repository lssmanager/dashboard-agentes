/**
 * Zero-dependency SVG chart components.
 * All charts use CSS variables for theming; no ECharts or D3 required.
 */

// ── Sparkline ─────────────────────────────────────────────────────────────────

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  fill?: boolean;
}

export function Sparkline({ data, color = 'var(--color-primary)', height = 32, width = 80, fill = true }: SparklineProps) {
  if (!data.length) return <svg width={width} height={height} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padY = 2;
  const effectiveH = height - padY * 2;

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: padY + effectiveH - ((v - min) / range) * effectiveH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const fillPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {fill && (
        <path d={fillPath} fill={color} opacity={0.12} />
      )}
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* last point dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}

// ── AreaChart ─────────────────────────────────────────────────────────────────

interface AreaSeries {
  key: string;
  color: string;
  values: number[];
}

interface AreaChartProps {
  series: AreaSeries[];
  labels?: string[];
  height?: number;
  gridLines?: number;
}

export function AreaChart({ series, labels, height = 90, gridLines = 3 }: AreaChartProps) {
  const width = 320;
  const padL = 28, padR = 6, padT = 6, padB = 20;
  const w = width - padL - padR;
  const h = height - padT - padB;

  const allValues = series.flatMap((s) => s.values);
  const max = Math.max(...allValues, 1);
  const count = series[0]?.values.length ?? 0;

  if (count === 0) return <svg width="100%" height={height} />;

  const xOf = (i: number) => padL + (i / (count - 1)) * w;
  const yOf = (v: number) => padT + h - (v / max) * h;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {/* grid lines */}
      {Array.from({ length: gridLines + 1 }, (_, i) => {
        const y = padT + (i / gridLines) * h;
        const val = Math.round(max - (i / gridLines) * max);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={padL + w} y2={y} stroke="var(--border-primary)" strokeWidth={0.5} />
            <text x={padL - 3} y={y + 3.5} textAnchor="end" fontSize={8} fill="var(--text-muted)">{val}</text>
          </g>
        );
      })}

      {/* x-axis labels */}
      {labels && labels.map((lbl, i) => {
        if (i % Math.ceil(count / 5) !== 0 && i !== count - 1) return null;
        return (
          <text key={i} x={xOf(i)} y={height - 4} textAnchor="middle" fontSize={8} fill="var(--text-muted)">
            {lbl}
          </text>
        );
      })}

      {/* series */}
      {series.map((s) => {
        const pts = s.values.map((v, i) => ({ x: xOf(i), y: yOf(v) }));
        const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
        const area = `${line} L ${xOf(count - 1)} ${padT + h} L ${padL} ${padT + h} Z`;
        return (
          <g key={s.key}>
            <path d={area} fill={s.color} opacity={0.1} />
            <path d={line} fill="none" stroke={s.color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}
    </svg>
  );
}

// ── BarChart ──────────────────────────────────────────────────────────────────

interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  height?: number;
  barColor?: string;
}

export function BarChart({ data, height = 80, barColor = 'var(--color-primary)' }: BarChartProps) {
  const width = 320;
  const padL = 24, padR = 6, padT = 6, padB = 16;
  const w = width - padL - padR;
  const h = height - padT - padB;

  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = Math.max(3, w / data.length - 2);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
      {/* grid */}
      {[0, 0.5, 1].map((frac) => {
        const y = padT + h - frac * h;
        return <line key={frac} x1={padL} y1={y} x2={padL + w} y2={y} stroke="var(--border-primary)" strokeWidth={0.5} />;
      })}

      {data.map((d, i) => {
        const bh = (d.value / max) * h;
        const x = padL + (i / data.length) * w + (w / data.length - barW) / 2;
        const y = padT + h - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} fill={d.color ?? barColor} rx={1.5} />
            {data.length <= 12 && (
              <text x={x + barW / 2} y={height - 3} textAnchor="middle" fontSize={7} fill="var(--text-muted)">
                {d.label.slice(-2)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── DonutChart ────────────────────────────────────────────────────────────────

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function DonutChart({ slices, size = 120, thickness = 24, centerLabel, centerSub }: DonutChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = cx - 6;
  const inner = r - thickness;

  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  let current = 0;

  const paths = slices.map((slice) => {
    const frac = slice.value / total;
    const startAngle = current * 360;
    const endAngle = (current + frac) * 360;
    current += frac;

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    const s1 = polarToXY(cx, cy, r, startAngle);
    const s2 = polarToXY(cx, cy, r, endAngle);
    const i1 = polarToXY(cx, cy, inner, endAngle);
    const i2 = polarToXY(cx, cy, inner, startAngle);

    const d = [
      `M ${s1.x.toFixed(2)} ${s1.y.toFixed(2)}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${s2.x.toFixed(2)} ${s2.y.toFixed(2)}`,
      `L ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
      `A ${inner} ${inner} 0 ${largeArc} 0 ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`,
      'Z',
    ].join(' ');

    return { ...slice, d };
  });

  return (
    <svg width={size} height={size}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} stroke="var(--bg-primary)" strokeWidth={1.5} />
      ))}
      {centerLabel && (
        <text x={cx} y={cy - (centerSub ? 4 : 0)} textAnchor="middle" dominantBaseline="middle" fontSize={14} fontWeight={700} fill="var(--text-primary)">
          {centerLabel}
        </text>
      )}
      {centerSub && (
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
          {centerSub}
        </text>
      )}
    </svg>
  );
}

// ── BulletGauge ───────────────────────────────────────────────────────────────

interface BulletGaugeProps {
  value: number;   // 0–100 percentage
  label: string;
  status?: 'ok' | 'warning' | 'critical';
  width?: number;
}

export function BulletGauge({ value, label, status = 'ok', width = 200 }: BulletGaugeProps) {
  const color = status === 'critical' ? 'var(--tone-danger-text, #ef4444)'
    : status === 'warning' ? 'var(--tone-warning-text, #f59e0b)'
    : 'var(--tone-success-text, #10b981)';

  const pct = Math.min(100, Math.max(0, value));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color }}>{pct.toFixed(0)}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: 'var(--border-primary)', overflow: 'hidden', width }}>
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: color,
              borderRadius: 99,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── RadialGauge ───────────────────────────────────────────────────────────────

interface RadialGaugeProps {
  value: number; // 0–100
  size?: number;
  color?: string;
  label?: string;
}

export function RadialGauge({ value, size = 64, color = 'var(--color-primary)', label }: RadialGaugeProps) {
  const pct = Math.min(100, Math.max(0, value));
  const cx = size / 2;
  const cy = size / 2;
  const r = cx - 5;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (pct / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-primary)" strokeWidth={5} />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeDasharray={`${strokeDash.toFixed(2)} ${circumference.toFixed(2)}`}
          strokeLinecap="round"
        />
        {/* center text rendered inside SVG, but rotated back */}
        <text
          x={cx} y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={11}
          fontWeight={700}
          fill="var(--text-primary)"
          style={{ transform: `rotate(90deg)`, transformOrigin: `${cx}px ${cy}px` }}
        >
          {pct.toFixed(0)}%
        </text>
      </svg>
      {label && <span style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', maxWidth: size }}>{label}</span>}
    </div>
  );
}

// ── TopologyGraph ─────────────────────────────────────────────────────────────

interface TopoNode { id: string; label: string; type: string; x?: number; y?: number; meta?: string }
interface TopoEdge { from: string; to: string; label?: string; weight?: number }

interface TopologyGraphProps {
  nodes: TopoNode[];
  edges: TopoEdge[];
  height?: number;
}

const NODE_COLOR: Record<string, string> = {
  agency:     '#6366f1',
  department: '#8b5cf6',
  workspace:  '#3b82f6',
  agent:      '#10b981',
  subagent:   '#06b6d4',
};

export function TopologyGraph({ nodes, edges, height = 220 }: TopologyGraphProps) {
  const width = 360;

  if (!nodes.length) {
    return (
      <svg width="100%" height={height}>
        <text x={width / 2} y={height / 2} textAnchor="middle" fontSize={11} fill="var(--text-muted)">No topology data</text>
      </svg>
    );
  }

  // Use pre-computed positions if provided, else fall back to circle layout
  const positioned = nodes.map((n, i) => {
    if (typeof n.x === 'number' && typeof n.y === 'number') {
      return { ...n, cx: n.x, cy: n.y };
    }
    const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
    const radius = Math.min(width, height) * 0.35;
    return {
      ...n,
      cx: width / 2 + radius * Math.cos(angle),
      cy: height / 2 + radius * Math.sin(angle),
    };
  });

  const nodeMap = new Map(positioned.map((n) => [n.id, n]));

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M 0 0 L 6 3 L 0 6 Z" fill="var(--text-muted)" opacity={0.5} />
        </marker>
      </defs>

      {/* edges */}
      {edges.map((e, i) => {
        const src = nodeMap.get(e.from);
        const tgt = nodeMap.get(e.to);
        if (!src || !tgt) return null;
        return (
          <line
            key={i}
            x1={src.cx} y1={src.cy}
            x2={tgt.cx} y2={tgt.cy}
            stroke="var(--text-muted)"
            strokeWidth={e.weight ? Math.min(3, e.weight / 2) : 1}
            opacity={0.35}
            markerEnd="url(#arrow)"
          />
        );
      })}

      {/* nodes */}
      {positioned.map((n) => {
        const color = NODE_COLOR[n.type] ?? '#94a3b8';
        const label = n.label.length > 10 ? n.label.slice(0, 9) + '…' : n.label;
        return (
          <g key={n.id}>
            <circle cx={n.cx} cy={n.cy} r={16} fill={color} opacity={0.15} />
            <circle cx={n.cx} cy={n.cy} r={11} fill={color} opacity={0.9} />
            <text x={n.cx} y={n.cy + 22} textAnchor="middle" fontSize={8} fill="var(--text-muted)">{label}</text>
            <text x={n.cx} y={n.cy + 3.5} textAnchor="middle" fontSize={7} fontWeight={700} fill="#fff">{n.type.slice(0, 2).toUpperCase()}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── FlowSankey ────────────────────────────────────────────────────────────────

interface SankeyNode { id: string; label: string; value: number }
interface SankeyLink  { source: string; target: string; value: number }

interface FlowSankeyProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  height?: number;
}

export function FlowSankey({ nodes, links, height = 180 }: FlowSankeyProps) {
  const width = 340;

  if (!nodes.length) {
    return (
      <svg width="100%" height={height}>
        <text x={width / 2} y={height / 2} textAnchor="middle" fontSize={11} fill="var(--text-muted)">No flow data</text>
      </svg>
    );
  }

  const total = Math.max(...nodes.map((n) => n.value), 1);
  const barW = 10;
  const gap = 8;

  // Simple left-to-right layout: evenly spaced columns
  // Sources on the left, targets on the right (2-column Sankey simplification)
  const sources = new Set(links.map((l) => l.source));
  const targets = new Set(links.map((l) => l.target));

  const leftNodes = nodes.filter((n) => sources.has(n.id) && !targets.has(n.id));
  const rightNodes = nodes.filter((n) => targets.has(n.id));
  const midNodes = nodes.filter((n) => sources.has(n.id) && targets.has(n.id));

  const allLeft = [...leftNodes, ...midNodes];
  const allRight = [...rightNodes];

  const maxH = height - 20;

  const posLeft = allLeft.map((n, i) => ({
    ...n,
    x: 20,
    y: 10 + (i / Math.max(allLeft.length, 1)) * maxH,
    h: Math.max(4, (n.value / total) * maxH * 0.7),
  }));

  const posRight = allRight.map((n, i) => ({
    ...n,
    x: width - 20 - barW,
    y: 10 + (i / Math.max(allRight.length, 1)) * maxH,
    h: Math.max(4, (n.value / total) * maxH * 0.7),
  }));

  const posMap = new Map([
    ...posLeft.map((n) => [n.id, n] as [string, typeof n]),
    ...posRight.map((n) => [n.id, n] as [string, typeof n]),
  ]);

  const COLORS = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'];

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
      {/* flow links */}
      {links.map((l, i) => {
        const src = posMap.get(l.source);
        const tgt = posMap.get(l.target);
        if (!src || !tgt) return null;
        const sy = src.y + src.h / 2;
        const ty = tgt.y + tgt.h / 2;
        const cpx = (src.x + barW + tgt.x) / 2;
        const thickness = Math.max(1, (l.value / total) * 12);
        return (
          <path
            key={i}
            d={`M ${src.x + barW} ${sy} C ${cpx} ${sy}, ${cpx} ${ty}, ${tgt.x} ${ty}`}
            fill="none"
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={thickness}
            opacity={0.3}
          />
        );
      })}

      {/* left nodes */}
      {posLeft.map((n, i) => (
        <g key={n.id}>
          <rect x={n.x} y={n.y} width={barW} height={n.h} fill={COLORS[i % COLORS.length]} rx={2} />
          <text x={n.x + barW + 3} y={n.y + n.h / 2 + 3} fontSize={8} fill="var(--text-muted)">
            {n.label.slice(0, 12)}
          </text>
        </g>
      ))}

      {/* right nodes */}
      {posRight.map((n, i) => (
        <g key={n.id}>
          <rect x={n.x} y={n.y} width={barW} height={n.h} fill={COLORS[(i + allLeft.length) % COLORS.length]} rx={2} />
          <text x={n.x - 3} y={n.y + n.h / 2 + 3} fontSize={8} textAnchor="end" fill="var(--text-muted)">
            {n.label.slice(0, 12)}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── LatencyBar ────────────────────────────────────────────────────────────────

interface LatencyBarProps {
  model: string;
  p50: number;
  p95: number;
  maxMs?: number;
}

export function LatencyBar({ model, p50, p95, maxMs = 5000 }: LatencyBarProps) {
  const p50Pct = Math.min(100, (p50 / maxMs) * 100);
  const p95Pct = Math.min(100, (p95 / maxMs) * 100);

  return (
    <div style={{ display: 'grid', gap: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
          {model}
        </span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          p50: {p50}ms · p95: {p95}ms
        </span>
      </div>
      <div style={{ height: 8, background: 'var(--border-primary)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
        {/* p95 background */}
        <div style={{ position: 'absolute', inset: 0, width: `${p95Pct}%`, background: 'var(--tone-warning-text, #f59e0b)', opacity: 0.25 }} />
        {/* p50 foreground */}
        <div style={{ position: 'absolute', inset: 0, width: `${p50Pct}%`, background: 'var(--color-primary)', opacity: 0.8, borderRadius: 4 }} />
      </div>
    </div>
  );
}

// ── RadarChart ────────────────────────────────────────────────────────────────

interface RadarAxis {
  label: string;
  value: number; // 0–1
  color?: string;
}

interface RadarChartProps {
  axes: RadarAxis[];
  size?: number;
  color?: string;
}

export function RadarChart({ axes, size = 160, color = 'var(--color-primary)' }: RadarChartProps) {
  if (axes.length < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = cx - 20;
  const n = axes.length;

  const angleOf = (i: number) => (i / n) * 2 * Math.PI - Math.PI / 2;

  const gridLevels = [0.25, 0.5, 0.75, 1];

  // Build grid polygons
  const gridPolygons = gridLevels.map((frac) => {
    const pts = Array.from({ length: n }, (_, i) => {
      const angle = angleOf(i);
      return `${(cx + r * frac * Math.cos(angle)).toFixed(1)},${(cy + r * frac * Math.sin(angle)).toFixed(1)}`;
    });
    return pts.join(' ');
  });

  // Build spoke lines
  const spokes = Array.from({ length: n }, (_, i) => ({
    x2: (cx + r * Math.cos(angleOf(i))).toFixed(1),
    y2: (cy + r * Math.sin(angleOf(i))).toFixed(1),
  }));

  // Build filled data polygon
  const dataPoints = axes.map((axis, i) => {
    const angle = angleOf(i);
    const v = Math.max(0, Math.min(1, axis.value));
    return `${(cx + r * v * Math.cos(angle)).toFixed(1)},${(cy + r * v * Math.sin(angle)).toFixed(1)}`;
  });

  // Label positions (slightly outside r)
  const labelPos = axes.map((axis, i) => {
    const angle = angleOf(i);
    const lx = cx + (r + 14) * Math.cos(angle);
    const ly = cy + (r + 14) * Math.sin(angle);
    const anchor = lx < cx - 4 ? 'end' : lx > cx + 4 ? 'start' : 'middle';
    return { x: lx.toFixed(1), y: ly.toFixed(1), anchor, label: axis.label, value: axis.value };
  });

  return (
    <svg width={size} height={size}>
      {/* grid polygons */}
      {gridPolygons.map((pts, gi) => (
        <polygon key={gi} points={pts} fill="none" stroke="var(--border-primary)" strokeWidth={0.5} />
      ))}

      {/* spokes */}
      {spokes.map((s, i) => (
        <line key={i} x1={cx} y1={cy} x2={s.x2} y2={s.y2} stroke="var(--border-primary)" strokeWidth={0.5} />
      ))}

      {/* data fill */}
      <polygon points={dataPoints.join(' ')} fill={color} opacity={0.15} />
      <polygon points={dataPoints.join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />

      {/* data dots */}
      {axes.map((axis, i) => {
        const angle = angleOf(i);
        const v = Math.max(0, Math.min(1, axis.value));
        return (
          <circle
            key={i}
            cx={(cx + r * v * Math.cos(angle)).toFixed(1)}
            cy={(cy + r * v * Math.sin(angle)).toFixed(1)}
            r={3}
            fill={color}
          />
        );
      })}

      {/* labels */}
      {labelPos.map((lp, i) => (
        <text key={i} x={lp.x} y={lp.y} textAnchor={lp.anchor} dominantBaseline="middle" fontSize={8} fill="var(--text-muted)">
          {lp.label}
        </text>
      ))}
    </svg>
  );
}
