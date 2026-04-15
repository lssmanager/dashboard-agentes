import { useState } from 'react';

import { applyDeploy, getDeployPreview } from '../../../lib/api';
import { DeployPreview, WorkspaceSpec } from '../../../lib/types';
import { WorkspaceDeployPanel } from '../components/WorkspaceDeployPanel';
import { WorkspaceEditor } from '../components/WorkspaceEditor';
import { WorkspaceFileTree } from '../components/WorkspaceFileTree';
import { WorkspaceList } from '../components/WorkspaceList';

export function WorkspacesPage() {
  const [workspace, setWorkspace] = useState<WorkspaceSpec | null>(null);
  const [preview, setPreview] = useState<DeployPreview | null>(null);

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <WorkspaceList current={workspace} />
      <WorkspaceEditor onCreated={setWorkspace} />
      <WorkspaceFileTree preview={preview} />
      <WorkspaceDeployPanel
        onPreview={() => void getDeployPreview().then(setPreview)}
        onDeploy={() => void applyDeploy({ applyRuntime: true })}
      />
    </div>
  );
}
