interface ProtocolStatusPanelProps {
  sessionsCount: number;
}

export function ProtocolStatusPanel({ sessionsCount }: ProtocolStatusPanelProps) {
  return (
    <div className="rounded border border-slate-300 bg-white p-3">
      <h3 className="text-sm font-semibold">Protocol Status</h3>
      <p className="text-sm">Observed sessions: {sessionsCount}</p>
    </div>
  );
}
