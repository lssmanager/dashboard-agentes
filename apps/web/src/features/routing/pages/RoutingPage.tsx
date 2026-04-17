import { useState } from 'react';
import { Landmark, AlertCircle } from 'lucide-react';

import { useStudioState } from '../../../lib/StudioStateContext';
import { WorkspaceSpec } from '../../../lib/types';
import { ChannelBindingsTable } from '../components/ChannelBindingsTable';
import { RouteEditor } from '../components/RouteEditor';

export function RoutingPage() {
  const { state } = useStudioState();
  const [workspace, setWorkspace] = useState<WorkspaceSpec | null>(state.workspace);

  if (!workspace) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg border-l-4 border-l-amber-500 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900">No Workspace</h3>
              <p className="text-sm text-amber-800 mt-1">
                Create or select a workspace first to configure routing rules.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Landmark size={32} className="text-blue-600" />
          Routing & Channels
        </h1>
        <p className="text-slate-600 mt-1">
          Configure how agents are routed to channels and manage channel bindings.
        </p>
      </div>

      {/* 2-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Channel Bindings */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 p-6 sticky top-20">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Channel Bindings</h3>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <ChannelBindingsTable agents={state.agents} />
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Shows which agents are bound to which channels for message delivery.
            </p>
          </div>
        </div>

        {/* Right Panel: Route Editor */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Route Configuration</h3>
            <div className="prose prose-sm max-w-none prose-table:w-full">
              <RouteEditor workspace={workspace} onSaved={setWorkspace} />
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h4 className="font-semibold text-blue-900 mb-2">How Routing Works</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>
            <strong>Channel Bindings:</strong> Map agents to communication channels (email, Slack, Teams, etc.)
          </li>
          <li>
            <strong>Rules:</strong> Define conditions for routing messages to specific agents
          </li>
          <li>
            <strong>Fallback:</strong> If no rules match, messages go to the default agent
          </li>
          <li>
            <strong>Load Balancing:</strong> Distribute incoming messages across multiple agents
          </li>
        </ul>
      </div>
    </div>
  );
}
