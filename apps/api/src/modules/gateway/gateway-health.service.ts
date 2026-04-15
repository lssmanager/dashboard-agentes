import { GatewayService } from './gateway.service';

export class GatewayHealthService {
  constructor(private readonly gatewayService: GatewayService) {}

  async getHealthSummary() {
    const health = await this.gatewayService.health();
    return {
      ok: Boolean((health as { ok?: boolean }).ok),
      timestamp: new Date().toISOString(),
      payload: health,
    };
  }
}
