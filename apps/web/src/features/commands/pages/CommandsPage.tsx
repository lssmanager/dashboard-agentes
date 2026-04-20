import { useEffect, useState } from 'react';
import { Terminal } from 'lucide-react';
import { getCommands } from '../../../lib/api';
import { ConsoleEmpty, ConsolePanel, ObservabilityShell } from '../../operations/components/ObservabilityShell';

interface CommandSpec {
  id: string;
  name: string;
  description: string;
  steps: string[];
  tags?: string[];
}

export function CommandsPage() {
  const [commands, setCommands] = useState<CommandSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CommandSpec | null>(null);

  useEffect(() => {
    getCommands()
      .then(setCommands)
      .catch(() => setCommands([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ObservabilityShell
      title="Commands"
      description="Reusable command routines for operational playbooks and execution guidance."
      icon={Terminal}
      runtimeOk={!loading}
    >
      {loading ? (
        <ConsolePanel title="Commands Registry" description="Loading command definitions">
          <ConsoleEmpty title="Loading commands" description="Fetching routines from command registry." />
        </ConsolePanel>
      ) : commands.length === 0 ? (
        <ConsolePanel title="Commands Registry" description="No command definitions available">
          <ConsoleEmpty
            title="No commands found"
            description="Add markdown files to `.openclaw/commands/` to define reusable operations."
          />
        </ConsolePanel>
      ) : (
        <section className="studio-console-master-detail" style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 14 }}>
          <ConsolePanel title="Command List" description={`${commands.length} command(s) available`}>
            <div style={{ display: 'grid', gap: 8 }}>
              {commands.map((command) => (
                <button
                  key={command.id}
                  type="button"
                  onClick={() => setSelected(command)}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: selected?.id === command.id ? 'var(--color-primary)' : 'var(--border-primary)',
                    background: selected?.id === command.id ? 'var(--color-primary-soft)' : 'var(--bg-secondary)',
                    textAlign: 'left',
                    padding: '10px 12px',
                    cursor: 'pointer',
                  }}
                >
                  <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{command.name}</strong>
                  <p style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                    {command.description.slice(0, 120)}
                  </p>
                </button>
              ))}
            </div>
          </ConsolePanel>

          <ConsolePanel title="Command Details" description={selected ? selected.name : 'Select a command'}>
            {selected ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div
                  style={{
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-primary)',
                    background: 'var(--bg-secondary)',
                    padding: '12px 14px',
                  }}
                >
                  <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{selected.description}</p>
                </div>

                {selected.steps.length > 0 && (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {selected.steps.map((step, index) => (
                      <div
                        key={`${step}-${index}`}
                        style={{
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-primary)',
                          background: 'var(--bg-secondary)',
                          padding: '10px 12px',
                          display: 'grid',
                          gridTemplateColumns: '28px 1fr',
                          gap: 8,
                          alignItems: 'start',
                        }}
                      >
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: 'var(--color-primary-soft)',
                            color: 'var(--color-primary)',
                            fontSize: 11,
                            fontWeight: 700,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          {index + 1}
                        </span>
                        <p style={{ marginTop: 2, fontSize: 13, color: 'var(--text-muted)' }}>{step}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <ConsoleEmpty
                title="No command selected"
                description="Choose a command from the list to inspect its operation steps."
              />
            )}
          </ConsolePanel>
        </section>
      )}
    </ObservabilityShell>
  );
}
