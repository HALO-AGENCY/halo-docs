import {
  type DialogComponentProps,
  type GLOBAL_DIALOG_SCHEMA,
  GlobalDialogService,
  WorkspaceDialogService,
} from '@affine/core/modules/dialogs';
import type { WORKSPACE_DIALOG_SCHEMA } from '@affine/core/modules/dialogs/constant';
import {
  isHaloHosted,
  openHaloSettings,
} from '@affine/core/utils/halo-docs-host';
import { useLiveData, useService } from '@toeverything/infra';
import { useEffect } from 'react';

import { ChangePasswordDialog } from './change-password';
import { CollectionEditorDialog } from './collection-editor';
import { CreateWorkspaceDialog } from './create-workspace';
import { DeletedAccountDialog } from './deleted-account';
import { DocInfoDialog } from './doc-info';
import { EnableCloudDialog } from './enable-cloud';
import { ImportDialog } from './import';
import { ImportTemplateDialog } from './import-template';
import { ImportWorkspaceDialog } from './import-workspace';
import { CollectionSelectorDialog } from './selectors/collection';
import { DateSelectorDialog } from './selectors/date';
import { DocSelectorDialog } from './selectors/doc';
import { TagSelectorDialog } from './selectors/tag';
import { SettingDialog } from './setting';
import { HaloSettingsBridge } from './setting/halo-settings-bridge';
import { SignInDialog } from './sign-in';
import { VerifyEmailDialog } from './verify-email';

const GLOBAL_DIALOGS = {
  'create-workspace': CreateWorkspaceDialog,
  'import-workspace': ImportWorkspaceDialog,
  'import-template': ImportTemplateDialog,
  'sign-in': SignInDialog,
  'change-password': ChangePasswordDialog,
  'verify-email': VerifyEmailDialog,
  'enable-cloud': EnableCloudDialog,
  'deleted-account': DeletedAccountDialog,
} satisfies {
  [key in keyof GLOBAL_DIALOG_SCHEMA]?: React.FC<
    DialogComponentProps<GLOBAL_DIALOG_SCHEMA[key]>
  >;
};

const WORKSPACE_DIALOGS = {
  'doc-info': DocInfoDialog,
  'collection-editor': CollectionEditorDialog,
  'tag-selector': TagSelectorDialog,
  'doc-selector': DocSelectorDialog,
  'collection-selector': CollectionSelectorDialog,
  'date-selector': DateSelectorDialog,
  setting: SettingDialog,
  import: ImportDialog,
} satisfies {
  [key in keyof WORKSPACE_DIALOG_SCHEMA]?: React.FC<
    DialogComponentProps<WORKSPACE_DIALOG_SCHEMA[key]>
  >;
};

/** HALO has one Docs workspace per client: inside HALO, nothing creates or imports another (Shaan, 28 Sep 2026). */
const HALO_HOSTED_WITHOUT = new Set<string>([
  'create-workspace',
  'import-workspace',
]);

/** Closes a refused dialog at once, so whoever opened it is answered rather than left waiting. */
const HaloRefusedDialog = ({ close }: { close: () => void }) => {
  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

export const GlobalDialogs = () => {
  const globalDialogService = useService(GlobalDialogService);
  const dialogs = useLiveData(globalDialogService.dialogs$);
  const haloHosted = isHaloHosted();
  return (
    <>
      {dialogs.map(dialog => {
        const DialogComponent =
          haloHosted && HALO_HOSTED_WITHOUT.has(dialog.type)
            ? HaloRefusedDialog
            : GLOBAL_DIALOGS[dialog.type as keyof typeof GLOBAL_DIALOGS];
        if (!DialogComponent) {
          return null;
        }
        return (
          <DialogComponent
            key={dialog.id}
            {...(dialog.props as any)}
            close={(result?: unknown) => {
              globalDialogService.close(dialog.id, result);
            }}
          />
        );
      })}
    </>
  );
};

/**
 * Inside HALO, Docs' Settings live in HALO's Settings (setting/halo-settings-bridge.tsx): anything in Docs that opens
 * AFFiNE's settings dialog (the account menu, a doc's "workspace settings" link) opens HALO's on that section instead.
 */
const HaloSettingDialog = ({
  close,
  activeTab,
  scrollAnchor,
}: DialogComponentProps<WORKSPACE_DIALOG_SCHEMA['setting']>) => {
  useEffect(() => {
    openHaloSettings(activeTab ?? 'appearance', scrollAnchor);
    close();
    // Once per request: this dialog closes itself straight away.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

export const WorkspaceDialogs = () => {
  const workspaceDialogService = useService(WorkspaceDialogService);
  const dialogs = useLiveData(workspaceDialogService.dialogs$);
  const haloHosted = isHaloHosted();
  return (
    <>
      {haloHosted ? <HaloSettingsBridge /> : null}
      {dialogs.map(dialog => {
        const DialogComponent =
          haloHosted && dialog.type === 'setting'
            ? HaloSettingDialog
            : WORKSPACE_DIALOGS[dialog.type as keyof typeof WORKSPACE_DIALOGS];
        if (!DialogComponent) {
          return null;
        }
        return (
          <DialogComponent
            key={dialog.id}
            {...(dialog.props as any)}
            close={(result?: unknown) => {
              workspaceDialogService.close(dialog.id, result);
            }}
          />
        );
      })}
    </>
  );
};
