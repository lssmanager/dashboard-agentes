import { StudioService } from '../studio/studio.service';
import { RuntimeAdapter } from './runtime-adapter.interface';
import { runtimeAdapterRegistry } from './runtime-adapter.registry';

export class RuntimeInspectionService {
  private readonly studio: StudioService;

  constructor(
    private readonly runtimeAdapter: RuntimeAdapter = runtimeAdapterRegistry.getActive(),
  ) {
    this.studio = new StudioService(runtimeAdapter);
  }

  async getCapabilityMatrix() {
    return this.runtimeAdapter.getCapabilities();
  }

  async getSessions() {
    return this.runtimeAdapter.inspectSessions();
  }

  async getChannels() {
    return this.runtimeAdapter.inspectChannels();
  }

  async getTopologyLinks() {
    const canonical = await this.studio.getCanonicalState();
    return this.runtimeAdapter.inspectTopologyLinks(canonical.topology.connections);
  }
}
