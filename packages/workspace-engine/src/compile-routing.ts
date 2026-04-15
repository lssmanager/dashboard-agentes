import { WorkspaceSpec } from '../../core-types/src';

export function compileRouting(workspace: WorkspaceSpec) {
  return {
    workspaceId: workspace.id,
    rules: workspace.routingRules
      .slice()
      .sort((a, b) => a.priority - b.priority)
      .map((rule) => ({
        id: rule.id,
        from: rule.from,
        to: rule.to,
        when: rule.when,
      })),
  };
}
