import { useEffect, useState } from 'react';

import { getStudioState } from '../../../lib/api';
import { SessionsPanel } from '../components/SessionsPanel';

export function SessionsPage() {
  const [sessions, setSessions] = useState<unknown[]>([]);

  useEffect(() => {
    void getStudioState().then((state) => {
      setSessions(state.runtime.sessions.payload ?? []);
    });
  }, []);

  return (
    <div className="p-4">
      <SessionsPanel sessions={sessions} />
    </div>
  );
}
