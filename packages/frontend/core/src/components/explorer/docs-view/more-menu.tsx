import {
  IconButton,
  type IconButtonProps,
  Menu,
  MenuItem,
  type MenuProps,
  Tooltip,
  useConfirmModal,
} from '@affine/component';
import { WorkspaceDialogService } from '@affine/core/modules/dialogs';
import { DocsService } from '@affine/core/modules/doc';
import { CompatibleFavoriteItemsAdapter } from '@affine/core/modules/favorite';
import { WorkbenchService } from '@affine/core/modules/workbench';
import { useI18n } from '@affine/i18n';
import track from '@affine/track';
import {
  DeleteIcon,
  DuplicateIcon,
  InformationIcon,
  MoreVerticalIcon,
  OpenInNewIcon,
  ResizeTidyUpIcon,
  SplitViewIcon,
} from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useContext } from 'react';

import { useGuard } from '../../guard';
import { useBlockSuiteMetaHelper } from '../../hooks/affine/use-block-suite-meta-helper';
import { IsFavoriteIcon } from '../../pure/icons';
import { DocExplorerContext } from '../context';

interface DocOperationProps {
  docId: string;
  hasCover?: boolean;
  onAdjustCover?: () => void;
}

const AdjustCover = ({ hasCover, onAdjustCover }: DocOperationProps) => {
  if (!hasCover || !onAdjustCover) return null;

  return (
    <MenuItem prefixIcon={<ResizeTidyUpIcon />} onClick={onAdjustCover}>
      Adjust cover
    </MenuItem>
  );
};

/**
 * Favorite Operation
 */
const ToggleFavorite = ({ docId }: DocOperationProps) => {
  const t = useI18n();
  const favAdapter = useService(CompatibleFavoriteItemsAdapter);
  const favourite = useLiveData(favAdapter.isFavorite$(docId, 'doc'));

  const toggleFavorite = useCallback(() => {
    favAdapter.toggle(docId, 'doc');
    track.allDocs.list.docMenu.toggleFavorite();
  }, [docId, favAdapter]);

  return (
    <MenuItem
      prefixIcon={<IsFavoriteIcon favorite={favourite} />}
      onClick={toggleFavorite}
      data-testid="doc-list-operation-favorite"
    >
      {favourite
        ? t['com.affine.favoritePageOperation.remove']()
        : t['com.affine.favoritePageOperation.add']()}
    </MenuItem>
  );
};

/**
 * Doc Info Operation
 */
const DocInfo = ({ docId }: DocOperationProps) => {
  const t = useI18n();
  const workspaceDialogService = useService(WorkspaceDialogService);

  const onOpenInfoModal = useCallback(() => {
    if (docId) {
      track.allDocs.list.docMenu.openDocInfo();
      workspaceDialogService.open('doc-info', { docId });
    }
  }, [docId, workspaceDialogService]);

  return (
    <MenuItem onClick={onOpenInfoModal} prefixIcon={<InformationIcon />}>
      {t['com.affine.page-properties.page-info.view']()}
    </MenuItem>
  );
};

/**
 * Open in New Tab Operation
 */
const NewTab = ({ docId }: DocOperationProps) => {
  const t = useI18n();
  const workbench = useService(WorkbenchService).workbench;
  const onOpenInNewTab = useCallback(() => {
    track.allDocs.list.doc.openDoc();
    track.allDocs.list.docMenu.openInNewTab();
    workbench.openDoc(docId, { at: 'new-tab' });
  }, [docId, workbench]);

  return (
    <MenuItem onClick={onOpenInNewTab} prefixIcon={<OpenInNewIcon />}>
      {t['com.affine.workbench.tab.page-menu-open']()}
    </MenuItem>
  );
};

/**
 * Open in Split View Operation
 */
const SplitView = ({ docId }: DocOperationProps) => {
  const t = useI18n();
  const workbench = useService(WorkbenchService).workbench;

  const onOpenInSplitView = useCallback(() => {
    track.allDocs.list.doc.openDoc();
    track.allDocs.list.docMenu.openInSplitView();
    workbench.openDoc(docId, { at: 'tail' });
  }, [docId, workbench]);

  return (
    <MenuItem onClick={onOpenInSplitView} prefixIcon={<SplitViewIcon />}>
      {t['com.affine.workbench.split-view.page-menu-open']()}
    </MenuItem>
  );
};

/**
 * Duplicate Operation
 */
