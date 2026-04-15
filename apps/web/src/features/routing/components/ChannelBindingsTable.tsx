import { AgentSpec } from '../../../lib/types';

interface ChannelBindingsTableProps {
  agents: AgentSpec[];
}

export function ChannelBindingsTable({ agents }: ChannelBindingsTableProps) {
  const rows = agents.flatMap((agent) => agent.channelBindings.map((binding) => ({ agentId: agent.id, ...binding })));

  return (
    <table className="w-full rounded border border-slate-300 bg-white text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200">
          <th className="px-2 py-1">Agent</th>
          <th className="px-2 py-1">Channel</th>
          <th className="px-2 py-1">Route</th>
          <th className="px-2 py-1">Enabled</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-slate-100">
            <td className="px-2 py-1">{row.agentId}</td>
            <td className="px-2 py-1">{row.channel}</td>
            <td className="px-2 py-1">{row.route}</td>
            <td className="px-2 py-1">{row.enabled ? 'yes' : 'no'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
