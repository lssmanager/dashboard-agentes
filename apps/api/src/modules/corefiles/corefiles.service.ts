import { DeployableArtifact } from '../../../../../packages/core-types/src';
import { WorkspacesCompiler } from '../workspaces/workspaces.compiler';
import { DeployDiffService } from '../deploy/deploy-diff.service';
import { DeployService } from '../deploy/deploy.service';
import { VersionsService } from '../versions/versions.service';

export class CorefilesService {
  private readonly compiler = new WorkspacesCompiler();
  private readonly diffService = new DeployDiffService();
  private readonly deployService = new DeployService();
  private readonly versionsService = new VersionsService();

  async preview() {
    const compile = await this.compiler.compileCurrent();
    return {
      ...compile,
      diff: this.diffService.diffArtifacts(compile.artifacts),
      lifecycle: ['preview', 'diff', 'apply', 'rollback'] as const,
    };
  }

  async diff(snapshotId?: string) {
    if (snapshotId) {
      const snapshotDiff = this.versionsService.getDiff(snapshotId);
      if (!snapshotDiff) {
        return {
          ok: false,
          error: `Snapshot not found: ${snapshotId}`,
        };
      }

      return {
        ok: true,
        source: 'snapshot',
        ...snapshotDiff,
      };
    }

    const preview = await this.preview();
    return {
      ok: true,
      source: 'current',
      diffs: preview.diff,
    };
  }

  async apply(payload?: { artifacts?: DeployableArtifact[]; applyRuntime?: boolean }) {
    const compile = await this.compiler.compileCurrent();
    if (compile.diagnostics.length > 0) {
      return {
        ok: false,
        diagnostics: compile.diagnostics,
      };
    }

    const artifacts = payload?.artifacts ?? compile.artifacts;
    const snapshot = this.versionsService.createSnapshot(
      `Corefiles apply ${new Date().toISOString()}`,
    );
    const writeResult = this.deployService.applyArtifacts(artifacts);
    const runtime = payload?.applyRuntime
      ? await this.deployService.triggerRuntimeReload()
      : null;

    return {
      ok: true,
      snapshotId: snapshot.id,
      writeResult,
      runtime,
      lifecycle: 'apply',
    };
  }

  rollback(snapshotId: string) {
    const rolledBack = this.versionsService.rollback(snapshotId);
    if (!rolledBack) {
      return {
        ok: false,
        error: `Snapshot not found: ${snapshotId}`,
      };
    }

    return {
      ok: true,
      lifecycle: 'rollback',
      snapshotId,
      message: `Rolled back to snapshot ${snapshotId}`,
    };
  }
}
