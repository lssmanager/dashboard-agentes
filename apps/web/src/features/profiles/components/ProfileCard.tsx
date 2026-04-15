import { ProfileSpec } from '../../../lib/types';

interface ProfileCardProps {
  profile: ProfileSpec;
  onSelect?: (profile: ProfileSpec) => void;
}

export function ProfileCard({ profile, onSelect }: ProfileCardProps) {
  return (
    <button
      className="w-full rounded border border-slate-300 bg-white p-3 text-left"
      onClick={() => onSelect?.(profile)}
      type="button"
    >
      <p className="text-sm font-semibold">{profile.name}</p>
      <p className="text-xs text-slate-600">{profile.description}</p>
    </button>
  );
}
