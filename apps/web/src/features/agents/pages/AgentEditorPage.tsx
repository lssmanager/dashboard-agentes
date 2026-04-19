import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Play, ChevronDown, ChevronUp } from 'lucide-react';

import { saveAgent } from '../../../lib/api';
import { useStudioState } from '../../../lib/StudioStateContext';
import { AgentKind, AgentSpec } from '../../../lib/types';
import { Toast } from '../../../components';
import { SectionCard } from '../../../components/ui/SectionCard';
import { ModelSelector } from '../components/ModelSelector';
import { SystemPromptEditor } from '../components/SystemPromptEditor';
import { ToolPicker } from '../components/ToolPicker';
import { AgentKindSelector } from '../components/AgentKindSelector';
import { AgentHandoffEditor } from '../components/AgentHandoffEditor';
import { AgentTestDrawer } from '../components/AgentTestDrawer';

export default function AgentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, refresh } = useStudioState();
  const isNew = !id || id === 'new';
  const existing = isNew ? undefined : state.agents?.find((a) => a.id === id);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const defaults = useMemo<AgentSpec>(
    () =>
      existing ?? {
        id: crypto.randomUUID(),
        workspaceId: state.workspace?.id ?? '',
        name: '',
        role: '',
        description: '',
        instructions: '',
        model: 'openai/gpt-5.4-mini',
        skillRefs: [],
        tags: [],
        visibility: 'workspace',
        executionMode: 'direct',
        kind: 'agent',
        handoffRules: [],
        channelBindings: [],
        isEnabled: true,
      },
    [existing, state.workspace?.id],
  );

  const { register, handleSubmit, setValue, watch, reset } = useForm<AgentSpec>({ defaultValues: defaults });

  // Reset form when navigating to a different agent
  useEffect(() => { reset(defaults); }, [defaults, reset]);

  const currentKind = watch('kind') ?? 'agent';
  const currentName = watch('name');
  const skills = state.skills ?? [];
  const flows = state.flows ?? [];

  async function onSubmit(values: AgentSpec) {
    setSaving(true);
    try {
      const saved = await saveAgent(values);
      await refresh();
      setToast({ type: 'success', message: `Agent "${saved.name}" ${isNew ? 'created' : 'saved'} successfully` });
      if (isNew) navigate(`/agents/${saved.id}`, { replace: true });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  }

  // Input style helper
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--input-border)',
    background: 'var(--input-bg)',
    color: 'var(--input-text)',
    fontSize: 'var(--text-sm)',
    outline: 'none',
    transition: 'border-color var(--transition)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Sticky top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button
              type="button"
              onClick={() => navigate('/agents')}
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-primary)',
                background: 'var(--bg-primary)',
                color: 'var(--text-muted)',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'background var(--transition)',
              }}
            >
              <ArrowLeft size={16} />
            </button>
            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {isNew ? 'New Agent' : currentName || 'Untitled Agent'}
              </h1>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
                {isNew ? 'Create a new agent for your workspace' : `Editing agent · ${id?.slice(0, 8)}...`}
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div style={{ display: 'grid', gap: 20 }}>

          {/* ── Identity ─────────────────────────── */}
          <SectionCard title="Identity" description="Basic agent information">
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Name</label>
                  <input
                    {...register('name', { required: true })}
                    placeholder="Agent name"
                    style={{ ...inputStyle, marginTop: 6 }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--input-focus)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)'; }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Role</label>
                  <input
                    {...register('role')}
                    placeholder="e.g. Customer support agent"
                    style={{ ...inputStyle, marginTop: 6 }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--input-focus)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)'; }}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <input
                  {...register('description')}
                  placeholder="Brief description of what this agent does"
                  style={{ ...inputStyle, marginTop: 6 }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--input-focus)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)'; }}
                />
              </div>
              <AgentKindSelector value={currentKind as AgentKind} onChange={(k) => setValue('kind', k)} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ ...labelStyle, textTransform: 'none', letterSpacing: 'normal', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={watch('isEnabled') !== false} onChange={(e) => setValue('isEnabled', e.target.checked)} />
                  Enabled
                </label>
              </div>
            </div>
          </SectionCard>

          {/* ── Model ─────────────────────────────── */}
          <SectionCard title="Model" description="Choose the LLM powering this agent">
            <ModelSelector value={watch('model')} onChange={(v) => setValue('model', v)} />
          </SectionCard>

          {/* ── System Prompt ─────────────────────── */}
          <SectionCard title="System Prompt" description="Instructions that define agent behavior">
            <SystemPromptEditor value={watch('instructions')} onChange={(v) => setValue('instructions', v)} />
          </SectionCard>

          {/* ── Tools / Skills ────────────────────── */}
          <SectionCard title="Tools & Skills" description={`${watch('skillRefs')?.length ?? 0} selected`}>
            <ToolPicker
              value={watch('skillRefs')}
              options={skills}
              onChange={(v) => setValue('skillRefs', v)}
            />
          </SectionCard>

          {/* ── Advanced (collapsible) ────────────── */}
          <SectionCard
            title="Advanced"
            description="Handoff rules, tags, and more"
            actions={
              <button
                type="button"
                onClick={() => setAdvancedOpen(!advancedOpen)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                }}
              >
                {advancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            }
          >
            {advancedOpen && (
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Tags</label>
                  <input
                    {...register('tags')}
                    placeholder="Comma-separated tags"
                    style={{ ...inputStyle, marginTop: 6 }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--input-focus)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)'; }}
                  />
                </div>
                <AgentHandoffEditor
                  value={watch('handoffRules')}
                  onChange={(v) => setValue('handoffRules', v)}
                />
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Sticky footer ──────────────────────── */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            marginTop: 24,
            padding: '16px 0',
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid var(--border-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            zIndex: 10,
          }}
        >
          {!isNew && (
            <button
              type="button"
              onClick={() => setTestOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-primary)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background var(--transition)',
              }}
            >
              <Play size={14} />
              Test Agent
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
              transition: 'background var(--transition)',
            }}
            onMouseEnter={(e) => { if (!saving) (e.currentTarget as HTMLElement).style.background = 'var(--btn-primary-hover)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--btn-primary-bg)'; }}
          >
            <Save size={14} />
            {saving ? 'Saving...' : isNew ? 'Create Agent' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Test drawer */}
      {!isNew && existing && (
        <AgentTestDrawer
          open={testOpen}
          onClose={() => setTestOpen(false)}
          agentId={existing.id}
          agentName={existing.name}
          flows={flows}
        />
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
