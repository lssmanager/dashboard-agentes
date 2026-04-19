import { SkillSpec } from '../../../lib/types';

interface AgentSkillSelectorProps {
  value: string[];
  options: SkillSpec[];
  onChange: (value: string[]) => void;
}

export function AgentSkillSelector({ value, options, onChange }: AgentSkillSelectorProps) {
  function toggle(skillId: string) {
    const next = value.includes(skillId) ? value.filter((id) => id !== skillId) : [...value, skillId];
    onChange(next);
  }

  return (
    <div className="space-y-2 text-sm">
      <p className="font-medium">Skills</p>
      <div className="grid grid-cols-1 gap-2 rounded border p-3" style={{ borderColor: 'var(--border-primary)' }}>
        {options.map((skill) => (
          <label key={skill.id} className="flex items-center gap-2">
            <input type="checkbox" checked={value.includes(skill.id)} onChange={() => toggle(skill.id)} />
            <span>{skill.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
