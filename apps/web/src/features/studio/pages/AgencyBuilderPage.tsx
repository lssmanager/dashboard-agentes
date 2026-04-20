import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  AlertTriangle,
  Boxes,
  Building2,
  Layers3,
  RefreshCw,
  RotateCcw,
  Wand2,
} from 'lucide-react';
import {
  applyCoreFiles,
  getBuilderAgentFunction,
  getCanonicalStudioState,
  getVersions,
  previewCoreFiles,
  rollbackCoreFiles,
} from '../../../lib/api';
import type {
  BuilderAgentFunctionOutput,
  CanonicalStudioStateResponse,
  CoreFilesPreviewResponse,
  VersionSnapshot,
} from '../../../lib/types';
import {
  RuntimeStatusBadge,
  StudioEmptyState,
  StudioHeroSection,
  StudioInspectorCard,
  StudioMetricRow,
  StudioPageShell,
  StudioSectionCard,
  StudioTimelineBlock,
} from '../../../components/ui';
import {
  AgencyBuilderDiffBoard,
  AgencyBuilderEntityCard,
  AgencyBuilderStepRail,
  type AgencyBuilderStep,
  type AgencyBuilderStepId,
} from '../components/AgencyBuilderSurface';

export default function AgencyBuilderPage() {
  const [canonical, setCanonical] = useState<CanonicalStudioStateResponse | null>(null);
  const [builderOutput, setBuilderOutput] = useState<BuilderAgentFunctionOutput | null>(null);
  const [preview, setPreview] = useState<CoreFilesPreviewResponse | null>(null);
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');
  const [selectedStep, setSelectedStep] = useState<AgencyBuilderStepId>('pack');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      departments: canonical?.departments.length ?? 0,
      workspaces: canonical?.workspaces.length ?? 0,
      agents: canonical?.agents.length ?? 0,
      subagents: canonical?.subagents.length ?? 0,
      skills: canonical?.catalog.skills.length ?? 0,
      tools: canonical?.catalog.tools.length ?? 0,
    }),
    [canonical],
  );

  const steps = useMemo<AgencyBuilderStep[]>(() => {
    const hasCanonical = Boolean(canonical);
    const hasBuilder = Boolean(canonical && builderOutput);
    const departmentsEmpty = Boolean(canonical) && counts.departments === 0;
    const workspacesEmpty = Boolean(canonical) && counts.workspaces === 0;
    const reviewReady = Boolean(preview);

    return [
      {
        id: 'pack',
        index: 1,
        title: 'Pack / select',
        subtitle: builderOutput
          ? builderOutput.whatItDoes
          : 'Load the builder agent function that explains how the agency surface is assembled.',
        note: builderOutput
          ? `${builderOutput.inputs.length} inputs, ${builderOutput.outputs.length} outputs`
          : 'Waiting for the builder function',
        state: deriveStepState(hasBuilder, false, selectedStep === 'pack'),
      },
      {
        id: 'agency',
        index: 2,
        title: 'Agency',
        subtitle: canonical
          ? `${canonical.agency.name}${canonical.agency.description ? ` - ${canonical.agency.description}` : ''}`
          : 'The agency root, description, and canonical tags.',
        note: canonical ? `${counts.departments} departments linked` : 'Waiting for canonical agency state',
        state: deriveStepState(hasCanonical, false, selectedStep === 'agency'),
      },
      {
        id: 'departments',
        index: 3,
        title: 'Departments',
        subtitle: canonical
          ? counts.departments > 0
            ? `${counts.departments} department${counts.departments === 1 ? '' : 's'} ready for review.`
            : 'No departments were returned in the canonical payload.'
          : 'Department cards map the agency into operating lanes.',
        note: canonical ? `Subagents: ${counts.subagents}` : 'Waiting for department structure',
        state: deriveStepState(counts.departments > 0, departmentsEmpty, selectedStep === 'departments'),
      },
      {
        id: 'workspaces',
        index: 4,
        title: 'Workspaces',
        subtitle: canonical
          ? counts.workspaces > 0
            ? `${counts.workspaces} workspace${counts.workspaces === 1 ? '' : 's'} linked to the agency.`
            : 'No workspaces are linked yet.'
          : 'Workspace cards surface deployment scope, routing, and ownership.',
        note: canonical ? `Agents: ${counts.agents}, skills: ${counts.skills}` : 'Waiting for workspace structure',
        state: deriveStepState(counts.workspaces > 0, workspacesEmpty, selectedStep === 'workspaces'),
      },
      {
        id: 'review',
        index: 5,
        title: 'Review / apply',
        subtitle: reviewReady
          ? `${preview?.diff.length ?? 0} diff entr${(preview?.diff.length ?? 0) === 1 ? 'y' : 'ies'} ready for apply.`
          : 'Preview the file diff, choose a rollback snapshot, then apply or rollback the core files.',
        note: versions.length > 0
          ? `${versions.length} snapshot${versions.length === 1 ? '' : 's'} available`
          : 'No rollback snapshots yet',
        state: deriveStepState(reviewReady, false, selectedStep === 'review'),
      },
    ];
  }, [builderOutput, canonical, counts, preview, selectedStep, versions.length]);

  const timelineItems = useMemo(
    () => [
      {
        title: canonical
          ? `${counts.departments} departments and ${counts.workspaces} workspaces mapped`
          : 'Waiting for canonical state',
        description: canonical
          ? 'The helper is anchored to the latest agency graph returned by the canonical state API.'
          : 'Loading agency, department, workspace, and catalog data.',
        meta: canonical?.generatedAt ? `Generated ${canonical.generatedAt}` : undefined,
      },
      {
        title: builderOutput
          ? `${builderOutput.inputs.length} inputs, ${builderOutput.outputs.length} outputs`
          : 'Builder contract pending',
        description: builderOutput
          ? `${builderOutput.skills.length} skills, ${builderOutput.tools.length} tools, and ${builderOutput.collaborators.length} collaborators describe the pack/select step.`
          : 'The pack/select step will show once the builder function responds.',
        meta: builderOutput?.entityLevel ? `Target ${builderOutput.entityLevel}` : undefined,
      },
      {
        title: preview
          ? `${preview.diff.length} diff entries prepared`
          : 'Core-file preview not loaded',
        description: preview
          ? `${preview.diagnostics.length} diagnostics and ${preview.artifacts.length} artifacts were returned by the preview endpoint.`
          : 'Use the review step to load and inspect proposed file changes before applying them.',
      },
    ],
    [builderOutput, canonical, counts.departments, counts.workspaces, preview],
  );

  async function reloadSurface() {
    const canonicalState = await getCanonicalStudioState();
    const [builder, corePreview, snapshotVersions] = await Promise.all([
      getBuilderAgentFunction('agency', canonicalState.agency.id),
      previewCoreFiles(),
      getVersions(),
    ]);

    setCanonical(canonicalState);
    setBuilderOutput(builder);
    setPreview(corePreview);
    setVersions(snapshotVersions);
    setSelectedSnapshotId((current) => {
      if (current && snapshotVersions.some((snapshot) => snapshot.id === current)) {
        return current;
      }
      return snapshotVersions[0]?.id ?? '';
    });
  }

  async function refreshPreview() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      setPreview(await previewCoreFiles());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load core files preview');
    } finally {
      setBusy(false);
    }
  }

  async function loadSurface() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await reloadSurface();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Agency Builder');
    } finally {
      setBusy(false);
    }
  }

  async function applyChanges() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await applyCoreFiles({ applyRuntime: true });
      if (!result.ok) {
        throw new Error(`Core files apply failed: ${(result.diagnostics ?? []).join(', ')}`);
      }
      await reloadSurface();
      setNotice('Core files applied successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply core files');
    } finally {
      setBusy(false);
    }
  }

  async function rollbackSnapshot() {
    if (!selectedSnapshotId) {
      setError('Select a snapshot to rollback');
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await rollbackCoreFiles(selectedSnapshotId);
      if (!result.ok) {
        throw new Error(result.error ?? 'Rollback failed');
      }
      await reloadSurface();
      setNotice(result.message ?? 'Rollback completed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rollback snapshot');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void loadSurface();
  }, []);

  const activeStep = steps.find((step) => step.id === selectedStep) ?? steps[0];

  return (
    <StudioPageShell maxWidth={1460}>
      <StudioHeroSection
        eyebrow="Agency Builder"
        title="Pack, shape, and apply the canonical agency graph"
        description="A guided helper surface for the agency root, department structure, workspace rollout, and core-file apply history."
        meta={
          <RuntimeStatusBadge
            status={canonical?.runtime.health.ok ? 'online' : 'degraded'}
            label={canonical?.runtime.health.ok ? 'runtime online' : 'runtime degraded'}
          />
        }
        actions={
          <>
          <button type="button" style={toolButton(true)} disabled={busy} onClick={() => void loadSurface()}>
            <RefreshCw size={14} className={busy ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button type="button" style={toolButton()} disabled={busy} onClick={() => void refreshPreview()}>
            <Wand2 size={14} />
            Preview
          </button>
            <button type="button" style={primaryButton()} disabled={busy} onClick={() => void applyChanges()}>
              <Boxes size={14} />
              Apply
            </button>
          </>
        }
      />

      <AgencyBuilderStepRail steps={steps} activeStep={selectedStep} onSelectStep={setSelectedStep} />

      <section className="studio-responsive-two-col" style={bodyGridStyle}>
        <StudioSectionCard
          title={activeStep.title}
          description={activeStep.subtitle}
          actions={
            <span style={stepActionStyle}>
              Step {activeStep.index} of 5
            </span>
          }
        >
          {renderStepPanel(
            selectedStep,
            canonical,
            builderOutput,
            preview,
            counts,
            selectedSnapshotId,
            setSelectedSnapshotId,
            busy,
            loadSurface,
            refreshPreview,
            applyChanges,
            rollbackSnapshot,
            versions,
          )}
        </StudioSectionCard>

        <div style={{ display: 'grid', gap: 14 }}>
          <StudioSectionCard title="Canonical snapshot" description="The latest loaded structure and lifecycle context.">
            {!canonical ? (
              <StudioEmptyState
                title="No canonical state loaded"
                description="Refresh the builder to load the agency, department, workspace, and catalog structure."
                actionLabel="Refresh"
                onAction={() => void loadSurface()}
              />
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                <StudioInspectorCard title="Totals">
                  <StudioMetricRow label="Departments" value={String(counts.departments)} />
                  <StudioMetricRow label="Workspaces" value={String(counts.workspaces)} />
                  <StudioMetricRow label="Agents" value={String(counts.agents)} />
                  <StudioMetricRow label="Subagents" value={String(counts.subagents)} />
                  <StudioMetricRow label="Skills" value={String(counts.skills)} />
                  <StudioMetricRow label="Tools" value={String(counts.tools)} />
                </StudioInspectorCard>

                <StudioInspectorCard title="Lifecycle">
                  <StudioMetricRow label="Agency" value={canonical.agency.name} hint={canonical.agency.id} />
                  <StudioMetricRow label="Generated" value={formatRelative(canonical.generatedAt)} hint={canonical.generatedAt} />
                  <StudioMetricRow
                    label="Lifecycle"
                    value={canonical.coreFiles.supportedLifecycle.join(' / ')}
                    hint={canonical.coreFiles.targets.join(', ')}
                  />
                  <StudioMetricRow
                    label="Rollback"
                    value={versions.length > 0 ? 'available' : 'none'}
                    hint={versions.length > 0 ? versions[0]?.label ?? versions[0]?.id ?? 'latest snapshot' : 'No snapshots returned'}
                  />
                </StudioInspectorCard>
              </div>
            )}
          </StudioSectionCard>

          <StudioSectionCard title="Flow notes" description="What the helper is doing right now.">
            <StudioTimelineBlock items={timelineItems} />
          </StudioSectionCard>
        </div>
      </section>

      {notice && (
        <div style={noticeBanner}>
          {notice}
        </div>
      )}

      {error && (
        <div style={errorBanner}>
          <AlertTriangle size={14} />
          {error}
        </div>
      )}
    </StudioPageShell>
  );
}

