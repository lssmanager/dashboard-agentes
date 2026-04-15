interface GatewayHealthCardProps {
  ok: boolean;
}

export function GatewayHealthCard({ ok }: GatewayHealthCardProps) {
  return (
    <div className="rounded border border-slate-300 bg-white p-3">
      <h3 className="text-sm font-semibold">Gateway Health</h3>
      <p className="text-sm">{ok ? 'Online' : 'Offline'}</p>
    </div>
  );
}
