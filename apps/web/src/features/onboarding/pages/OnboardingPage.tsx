import { useEffect, useState } from 'react';
import { Cpu } from 'lucide-react';

import { getStudioState } from '../../../lib/api';
import { ProfileSpec } from '../../../lib/types';
import { WorkspaceEditor } from '../../workspaces/components/WorkspaceEditor';
import { LoadingSpinner } from '../../../components';

interface OnboardingPageProps {
  onComplete: () => Promise<void>;
}

export default function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [profiles, setProfiles] = useState<ProfileSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStudioState()
      .then((s) => {
        setProfiles(s.profiles);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load profiles');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Brand hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg shadow-blue-900/40 mb-4">
            <Cpu size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">OpenClaw Studio</h1>
          <p className="mt-2 text-sm text-slate-400">
            Create your first workspace to start building agents.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
          {/* Card header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-900">Create Workspace</h2>
            <p className="text-xs text-slate-500 mt-0.5">Choose a profile to get started</p>
          </div>

          {/* Card body */}
          <div className="p-6">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <LoadingSpinner size="md" />
                <p className="text-xs text-slate-500">Loading profiles...</p>
              </div>
            ) : (
              <WorkspaceEditor
                profiles={profiles}
                onCreated={async () => {
                  await onComplete();
                }}
              />
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-4 text-center text-xs text-slate-500">
          Profiles define the default model, skills, and routines for your workspace.
        </p>
      </div>
    </div>
  );
}
