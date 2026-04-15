import { GatewayService } from './gateway.service';

export class GatewayDiagnosticsService {
  constructor(private readonly gatewayService: GatewayService) {}

  async getDiagnosticsSummary() {
    const [diagnostics, state] = await Promise.all([
      this.gatewayService.diagnostics(),
      this.gatewayService.dashboardState(),
    ]);

    return {
      diagnostics,
      observed: {
        agents: Array.isArray((state as { agents?: unknown[] }).agents)
          ? ((state as { agents?: unknown[] }).agents?.length ?? 0)
          : 0,
        sessions: Array.isArray((state as { sessions?: unknown[] }).sessions)
          ? ((state as { sessions?: unknown[] }).sessions?.length ?? 0)
          : 0,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
