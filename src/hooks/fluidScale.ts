import type Role from '../types/Role';
import { isMobileUserAgent } from '../utils/mobileUserAgent';

/**
 * Whether the game shell should use fluid (viewport-based) scaling.
 *
 * Scaling itself is pure CSS: `html.fluid-scale` sets a root font-size derived
 * from the viewport, and every size in index.scss is expressed in rem, so
 * letters, boxes and spacing grow/shrink with the screen. No CSS `zoom`.
 *
 * Players (and people opening a join link) keep the regular 16px base.
 */
export function shouldUseFluidScale(
  role: Role | null,
  hasRoomIdInUrl: boolean,
): boolean {
  if (isMobileUserAgent()) return false;
  if (role === 'player') return false;
  if (role === null && hasRoomIdInUrl) return false;
  return true;
}
