interface GatewayLogsPanelProps {
  diagnostics: Record<string, unknown>;
}

export function GatewayLogsPanel({ diagnostics }: GatewayLogsPanelProps) {
  return (
    <div className="rounded border border-slate-300 bg-white p-3">
      <h3 className="mb-2 text-sm font-semibold">Gateway Diagnostics Payload</h3>
      <pre className="max-h-64 overflow-auto text-xs">{JSON.stringify(diagnostics, null, 2)}</pre>
    </div>
  );
}
