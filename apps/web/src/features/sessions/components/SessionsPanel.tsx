interface SessionsPanelProps {
  sessions: unknown[];
}

export function SessionsPanel({ sessions }: SessionsPanelProps) {
  return (
    <div className="rounded border border-slate-300 bg-white p-3">
      <h3 className="mb-2 text-sm font-semibold">Runtime Sessions</h3>
      <ul className="space-y-2 text-xs">
        {sessions.map((session, index) => (
          <li key={index} className="rounded bg-slate-50 p-2">
            <pre className="overflow-x-auto">{JSON.stringify(session, null, 2)}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