function renderStepPanel(
  step: AgencyBuilderStepId,
  canonical: CanonicalStudioStateResponse | null,
  builderOutput: BuilderAgentFunctionOutput | null,
    preview: CoreFilesPreviewResponse | null,
    counts: { departments: number; workspaces: number; agents: number; subagents: number; skills: number; tools: number },
    selectedSnapshotId: string,
    setSelectedSnapshotId: (value: string) => void,
    busy: boolean,
    loadSurface: () => void,
    refreshPreview: () => void,
    applyChanges: () => void,
    rollbackSnapshot: () => void,
    versions: VersionSnapshot[],
) {
  if (step === 'pack') {
    if (!canonical || !builderOutput) {
      return (
        <StudioEmptyState
          title="Loading pack / select data"
          description="The agency builder function and canonical structure are still being loaded."
          actionLabel="Refresh"
          onAction={loadSurface}
        />
      );
    }

    return (
      <div style={panelStackStyle}>
        <AgencyBuilderEntityCard
          title={builderOutput.entityName}
          subtitle={`${builderOutput.entityLevel} - ${builderOutput.entityId}`}
          description={builderOutput.whatItDoes}
          icon={<Wand2 size={18} />}
          tone="accent"
          badges={[
            `${builderOutput.inputs.length} inputs`,
            `${builderOutput.outputs.length} outputs`,
            `${builderOutput.skills.length} skills`,
            `${builderOutput.tools.length} tools`,
          ]}
          metrics={[
            { label: 'Collaborators', value: builderOutput.collaborators.join(', ') || 'None' },
            { label: 'Core target', value: canonical.coreFiles.targets.join(', ') || 'None' },
          ]}
        />

        <StudioInspectorCard title="Proposed core-file diffs">
          {builderOutput.proposedCoreFileDiffs.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {builderOutput.proposedCoreFileDiffs.slice(0, 6).map((entry) => (
                <div
                  key={`${entry.path}-${entry.status}`}
                  style={previewDiffCardStyle(entry.status)}
                >
                  <div style={{ display: 'grid', gap: 3 }}>
                    <code style={{ fontSize: 12, color: 'var(--text-primary)' }}>{entry.path}</code>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {entry.status === 'unchanged' ? 'Stable' : 'Part of the builder output'}
                    </span>
                  </div>
                  <span style={statusPillStyle(entry.status)}>
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <StudioEmptyState
              title="No proposed diffs"
              description="The builder output did not include core-file changes for this entity."
            />
          )}
        </StudioInspectorCard>
      </div>
    );
  }

  if (step === 'agency') {
    if (!canonical) {
      return (
        <StudioEmptyState
          title="No agency loaded"
          description="Refresh the helper to load the canonical agency root and related structure."
          actionLabel="Refresh"
          onAction={loadSurface}
        />
      );
    }

    return (
      <div style={panelStackStyle}>
        <AgencyBuilderEntityCard
          title={canonical.agency.name}
          subtitle={`Agency - ${canonical.agency.id}`}
          description={canonical.agency.description ?? 'No agency description was provided in canonical state.'}
          icon={<Building2 size={18} />}
          badges={canonical.agency.tags.length > 0 ? canonical.agency.tags : ['canonical']}
          metrics={[
            { label: 'Departments', value: String(counts.departments) },
            { label: 'Workspaces', value: String(counts.workspaces) },
            { label: 'Agents', value: String(counts.agents) },
            { label: 'Subagents', value: String(counts.subagents) },
          ]}
        />

        <StudioInspectorCard title="Agency relationships">
          <StudioMetricRow label="Department IDs" value={canonical.agency.departmentIds.join(', ') || 'None'} />
          <StudioMetricRow label="Tags" value={canonical.agency.tags.join(', ') || 'None'} />
          <StudioMetricRow label="Generated" value={formatRelative(canonical.generatedAt)} hint={canonical.generatedAt} />
        </StudioInspectorCard>
      </div>
    );
  }

  if (step === 'departments') {
    if (!canonical) {
      return (
        <StudioEmptyState
          title="No departments loaded"
          description="Department preview cards appear after the canonical agency structure loads."
          actionLabel="Refresh"
          onAction={loadSurface}
        />
      );
    }

    if (canonical.departments.length === 0) {
      return (
        <StudioEmptyState
          title="No departments yet"
          description="The canonical payload did not include departments. Refresh to confirm the current agency structure."
          actionLabel="Refresh"
          onAction={loadSurface}
        />
      );
    }

    return (
      <div style={entityGridStyle}>
        {canonical.departments.map((department) => (
          <AgencyBuilderEntityCard
            key={department.id}
            title={department.name}
            subtitle={`Department - ${department.id}`}
            description={department.description ?? 'No department description provided.'}
            icon={<Layers3 size={18} />}
            badges={department.tags.length > 0 ? department.tags : ['department']}
            metrics={[
              { label: 'Agency', value: department.agencyId },
              { label: 'Workspaces', value: String(department.workspaceIds.length) },
            ]}
          />
        ))}
      </div>
    );
  }

  if (step === 'workspaces') {
    if (!canonical) {
      return (
        <StudioEmptyState
          title="No workspaces loaded"
          description="Workspace preview cards appear after the canonical agency structure loads."
          actionLabel="Refresh"
          onAction={loadSurface}
        />
      );
    }

    if (canonical.workspaces.length === 0) {
      return (
        <StudioEmptyState
          title="No workspaces yet"
          description="The canonical payload did not include workspaces. Refresh to confirm the current rollout."
          actionLabel="Refresh"
          onAction={loadSurface}
        />
      );
    }

    return (
      <div style={entityGridStyle}>
        {canonical.workspaces.map((workspace) => (
          <AgencyBuilderEntityCard
            key={workspace.id}
            title={workspace.name}
            subtitle={`Workspace - ${workspace.id}`}
            description={workspace.description ?? 'No workspace description provided.'}
            icon={<Boxes size={18} />}
            badges={workspace.tags.length > 0 ? workspace.tags : [workspace.slug]}
            metrics={[
              { label: 'Department', value: workspace.departmentId },
              { label: 'Agents', value: String(workspace.agentIds.length) },
              { label: 'Skills', value: String(workspace.skillIds.length) },
              { label: 'Policies', value: String(workspace.policyRefs.length) },
              { label: 'Routing rules', value: String(workspace.routingRules.length) },
              { label: 'Default model', value: workspace.defaultModel ?? 'Unset' },
            ]}
          />
        ))}
      </div>
    );
  }

    return (
      <AgencyBuilderDiffBoard
        preview={preview}
        versions={versions}
        selectedSnapshotId={selectedSnapshotId}
        onSelectSnapshotId={setSelectedSnapshotId}
        onPreview={refreshPreview}
        onApply={applyChanges}
        onRollback={rollbackSnapshot}
        busy={busy}
      />
    );
}

function deriveStepState(ready: boolean, empty: boolean, selected: boolean) {
  if (empty) return 'warning';
  if (ready) return 'complete';
  return selected ? 'active' : 'idle';
}

function formatRelative(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;

  const diff = Date.now() - timestamp;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function previewDiffCardStyle(status: CoreFilesPreviewResponse['diff'][number]['status']) {
  const tone =
    status === 'added'
      ? { border: 'var(--tone-success-border)', background: 'var(--tone-success-bg)' }
      : status === 'updated'
        ? { border: 'var(--tone-warning-border)', background: 'var(--tone-warning-bg)' }
        : status === 'deleted'
          ? { border: 'var(--tone-danger-border)', background: 'var(--tone-danger-bg)' }
          : { border: 'var(--border-primary)', background: 'var(--bg-secondary)' };

  return {
    borderRadius: 'var(--radius-lg)',
    border: `1px solid ${tone.border}`,
    background: tone.background,
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  } as const;
}

function statusPillStyle(status: CoreFilesPreviewResponse['diff'][number]['status']) {
  if (status === 'added') {
    return pillStyle('var(--tone-success-bg)', 'var(--tone-success-border)', 'var(--tone-success-text)');
  }
  if (status === 'updated') {
    return pillStyle('var(--tone-warning-bg)', 'var(--tone-warning-border)', 'var(--tone-warning-text)');
  }
  if (status === 'deleted') {
    return pillStyle('var(--tone-danger-bg)', 'var(--tone-danger-border)', 'var(--tone-danger-text)');
  }
  return pillStyle('var(--bg-primary)', 'var(--border-primary)', 'var(--text-muted)');
}

function pillStyle(background: string, border: string, color: string) {
  return {
    borderRadius: 'var(--radius-full)',
    border: `1px solid ${border}`,
    background,
    color,
    padding: '4px 9px',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  } as const;
}

function toolButton(withSoftFill = false): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-primary)',
    background: withSoftFill ? 'var(--color-primary-soft)' : 'var(--card-bg)',
    color: withSoftFill ? 'var(--color-primary)' : 'var(--text-primary)',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
  };
}

function primaryButton(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-primary)',
    background: 'var(--color-primary)',
    color: 'var(--btn-primary-text)',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
  };
}

const bodyGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.3fr) minmax(340px, 0.9fr)',
  gap: 14,
  alignItems: 'start',
};

const panelStackStyle: CSSProperties = {
  display: 'grid',
  gap: 14,
};

const entityGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 14,
};

const stepActionStyle: CSSProperties = {
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-secondary)',
  padding: '6px 10px',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

const noticeBanner: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--tone-success-border)',
  background: 'var(--tone-success-bg)',
  color: 'var(--tone-success-text)',
  padding: '10px 12px',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
  fontWeight: 600,
};

const errorBanner: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--tone-danger-border)',
  background: 'var(--tone-danger-bg)',
  color: 'var(--tone-danger-text)',
  padding: '10px 12px',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
  fontWeight: 600,
};