const Duplicate = ({ docId }: DocOperationProps) => {
  const { duplicate } = useBlockSuiteMetaHelper();
  const t = useI18n();

  const onDuplicate = useCallback(() => {
    duplicate(docId, false);
    track.allDocs.list.docMenu.createDoc({
      control: 'duplicate',
    });
  }, [docId, duplicate]);

  return (
    <MenuItem prefixIcon={<DuplicateIcon />} onSelect={onDuplicate}>
      {t['com.affine.header.option.duplicate']()}
    </MenuItem>
  );
};

/**
 * Move to Trash Operation
 */
const MoveToTrash = ({ docId }: DocOperationProps) => {
  const t = useI18n();
  const docsService = useService(DocsService);
  const { openConfirmModal } = useConfirmModal();
  const doc = useLiveData(docsService.list.doc$(docId));
  // useGuard, not guardService.can$: can$ only reads permissions something else
  // already loaded and never asks the server, so on a doc nobody had opened this
  // session it stayed undefined and the item was greyed even for a doc Manager
  // (HALO grants admins Manager on every doc). useGuard revalidates this doc's
  // Doc_Trash when the menu opens, as the doc page's own menu does.
  const canTrash = useGuard('Doc_Trash', docId);

  const onMoveToTrash = useCallback(() => {
    if (!doc) {
      return;
    }

    track.allDocs.list.docMenu.deleteDoc();
    openConfirmModal({
      title: t['com.affine.moveToTrash.confirmModal.title'](),
      description: t['com.affine.moveToTrash.confirmModal.description']({
        title: doc.title$.value || t['Untitled'](),
      }),
      cancelText: t['com.affine.confirmModal.button.cancel'](),
      confirmText: t.Delete(),
      confirmButtonOptions: {
        variant: 'error',
      },
      onConfirm: async () => {
        await doc.moveToTrash();
      },
    });
  }, [doc, openConfirmModal, t]);

  const item = (
    <MenuItem
      prefixIcon={<DeleteIcon />}
      data-testid="doc-list-operation-trash"
      onClick={onMoveToTrash}
      disabled={!canTrash}
    >
      {t['com.affine.moveToTrash.title']()}
    </MenuItem>
  );

  // The server decides Doc_Trash: it needs the Manager role on this doc, which
  // its owner has, a workspace owner or admin inherits, and HALO grants people
  // with roles.manage. The reason only shows once the server has said no
  // (false); while the answer loads (undefined) the item is just disabled.
  if (canTrash !== false) return item;
  return (
    <Tooltip content={HALO_TRASH_DENIED_REASON} side="left">
      <div data-testid="doc-list-operation-trash-denied">{item}</div>
    </Tooltip>
  );
};

export const HALO_TRASH_DENIED_REASON =
  "Only this doc's owner or a Docs workspace admin can move it to trash. Ask them to remove it.";

export const MoreMenuContent = (props: DocOperationProps) => {
  return (
    <>
      <AdjustCover {...props} />
      <ToggleFavorite {...props} />
      <DocInfo {...props} />
      <NewTab {...props} />
      {BUILD_CONFIG.isElectron ? <SplitView {...props} /> : null}
      <Duplicate {...props} />
      <MoveToTrash {...props} />
    </>
  );
};

export const MoreMenu = ({
  docId,
  hasCover,
  onAdjustCover,
  children,
  contentOptions,
  ...menuProps
}: Omit<MenuProps, 'items'> & DocOperationProps) => {
  return (
    <Menu
      items={
        <MoreMenuContent
          docId={docId}
          hasCover={hasCover}
          onAdjustCover={onAdjustCover}
        />
      }
      contentOptions={{
        ...contentOptions,
        onClick: e => {
          // prevent external click events from being triggered
          e.stopPropagation();
          contentOptions?.onClick?.(e);
        },
      }}
      {...menuProps}
    >
      {children}
    </Menu>
  );
};

export const MoreMenuButton = ({
  docId,
  iconProps,
  ...menuProps
}: Omit<MenuProps, 'items' | 'children'> & {
  docId: string;
  iconProps?: IconButtonProps;
  hasCover?: boolean;
  onAdjustCover?: () => void;
}) => {
  const contextValue = useContext(DocExplorerContext);
  const showMoreOperation = useLiveData(contextValue.showMoreOperation$);

  if (!showMoreOperation) {
    return null;
  }

  return (
    <MoreMenu docId={docId} {...menuProps}>
      <IconButton
        data-testid="doc-list-operation-button"
        icon={<MoreVerticalIcon />}
        {...iconProps}
      />
    </MoreMenu>
  );
};
