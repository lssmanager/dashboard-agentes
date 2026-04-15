import { useEffect, useState } from 'react';

import { getStudioState } from '../../../lib/api';
import { ProfileSpec } from '../../../lib/types';
import { ProfileEditor } from '../components/ProfileEditor';
import { ProfileGallery } from '../components/ProfileGallery';

export function ProfilesPage() {
  const [profiles, setProfiles] = useState<ProfileSpec[]>([]);
  const [selected, setSelected] = useState<ProfileSpec | null>(null);

  useEffect(() => {
    void getStudioState().then((state) => {
      setProfiles(state.profiles);
      setSelected(state.profiles[0] ?? null);
    });
  }, []);

  return (
    <div className="space-y-4 p-4">
      <ProfileGallery profiles={profiles} onSelect={setSelected} />
      {selected && <ProfileEditor profile={selected} />}
    </div>
  );
}
