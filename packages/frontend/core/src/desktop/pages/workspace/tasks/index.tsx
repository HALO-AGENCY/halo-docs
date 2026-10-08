import {
  HaloExplorerHeader,
  HaloPageSlot,
  isHaloHosted,
} from '@affine/core/components/explorer/header/halo-header';
import { ViewBody, ViewHeader } from '@affine/core/modules/workbench';
import { Navigate } from 'react-router-dom';

export function Component() {
  if (!isHaloHosted()) return <Navigate to="/all" replace />;
  return (
    <>
      <ViewHeader>
        <HaloExplorerHeader active="tasks" />
      </ViewHeader>
      <ViewBody>
        <div style={{ flex: 1, minHeight: 0, width: '100%', overflow: 'auto' }}>
          <HaloPageSlot name="tasks" />
        </div>
      </ViewBody>
    </>
  );
}
