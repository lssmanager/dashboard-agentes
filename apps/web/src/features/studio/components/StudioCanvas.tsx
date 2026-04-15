import { AgentSpec, FlowSpec, SkillSpec } from '../../../lib/types';
import { AgentEditorForm } from '../../agents/components/AgentEditorForm';
import { FlowCanvas } from '../../flows/components/FlowCanvas';
import { SkillList } from '../../skills/components/SkillList';

interface StudioCanvasProps {
  workspaceId: string;
  agents: AgentSpec[];
  flows: FlowSpec[];
  skills: SkillSpec[];
  onAgentSaved: (agent: AgentSpec) => void;
}

export function StudioCanvas({ workspaceId, agents, flows, skills, onAgentSaved }: StudioCanvasProps) {
  return (
    <div className="space-y-4">
      <section className="rounded border border-slate-200 bg-white p-3">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Agent Editor</h3>
        <AgentEditorForm workspaceId={workspaceId} agent={agents[0]} skills={skills} onSaved={onAgentSaved} />
      </section>

      <section className="rounded border border-slate-200 bg-white p-3">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Flow Canvas</h3>
        <FlowCanvas flow={flows[0]} />
      </section>

      <SkillList skills={skills} />
    </div>
  );
}
