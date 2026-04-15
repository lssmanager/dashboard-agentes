import { ProfileSpec } from '../../../lib/types';
import { ProfileCard } from './ProfileCard';

interface ProfileGalleryProps {
  profiles: ProfileSpec[];
  onSelect: (profile: ProfileSpec) => void;
}

export function ProfileGallery({ profiles, onSelect }: ProfileGalleryProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {profiles.map((profile) => (
        <ProfileCard key={profile.id} profile={profile} onSelect={onSelect} />
      ))}
    </div>
  );
}
