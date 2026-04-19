import {
  TopologyActionRequest,
  TopologyActionResult,
  TopologyRuntimeAction,
} from '../../../../../packages/core-types/src';
import {
  topologyActionRequestSchema,
} from '../../../../../packages/schemas/src';
import { RuntimeAdapter } from '../runtime/runtime-adapter.interface';
import { runtimeAdapterRegistry } from '../runtime/runtime-adapter.registry';

export class TopologyService {
  constructor(private readonly runtimeAdapter: RuntimeAdapter = runtimeAdapterRegistry.getActive()) {}

  async executeAction(
    action: TopologyRuntimeAction,
    payload: Omit<TopologyActionRequest, 'action'>,
  ): Promise<TopologyActionResult> {
    const parsed = topologyActionRequestSchema.parse({
      action,
      ...payload,
    });
    return this.runtimeAdapter.executeTopologyAction(action, {
      from: parsed.from,
      to: parsed.to,
      reason: parsed.reason,
      metadata: parsed.metadata,
    });
  }
}
