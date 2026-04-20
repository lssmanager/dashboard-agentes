import { VersionsService } from '../versions/versions.service';
import { CorefilesService } from './corefiles.service';

type CorefileTargetParam = string;

export class CorefilesFacade {
  private readonly corefilesService = new CorefilesService();
  private readonly versionsService = new VersionsService();

  async preview(target?: CorefileTargetParam) {
    const preview = await this.corefilesService.preview();
    if (!target) return preview;

    return {
      ...preview,
      diff: preview.diff.filter((item) =>
        item.path.toUpperCase().includes(target.toUpperCase()),
      ),
    };
  }

  async diff(target?: CorefileTargetParam, snapshotId?: string) {
    const result = await this.corefilesService.diff(snapshotId);
    if (!target) return result;
    if ((result as { ok?: boolean }).ok === false) return result;

    const withDiffs = result as { diffs?: Array<{ path: string }> };
    return {
      ...result,
      diffs: (withDiffs.diffs ?? []).filter((item) =>
        item.path.toUpperCase().includes(target.toUpperCase()),
      ),
    };
  }

  async apply(target?: CorefileTargetParam, payload?: { applyRuntime?: boolean }) {
    void target;
    return this.corefilesService.apply({ applyRuntime: payload?.applyRuntime });
  }

  rollback(snapshotId: string) {
    return this.corefilesService.rollback(snapshotId);
  }

  listSnapshots() {
    return this.versionsService.listSnapshots();
  }
}
