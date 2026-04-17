import { useState, useMemo } from 'react';
import { useStudioState } from '../../../lib/StudioStateContext';
import { AgentEditorForm } from '../components/AgentEditorForm';
import { Search, Plus, Users } from 'lucide-react';
import { PageHeader, EmptyState, Card } from '../../../components';

export default function AgentListPage() {
  const { state } = useStudioState();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const agents = state.agents || [];

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) =>
      agent.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [agents, searchQuery]);

  const selectedAgent = selectedAgentId
    ? agents.find((a) => a.id === selectedAgentId)
    : agents[0];

  if (agents.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          title="Agents"
          description="Browse, search, and edit your workspace agents."
          icon={Users}
        />
        <EmptyState
          icon={Users}
          title="No Agents"
          description="Create your first agent to get started."
        >
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            <Plus size={18} />
            Create Agent
          </button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Agents"
        description="Browse, search, and edit your workspace agents."
        icon={Users}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left: Agent List */}
        <div className="md:col-span-1">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">All Agents</h3>

            {/* Search */}
            <div className="mb-4 relative">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Agent List */}
            <div className="space-y-2">
              {filteredAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                    (selectedAgentId === agent.id || (!selectedAgentId && agent === agents[0]))
                      ? 'bg-blue-50 border border-blue-200 text-blue-900 font-medium'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-xs text-slate-500">{agent.id}</div>
                </button>
              ))}
            </div>

            {/* Add Agent button */}
            <button className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
              <Plus size={16} />
              New Agent
            </button>
          </Card>
        </div>

        {/* Right: Agent Editor */}
        <div className="md:col-span-3">
          {selectedAgent ? (
            <Card>
              <h3 className="text-lg font-semibold text-slate-900 mb-6">
                Edit Agent: {selectedAgent.name}
              </h3>
              <AgentEditorForm
                workspaceId={state.workspace?.id || ''}
                agent={selectedAgent}
                skills={state.skills || []}
                onSaved={() => {
                  // Could show success toast here
                }}
              />
            </Card>
          ) : (
            <Card className="flex items-center justify-center h-64">
              <p className="text-slate-600">Select an agent to edit</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
