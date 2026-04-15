interface RoutineTogglePanelProps {
  routines: string[];
  enabled: string[];
  onChange: (value: string[]) => void;
}

export function RoutineTogglePanel({ routines, enabled, onChange }: RoutineTogglePanelProps) {
  function toggle(routine: string) {
    if (enabled.includes(routine)) {
      onChange(enabled.filter((item) => item !== routine));
      return;
    }
    onChange([...enabled, routine]);
  }

  return (
    <div className="space-y-2 rounded border border-slate-300 bg-white p-3">
      <h3 className="text-sm font-semibold">Routines</h3>
      {routines.map((routine) => (
        <label key={routine} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled.includes(routine)} onChange={() => toggle(routine)} />
          <span>{routine}</span>
        </label>
      ))}
    </div>
  );
}
