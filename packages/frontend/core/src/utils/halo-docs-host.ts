/**
 * HALO hosting Docs: what the embedded AFFiNE and HALO tell each other after the mount call.
 *
 * Inside HALO (https://app.haloangels.net/all-docs) Docs is one tool among HALO's. HALO owns the side nav, Settings,
 * the notification bell and the workspace (one per client), so Docs hands those over instead of drawing its own
 * (Shaan, 28 Sep 2026: "the settings in the Docs needs to be moved over ... to our settings", "get rid of notifications
 * from the side nav for the docs because it needs to wire up to our notifications", no "create your workspace").
 *
 * HALO's side of this contract is src/lib/halo-docs-host-binding.ts in HALO-AGENCY/halocrm; the event names below
 * must match it. All events are CustomEvents on window.
 */
import type { SettingTab } from '@affine/core/modules/dialogs/constant';

export const HALO_DOCS_EVENTS = {
  /** Docs → HALO: open HALO's Settings on one of Docs' sections. detail: { tab, scrollAnchor? } */
  openSettings: 'halo-docs:open-settings',
  /** Docs → HALO: Docs' Settings sections, as AFFiNE's settings sidebar lists them. detail: HaloDocsSettingsSections */
  settingsSections: 'halo-docs:settings-sections',
  /** HALO → Docs: draw this section into this element, or nothing (null). detail: HaloDocsSettingsTarget | null */
  settingsTarget: 'halo-docs:settings-target',
  /** Docs → HALO: a section moved to another one by itself (a link inside it). detail: { tab } */
  settingsTab: 'halo-docs:settings-tab',
  /** Docs → HALO: a section is finished with Settings (it left or deleted the workspace). detail: none */
  closeSettings: 'halo-docs:close-settings',
  /** HALO → Docs: go to a Docs path in the workspace ("/all", "/<docId>"). detail: { path } */
  navigate: 'halo-docs:navigate',
} as const;

export interface HaloDocsSettingsSection {
  key: SettingTab;
  title: string;
  group: 'general' | 'workspace';
  beta?: boolean;
}

export interface HaloDocsSettingsSections {
  groups: { key: 'general' | 'workspace'; title: string }[];
  sections: HaloDocsSettingsSection[];
}

export interface HaloDocsSettingsTarget {
  element: HTMLElement;
  tab: SettingTab;
  scrollAnchor?: string;
}

type HaloDocsHostGlobals = typeof globalThis & {
  __HALO_DOCS_HOST__?: unknown;
  __HALO_DOCS_NAV__?: HTMLElement;
  __HALO_DOCS_SETTINGS_SECTIONS__?: HaloDocsSettingsSections;
  __HALO_DOCS_SETTINGS_TARGET__?: HaloDocsSettingsTarget | null;
};

const globals = globalThis as HaloDocsHostGlobals;

/** True while HALO hosts this Docs (it mounted it with a host identity). */
export const isHaloHosted = () => !!globals.__HALO_DOCS_HOST__;

/** HALO's side-nav element Docs draws its sidebar into, when HALO handed one over. */
export const haloDocsNav = () => globals.__HALO_DOCS_NAV__;

export function openHaloSettings(tab: SettingTab, scrollAnchor?: string) {
  window.dispatchEvent(
    new CustomEvent(HALO_DOCS_EVENTS.openSettings, {
      detail: { tab, scrollAnchor },
    })
  );
}

export function publishHaloSettingsSections(value: HaloDocsSettingsSections) {
  globals.__HALO_DOCS_SETTINGS_SECTIONS__ = value;
  window.dispatchEvent(
    new CustomEvent(HALO_DOCS_EVENTS.settingsSections, { detail: value })
  );
}

export function reportHaloSettingsTab(tab: SettingTab) {
  window.dispatchEvent(
    new CustomEvent(HALO_DOCS_EVENTS.settingsTab, { detail: { tab } })
  );
}

export function closeHaloSettings() {
  window.dispatchEvent(new CustomEvent(HALO_DOCS_EVENTS.closeSettings));
}

/** HALO may have asked for a section before Docs finished starting; it leaves the request here too. */
export const currentHaloSettingsTarget = () =>
  globals.__HALO_DOCS_SETTINGS_TARGET__ ?? null;
