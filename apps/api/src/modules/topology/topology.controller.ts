import { Router } from 'express';

import type {
  TopologyActionRequest,
  TopologyRuntimeAction,
} from '../../../../../packages/core-types/src';
import { TopologyService } from './topology.service';

const ACTIONS: TopologyRuntimeAction[] = [
  'connect',
  'disconnect',
  'pause',
  'reactivate',
  'redirect',
  'continue',
];

export function registerTopologyRoutes(router: Router) {
  const service = new TopologyService();

  const routeAction = (action: TopologyRuntimeAction) => {
    router.post(`/topology/${action}`, async (req, res) => {
      try {
        const payload = req.body as Omit<TopologyActionRequest, 'action'>;
        const result = await service.executeAction(action, payload);
        res.status(200).json(result);
      } catch (error) {
        res.status(400).json({
          action,
          status: 'rejected',
          runtimeSupported: false,
          message: (error as Error).message,
          requestedAt: new Date().toISOString(),
          errorCode: 'INVALID_TOPOLOGY_REQUEST',
        });
      }
    });
  };

  ACTIONS.forEach(routeAction);
}
