interface AgentInstructionEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function AgentInstructionEditor({ value, onChange }: AgentInstructionEditorProps) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium">Instructions</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-40 rounded border px-3 py-2 text-sm"
        style={{ borderColor: 'var(--input-border)', background: 'var(--input-bg)', color: 'var(--input-text)', fontFamily: 'var(--font-mono)' }}
      />
    </label>
  );
}
