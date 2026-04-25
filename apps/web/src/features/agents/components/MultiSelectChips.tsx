import React, { useState, useRef, useEffect } from 'react';
import { FieldWrapper } from './FieldWrapper';

interface MultiSelectChipsProps {
  label: string;
  helper?: string;
  selected: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  searchPlaceholder: string;
  options: { id: string; label: string }[];
}

export function MultiSelectChips({
  label,
  helper,
  selected,
  onAdd,
  onRemove,
  searchPlaceholder,
  options,
}: MultiSelectChipsProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(
    (opt) =>
      !selected.includes(opt.id) &&
      opt.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const inputStyle: React.CSSProperties = {
    width: '100%',
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Selected chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
          {selected.map((s) => (
            <div
              key={s}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 10px',
                borderRadius: 20,
                background: 'var(--builder-accent-dim)',
                border: '1px solid var(--builder-border-accent)',
                fontSize: 12,
                color: 'var(--builder-text-accent)',
              }}
            >
              {s}
              <button
                onClick={() => onRemove(s)}
                style={{
                  color: 'var(--builder-text-muted)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  lineHeight: 1,
                  padding: '0 2px',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Search input */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={searchPlaceholder}
            style={inputStyle}
          />

          {/* Dropdown */}
          {open && filteredOptions.length > 0 && (
            <div
              ref={dropdownRef}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--builder-bg-tertiary)',
                border: '1px solid var(--builder-border-color)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                maxHeight: 200,
                overflowY: 'auto',
                zIndex: 10,
                marginTop: 4,
              }}
            >
              {filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onAdd(opt.id);
                    setSearch('');
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: 13,
                    cursor: 'pointer',
                    background: 'transparent',
                    transition: 'var(--transition)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--builder-bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </FieldWrapper>
  );
}
