interface StudioSidebarProps {
  workspaceName?: string;
  agentsCount: number;
  flowsCount: number;
  skillsCount: number;
}

export function StudioSidebar({ workspaceName, agentsCount, flowsCount, skillsCount }: StudioSidebarProps) {
  return (
    <aside className="space-y-3 rounded border border-slate-200 bg-white p-3">
      <h2 className="text-sm font-semibold text-slate-900">Workspace</h2>
      <p className="text-sm text-slate-700">{workspaceName ?? 'No workspace selected'}</p>
      <ul className="space-y-1 text-xs text-slate-600">
        <li>Agents: {agentsCount}</li>
        <li>Flows: {flowsCount}</li>
        <li>Skills: {skillsCount}</li>
      </ul>
    </aside>
  );
}
