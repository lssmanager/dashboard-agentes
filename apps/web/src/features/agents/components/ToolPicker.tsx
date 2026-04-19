import { useState } from 'react';
import { Search, X } from 'lucide-react';
import type { SkillSpec } from '../../../lib/types';

interface ToolPickerProps {
  value: string[];
  options: SkillSpec[];
  onChange: (v: string[]) => void;
}

export function ToolPicker({ value, options, onChange }: ToolPickerProps) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? options.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.category?.toLowerCase().includes(search.toLowerCase()))
    : options;

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  function remove(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  const selected = options.filter((s) => value.includes(s.id));

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Selected pills */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {selected.map((s) => (
            <span
              key={s.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-primary-soft)',
                color: 'var(--color-primary)',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {s.name}
              <button
                type="button"
                onClick={() => remove(s.id)}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--color-primary)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search skills..."
          style={{
            width: '100%',
            paddingLeft: 34,
            paddingRight: 12,
            paddingTop: 10,
            paddingBottom: 10,
            fontSize: 'var(--text-sm)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--input-border)',
            background: 'var(--input-bg)',
            color: 'var(--input-text)',
            outline: 'none',
            transition: 'border-color var(--transition)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--input-focus)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)'; }}
        />
      </div>

      {/* Skill list */}
      <div
        style={{
          maxHeight: 240,
          overflowY: 'auto',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-primary)',
        }}
      >
        {filtered.length === 0 ? (
          <p style={{ padding: '16px', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            {search.trim() ? 'No matching skills' : 'No skills available'}
          </p>
        ) : (
          filtered.map((skill, i) => {
            const checked = value.includes(skill.id);
            return (
              <label
                key={skill.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border-secondary)' : 'none',
                  cursor: 'pointer',
                  background: checked ? 'var(--color-primary-soft)' : 'transparent',
                  transition: 'background var(--transition)',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(skill.id)}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {skill.name}
                  </div>
                  {skill.description && (
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {skill.description}
                    </div>
                  )}
                </div>
                {skill.category && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  >
                    {skill.category}
                  </span>
                )}
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
