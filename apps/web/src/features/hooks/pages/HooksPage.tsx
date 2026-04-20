import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Plus, Trash2, Webhook } from 'lucide-react';
import { createHook, deleteHook, getHooks, updateHook } from '../../../lib/api';
import type { HookSpec } from '../../../lib/types';
import { HookEditor } from '../components/HookEditor';
import {
  ConsoleEmpty,
  ConsolePanel,
  ObservabilityShell,
  consoleToolButtonStyle,
} from '../../operations/components/ObservabilityShell';

export default function HooksPage() {
  const [hooks, setHooks] = useState<HookSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HookSpec | null>(null);
  const [creating, setCreating] = useState(false);
  const enabledHooks = hooks.filter((hook) => hook.enabled).length;

  async function loadHooks() {
    try {
      setHooks(await getHooks());
    } catch {
      setHooks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHooks();
  }, []);

  async function handleSave(input: Omit<HookSpec, 'id'> & { id?: string }) {
    if (input.id) {
      await updateHook(input.id, input);
    } else {
      await createHook(input);
    }
    setEditing(null);
    setCreating(false);
    await loadHooks();
  }

  async function handleDelete(id: string) {
    await deleteHook(id);
    await loadHooks();
  }

  return (
    <ObservabilityShell
      title="Hooks"
      description="Automation trigger management for runs, steps, deployments, and notifications."
      icon={Webhook}
      runtimeOk={!loading}
      kpis={[
        { label: 'Configured Hooks', value: hooks.length, helper: 'Registry size' },
        {
          label: 'Enabled',
          value: enabledHooks,
          helper: 'Live automation rules',
          tone: enabledHooks > 0 ? 'success' : 'default',
        },
        { label: 'Disabled', value: hooks.length - enabledHooks, helper: 'Inactive rules' },
      ]}
      actions={
        <button
          type="button"
          style={buttonStyle(true)}
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
        >
          <Plus size={14} />
          New Hook
        </button>
      }
    >
      {(creating || editing) && (
        <ConsolePanel title={editing ? 'Edit Hook' : 'Create Hook'} description="Configure event/action automation rules">
          <HookEditor
            hook={editing ?? undefined}
            onSave={handleSave}
            onCancel={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        </ConsolePanel>
      )}

      <ConsolePanel title="Hook Registry" description={`${hooks.length} hook(s) configured`}>
        {loading ? (
          <ConsoleEmpty title="Loading hooks" description="Fetching hook registry." />
        ) : hooks.length === 0 && !creating ? (
          <ConsoleEmpty
            title="No hooks configured"
            description="Hooks automate logging, approvals, notifications, and webhook handoffs on runtime events."
          />
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {hooks.map((hook) => (
              <div
                key={hook.id}
                style={{
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-primary)',
                  background: hook.enabled ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                  opacity: hook.enabled ? 1 : 0.7,
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{hook.event}</strong>
                    <span
                      style={{
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--color-primary)',
                        background: 'var(--color-primary-soft)',
                        color: 'var(--color-primary)',
                        fontSize: 11,
                        padding: '2px 8px',
                        fontWeight: 700,
                      }}
                    >
                      {hook.action}
                    </span>
                    {!hook.enabled && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Disabled</span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {hook.id}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    style={buttonStyle()}
                    onClick={() => {
                      setEditing(hook);
                      setCreating(false);
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" style={dangerButton()} onClick={() => void handleDelete(hook.id)}>
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ConsolePanel>
    </ObservabilityShell>
  );
}

function buttonStyle(primary = false): CSSProperties {
  return primary
    ? {
        ...consoleToolButtonStyle(),
        border: 'none',
        background: 'var(--btn-primary-bg)',
        color: 'var(--btn-primary-text)',
      }
    : consoleToolButtonStyle();
}

function dangerButton(): CSSProperties {
  return {
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--tone-danger-border)',
    background: 'var(--tone-danger-bg)',
    color: 'var(--tone-danger-text)',
    padding: '8px 10px',
    fontSize: 12,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
  };
}
