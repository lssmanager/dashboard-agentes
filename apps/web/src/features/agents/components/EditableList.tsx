import React, { useState } from 'react';
import { FieldWrapper } from './FieldWrapper';

interface EditableListProps {
  label: string;
  helper?: string;
  items: string[];
  onChange: (items: string[]) => void;
  addLabel: string;
  defaults?: string[];
}

export function EditableList({
  label,
  helper,
  items,
  onChange,
  addLabel,
  defaults = [],
}: EditableListProps) {
  const updateItem = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = value;
    onChange(updated);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([...items, '']);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--builder-bg-secondary)',
    border: '1px solid var(--builder-border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '7px 10px',
    fontSize: 14,
    color: 'var(--builder-text-primary)',
    outline: 'none',
    transition: 'var(--transition)',
  };

  return (
    <FieldWrapper label={label} helper={helper}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span
              style={{
                color: 'var(--builder-text-disabled)',
                fontSize: 14,
                cursor: 'grab',
                userSelect: 'none',
              }}
            >
              ⠿
            </span>
            <input
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={() => removeItem(i)}
              style={{
                color: 'var(--builder-text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: 1,
                padding: '0 4px',
              }}
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={addItem}
          style={{
            alignSelf: 'flex-start',
            color: 'var(--builder-text-accent)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            padding: '4px 0',
          }}
        >
          {addLabel}
        </button>
      </div>
    </FieldWrapper>
  );
}
