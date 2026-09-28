/**
 * Docs' Settings, drawn inside HALO's Settings.
 *
 * Shaan, 28 Sep 2026: "the settings in the Docs needs to be moved over ... like exact component how it works and
 * everything ... move it over to our settings". So this is AFFiNE's own settings panel (SettingModalInner: its
 * sections, their components and how they behave) without AFFiNE's modal and sidebar. HALO's Settings lists the
 * sections this publishes in its own rail and hands over the element to draw the chosen one into
 * (utils/halo-docs-host.ts). Rendered by WorkspaceDialogs, so every section has the workspace it needs.
 */
import {
  closeHaloSettings,
  currentHaloSettingsTarget,
  HALO_DOCS_EVENTS,
  type HaloDocsSettingsSections,
  type HaloDocsSettingsTarget,
  publishHaloSettingsSections,
} from '@affine/core/utils/halo-docs-host';
import { useI18n } from '@affine/i18n';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { useGeneralSettingList } from './general-setting';
import * as styles from './halo-settings-bridge.css';
import { SettingModalInner } from './index';
import { useWorkspaceSettingList } from './workspace-setting';

export const HaloSettingsBridge = () => {
  const t = useI18n();
  const generalList = useGeneralSettingList();
  const workspaceList = useWorkspaceSettingList();

  const sections = useMemo<HaloDocsSettingsSections>(
    () => ({
      groups: [
        {
          key: 'general',
          title: t['com.affine.settingSidebar.settings.general'](),
        },
        {
          key: 'workspace',
          title: t['com.affine.settingSidebar.settings.workspace'](),
        },
      ],
      sections: [
        ...generalList.map(item => ({
          key: item.key,
          title: item.title,
          group: 'general' as const,
          beta: item.beta,
        })),
        ...workspaceList.map(item => ({
          key: item.key,
          title: item.title,
          group: 'workspace' as const,
          beta: item.beta,
        })),
      ],
    }),
    [generalList, workspaceList, t]
  );

  useEffect(() => {
    publishHaloSettingsSections(sections);
  }, [sections]);

  const [target, setTarget] = useState<HaloDocsSettingsTarget | null>(
    currentHaloSettingsTarget
  );
  useEffect(() => {
    const onTarget = (event: Event) =>
      setTarget(
        (event as CustomEvent<HaloDocsSettingsTarget | null>).detail ?? null
      );
    window.addEventListener(HALO_DOCS_EVENTS.settingsTarget, onTarget);
    // HALO may have asked before this mounted.
    setTarget(currentHaloSettingsTarget());
    return () =>
      window.removeEventListener(HALO_DOCS_EVENTS.settingsTarget, onTarget);
  }, []);

  if (!target) return null;
  return createPortal(
    <div className={styles.root} data-halo-docs-settings={target.tab}>
      <Suspense fallback={null}>
        <SettingModalInner
          embeddedInHalo
          activeTab={target.tab}
          scrollAnchor={target.scrollAnchor}
          onCloseSetting={closeHaloSettings}
        />
      </Suspense>
    </div>,
    target.element
  );
};
