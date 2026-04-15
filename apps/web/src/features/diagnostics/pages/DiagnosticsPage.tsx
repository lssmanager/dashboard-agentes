import { useEffect, useState } from 'react';

import { getStudioState } from '../../../lib/api';
import { StudioStateResponse } from '../../../lib/types';
import { GatewayHealthCard } from '../components/GatewayHealthCard';
import { GatewayLogsPanel } from '../components/GatewayLogsPanel';
import { ProtocolStatusPanel } from '../components/ProtocolStatusPanel';

export function DiagnosticsPage() {
  const [state, setState] = useState<StudioStateResponse | null>(null);

  useEffect(() => {
    void getStudioState().then(setState);
  }, []);

  return (
    <div className="space-y-4 p-4">
      <GatewayHealthCard ok={Boolean(state?.runtime.health.ok)} />
      <ProtocolStatusPanel sessionsCount={state?.runtime.sessions.payload?.length ?? 0} />
      <GatewayLogsPanel diagnostics={(state?.runtime.diagnostics as Record<string, unknown>) ?? {}} />
    </div>
  );
}
