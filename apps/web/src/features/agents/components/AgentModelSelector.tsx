interface AgentModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const MODEL_OPTIONS = ['openai/gpt-5.4', 'openai/gpt-5.4-mini', 'openai/gpt-5.3-codex'];

export function AgentModelSelector({ value, onChange }: AgentModelSelectorProps) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium">Model</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded border px-3 py-2"
        style={{ borderColor: 'var(--input-border)', background: 'var(--input-bg)', color: 'var(--input-text)' }}
      >
        {MODEL_OPTIONS.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>
    </label>
  );
}
