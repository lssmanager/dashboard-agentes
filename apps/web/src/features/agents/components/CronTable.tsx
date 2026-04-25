import React from 'react';
import { FieldWrapper } from './FieldWrapper';

interface CronRow {
  schedule: string;
  task: string;
}

interface CronTableProps {
  label: string;
  helper?: string;
  rows: CronRow[];
  onChange: (rows: CronRow[]) => void;
}

export function CronTable({ label, helper, rows, onChange }: CronTableProps) {
  const updateRow = (index: number, field: 'schedule' | 'task', value: string) => {
    const updated = [...rows];
    updated[index][field] = value;
    onChange(updated);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const addRow = () => {
    onChange([...rows, { schedule: '', task: '' }]);
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--builder-bg-secondary)',
    border: '1px solid var(--builder-border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px',
    fontSize: 14,
    color: 'var(--builder-text-primary)',
    outline: 'none',
    transition: 'var(--transition)',
  };

  return (
    <FieldWrapper label={label} helper={helper}>
      <div>
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr 24px',
            gap: 12,
            padding: '4px 0',
            borderBottom: '1px solid var(--builder-border-subtle)',
            fontSize: 11,
            color: 'var(--builder-text-muted)',
            marginBottom: 8,
          }}
        >
          <span>Schedule</span>
          <span>Task</span>
          <span></span>
        </div>

        {/* Rows */}
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '160px 1fr 24px',
              gap: 12,
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <input
              value={row.schedule}
              onChange={(e) => updateRow(i, 'schedule', e.target.value)}
              placeholder="0 9 * * 1"
              style={{ ...inputStyle, width: '100%' }}
            />
            <input
              value={row.task}
              onChange={(e) => updateRow(i, 'task', e.target.value)}
              placeholder="Task description"
              style={{ ...inputStyle, width: '100%' }}
            />
            <button
              onClick={() => removeRow(i)}
              style={{
                color: 'var(--builder-text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              ×
            </button>
          </div>
        ))}

        {/* Add button */}
        <button
          onClick={addRow}
          style={{
            marginTop: 8,
            color: 'var(--builder-text-accent)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            padding: '4px 0',
          }}
        >
          + Add cron task
        </button>

        {/* Hint */}
        <div
          style={{
            marginTop: 12,
            fontSize: 11,
            color: 'var(--builder-text-disabled)',
          }}
        >
          Use heartbeat for batched checks. Use cron for precise timing and isolated tasks.
        </div>
      </div>
    </FieldWrapper>
  );
}
