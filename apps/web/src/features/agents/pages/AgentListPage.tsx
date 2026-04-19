import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudioState } from '../../../lib/StudioStateContext';
import { Search, Plus, Users } from 'lucide-react';
import { PageHeader } from '../../../components';
import { AgentCard } from '../../../components/ui/AgentCard';
import { EmptySection } from '../../../components/ui/EmptySection';

export default function AgentListPage() {
  const { state } = useStudioState();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const agents = state.agents || [];

  const filteredAgents = useMemo(
    () => agents.filter((a) => a.name?.toLowerCase().includes(searchQuery.toLowerCase())),
    [agents, searchQuery],
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Agents"
        description="Browse, search, and edit your workspace agents."
        icon={Users}
      />

      {agents.length === 0 ? (
        <EmptySection
          icon={Users}
          title="No agents yet"
          description="Create your first agent to get started."
          ctaLabel="Create Agent"
          onCta={() => navigate('/agents/new')}
        />
      ) : (
        <>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: 34,
                  paddingRight: 12,
                  paddingTop: 10,
                  paddingBottom: 10,
                  fontSize: 'var(--text-sm)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--input-text)',
                  outline: 'none',
                  transition: 'border-color var(--transition)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--input-focus)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)'; }}
              />
            </div>
            <button
              onClick={() => navigate('/agents/new')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 500,
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'background var(--transition)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--btn-primary-hover)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--btn-primary-bg)'; }}
            >
              <Plus size={14} />
              New Agent
            </button>
          </div>

          {/* Agent grid */}
          {filteredAgents.length === 0 && searchQuery ? (
            <p style={{ textAlign: 'center', padding: '32px 0', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              No matches for &quot;{searchQuery}&quot;
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 12,
              }}
            >
              {filteredAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onClick={() => navigate(`/agents/${agent.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
