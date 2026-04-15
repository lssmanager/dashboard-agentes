import { SkillSpec } from '../../../lib/types';

interface SkillListProps {
  skills: SkillSpec[];
}

export function SkillList({ skills }: SkillListProps) {
  return (
    <div className="rounded border border-slate-300 bg-white p-3">
      <h3 className="mb-2 text-sm font-semibold">Skills</h3>
      <ul className="space-y-2 text-sm">
        {skills.map((skill) => (
          <li key={skill.id} className="rounded bg-slate-50 p-2">
            <p className="font-medium">{skill.name}</p>
            <p className="text-xs text-slate-600">{skill.category}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
