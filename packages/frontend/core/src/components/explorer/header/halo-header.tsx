import { isHaloHosted } from '@affine/core/utils/halo-docs-host';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type HaloExplorerTab = 'tasks' | 'docs' | 'collections' | 'tags';
type Slot = {
  name: 'header' | 'tasks';
  element: HTMLElement;
  active?: HaloExplorerTab;
  actions?: HTMLElement;
};
const globals = globalThis as typeof globalThis & {
  __HALO_DOCS_PAGE_SLOTS__?: Partial<Record<Slot['name'], Slot>>;
};

/** HALO renders its real page kit into these elements; AFFiNE keeps ownership of native actions. */
export function HaloPageSlot({
  name,
  active,
  actions,
}: {
  name: Slot['name'];
  active?: HaloExplorerTab;
  actions?: HTMLElement;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const slot = { name, element, active, actions };
    const slots = (globals.__HALO_DOCS_PAGE_SLOTS__ ??= {});
    slots[name] = slot;
    window.dispatchEvent(
      new CustomEvent('halo-docs:page-slot', { detail: slot })
    );
    return () => {
      if (slots[name]?.element !== element) return;
      delete slots[name];
      window.dispatchEvent(
        new CustomEvent('halo-docs:page-slot', {
          detail: { name, element: null },
        })
      );
    };
  }, [name, active, actions]);
  return (
    <div
      ref={ref}
      data-halo-docs-slot={name}
      style={{ width: '100%', minWidth: 0 }}
    />
  );
}

export function HaloExplorerHeader({
  active,
  children,
}: {
  active: HaloExplorerTab;
  children?: ReactNode;
}) {
  const [actions] = useState(() => document.createElement('div'));
  return (
    <>
      <HaloPageSlot name="header" active={active} actions={actions} />
      {createPortal(
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {children}
        </div>,
        actions
      )}
    </>
  );
}
export { isHaloHosted };
