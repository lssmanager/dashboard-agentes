import React from 'react';

interface ReadinessBarProps {
  score: number;
  onViewDetail: () => void;
}

export function ReadinessBar({ score, onViewDetail }: ReadinessBarProps) {
  const getColor = (s: number) => {
    if (s < 34) return 'var(--builder-status-err)';
    if (s < 67) return 'var(--builder-status-warn)';
    if (s < 100) return 'var(--builder-accent)';
    return 'var(--builder-status-ok)';
  };

  const getStatus = (s: number) => {
    if (s < 34) return 'Incomplete';
    if (s < 67) return 'Needs work';
    if (s < 100) return 'Almost ready';
    return 'Ready';
  };

  const color = getColor(score);
  const statusBg =
    score < 34
      ? 'var(--builder-status-err-dim)'
      : score < 67
        ? 'var(--builder-status-warn-dim)'
        : score < 100
          ? 'var(--builder-accent-dim)'
          : 'var(--builder-status-ok-dim)';

  const statusColor =
    score < 34
      ? 'var(--builder-status-err)'
      : score < 67
        ? 'var(--builder-status-warn)'
        : score < 100
          ? 'var(--builder-accent)'
          : 'var(--builder-status-ok)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        height: 32,
        padding: '0 16px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--builder-bg-secondary)',
        border: '1px solid var(--builder-border-color)',
      }}
    >
      <span style={{ fontSize: 12, color: 'var(--builder-text-muted)' }}>Readiness:</span>

      {/* Progress bar */}
      <div
        style={{
          width: 100,
          height: 8,
          background: 'var(--builder-bg-secondary)',
          borderRadius: 4,
          overflow: 'hidden',
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

      {/* Score */}
      <span style={{ fontSize: 13, fontWeight: 500, color: color }}>
        {score}%
      </span>

      {/* Badge */}
      <span
        style={{
          padding: '2px 8px',
          borderRadius: 20,
          fontSize: 11,
          background: statusBg,
          color: statusColor,
        }}
      >
        {getStatus(score)}
      </span>

      {/* Detail link */}
      <button
        onClick={onViewDetail}
        style={{
          marginLeft: 'auto',
          fontSize: 12,
          color: 'var(--builder-text-accent)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0 4px',
        }}
      >
        Ver detalle →
      </button>
    </div>
  );
}
