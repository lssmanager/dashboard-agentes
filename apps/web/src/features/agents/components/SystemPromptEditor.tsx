import { useState, useRef, useEffect } from 'react';

interface SystemPromptEditorProps {
  value: string;
  onChange: (v: string) => void;
}

export function SystemPromptEditor({ value, onChange }: SystemPromptEditorProps) {
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const charCount = value?.length ?? 0;

  // Auto-resize height
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.max(180, el.scrollHeight)}px`;
    }
  }, [value]);

  return (
    <div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="You are a helpful assistant that..."
        style={{
          width: '100%',
          minHeight: 180,
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${focused ? 'var(--input-focus)' : 'var(--input-border)'}`,
          background: 'var(--input-bg)',
          color: 'var(--input-text)',
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          lineHeight: 1.6,
          resize: 'vertical',
          outline: 'none',
          transition: 'border-color var(--transition)',
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 6,
          fontSize: 11,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {charCount.toLocaleString()} chars
      </div>
    </div>
  );
}
