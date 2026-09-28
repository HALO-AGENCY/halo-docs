/**
 * The workspace card when HALO hosts Docs.
 *
 * HALO has one Docs workspace per client, so the card opens no workspace list and offers no "Create workspace"
 * (Shaan, 28 Sep 2026: clicking "HALO Docs (dev)" opened AFFiNE's pop-up with "create your workspace"). It is where
 * the workspace's own settings are: a click opens HALO's Settings on Docs' workspace section.
 */
import { GlobalContextService } from '@affine/core/modules/global-context';
import { WorkspacesService } from '@affine/core/modules/workspace';
import { openHaloSettings } from '@affine/core/utils/halo-docs-host';
import { useLiveData, useServices } from '@toeverything/infra';
import { useCallback } from 'react';

import { WorkspaceCard } from '../workspace-selector/workspace-card';

export const HaloWorkspaceCard = () => {
  const { workspacesService, globalContextService } = useServices({
    GlobalContextService,
    WorkspacesService,
  });
  const workspaceId = useLiveData(
    globalContextService.globalContext.workspaceId.$
  );
  const workspaceMetadata = useLiveData(
    workspaceId ? workspacesService.list.workspace$(workspaceId) : null
  );
  const openWorkspaceSettings = useCallback(
    () => openHaloSettings('workspace:preference'),
    []
  );
  if (!workspaceMetadata) return null;
  return (
    <WorkspaceCard
      workspaceMetadata={workspaceMetadata}
      onClick={openWorkspaceSettings}
      showSyncStatus
      hideCollaborationIcon
      hideTeamWorkspaceIcon
      dense
      title="Workspace settings"
      data-testid="current-workspace-card"
      data-halo-workspace-card
    />
  );
};
