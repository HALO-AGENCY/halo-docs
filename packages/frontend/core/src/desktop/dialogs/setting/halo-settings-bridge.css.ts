import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

/** Fills the section area HALO's Settings hands over; AFFiNE's own scroll area scrolls inside it. */
export const root = style({
  display: 'flex',
  width: '100%',
  height: '100%',
  minHeight: 0,
  overflow: 'hidden',
  color: cssVarV2('text/primary'),
  background: cssVarV2('layer/background/primary'),
});
