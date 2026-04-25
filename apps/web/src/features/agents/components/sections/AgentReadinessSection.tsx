import type { AgentSpec } from '../../../../lib/types';
import { SectionHeader } from '../SectionHeader';

type Props = {
  value: AgentSpec;
  onPublish: () => void;
  onNavigateToSection: (section: string) => void;
};

const CHECK_LABELS: Record<string, string> = {
  identity: 'Identity',
  behavior: 'Prompts / Behavior',
  tools: 'Skills / Tools',
  routing: 'Routing & Channels',
  hooks: 'Hooks',
  operations: 'Operations',
  versions: 'Versions',
};

export function AgentReadinessSection({ value, onPublish, onNavigateToSection }: Props) {
  const score = value.agentReadiness?.score ?? 0;
  const checks = value.agentReadiness?.checks ?? {};
  const missingFields = value.agentReadiness?.missingFields ?? [];

  const scoreColor = (s: number) => {
    if (s === 100) return 'var(--builder-status-ok)';
    if (s < 34) return 'var(--builder-status-err)';
    if (s < 67) return 'var(--builder-status-warn)';
    if (s < 100) return 'var(--builder-accent)';
    return 'var(--builder-status-ok)';
  };

  const statusLabel =
    score === 100
      ? 'Ready'
      : score < 34
        ? 'Incomplete'
        : score < 67
          ? 'Needs work'
          : 'Almost ready';

  const color = scoreColor(score);
  const badgeBg =
    score === 100
      ? 'var(--builder-status-ok-dim)'
      : score < 34
        ? 'var(--builder-status-err-dim)'
        : score < 67
          ? 'var(--builder-status-warn-dim)'
          : 'var(--builder-accent-dim)';

  const badgeColor =
    score === 100
      ? 'var(--builder-status-ok)'
      : score < 34
        ? 'var(--builder-status-err)'
        : score < 67
          ? 'var(--builder-status-warn)'
          : 'var(--builder-accent)';

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Score header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
          <span style={{ fontSize: 48, fontWeight: 700, lineHeight: 1, color }}>
            {score}
          </span>
          <span style={{ fontSize: 24, color: 'var(--builder-text-muted)' }}>/100</span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 6,
            background: 'var(--builder-bg-tertiary)',
            borderRadius: 3,
            overflow: 'hidden',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${score}%`,
              background: color,
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        {/* Status badge */}
        <span
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 4,
            background: badgeBg,
            color: badgeColor,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Section checks */}
      <div>
        <SectionHeader title="SECTION CHECKS" />

        <div style={{ borderRadius: 6, border: '1px solid var(--builder-border-color)' }}>
          {Object.entries(checks).map(([key, ok], idx) => (
            <div
              key={key}
              onClick={() => onNavigateToSection(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '9px 10px',
                borderRadius: idx === 0 ? '6px 6px 0 0' : idx === Object.keys(checks).length - 1 ? '0 0 6px 6px' : 0,
                cursor: 'pointer',
                transition: 'var(--transition)',
                borderBottom: idx < Object.keys(checks).length - 1 ? '1px solid var(--builder-border-color)' : 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--builder-bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span
                style={{
                  fontSize: 14,
                  flexShrink: 0,
                  color: ok ? 'var(--builder-status-ok)' : 'var(--builder-status-err)',
                }}
              >
                {ok ? '✓' : '✗'}
              </span>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--builder-text-primary)' }}>
                {CHECK_LABELS[key] ?? key}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: ok ? 'var(--builder-status-ok)' : 'var(--builder-status-err)',
                }}
              >
                {ok ? 'Complete' : 'Incomplete'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Missing fields */}
      {missingFields.length > 0 && (
        <div>
          <SectionHeader title="MISSING REQUIRED FIELDS" />
          <div>
            {missingFields.map((f) => (
              <div
                key={f}
                style={{
                  fontSize: 13,
                  color: 'var(--builder-status-err)',
                  padding: '3px 0',
                }}
              >
                · {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publish button */}
      <button
        disabled={score < 100}
        onClick={onPublish}
        style={{
          marginTop: 28,
          width: '100%',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          background: score === 100 ? 'var(--builder-accent)' : 'var(--builder-bg-tertiary)',
          color: score === 100 ? 'white' : 'var(--builder-text-disabled)',
          border: `1px solid ${score === 100 ? 'var(--builder-accent)' : 'var(--builder-border-subtle)'}`,
          fontSize: 14,
          fontWeight: 600,
          opacity: score < 100 ? 0.5 : 1,
          cursor: score < 100 ? 'not-allowed' : 'pointer',
          transition: 'var(--transition)',
        }}
      >
        Publish Agent
      </button>

      <div
        style={{
          textAlign: 'center',
          fontSize: 11,
          color: 'var(--builder-text-disabled)',
          marginTop: 8,
        }}
      >
        {score === 100
          ? 'All required sections complete. Ready to publish.'
          : 'Complete all required sections to publish.'}
      </div>
    </section>
  );
}
