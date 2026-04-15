import { useEffect, useState } from 'react';

import { getStudioState } from '../../../lib/api';
import { AgentSpec, WorkspaceSpec } from '../../../lib/types';
import { ChannelBindingsTable } from '../components/ChannelBindingsTable';
import { RouteEditor } from '../components/RouteEditor';

export function RoutingPage() {
  const [workspace, setWorkspace] = useState<WorkspaceSpec | null>(null);
  const [agents, setAgents] = useState<AgentSpec[]>([]);

  useEffect(() => {
    void getStudioState().then((state) => {
      setWorkspace(state.workspace);
      setAgents(state.agents);
    });
  }, []);

  if (!workspace) {
    return <div className="p-4 text-sm">No workspace loaded.</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <ChannelBindingsTable agents={agents} />
      <RouteEditor workspace={workspace} onSaved={setWorkspace} />
    </div>
  );
}
