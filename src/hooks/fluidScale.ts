import { isMobileUserAgent } from '../utils/mobileUserAgent';

/**
 * Whether the game shell should use fluid (viewport-based) scaling.
 *
 * Scaling itself is pure CSS: `html.fluid-scale` sets a root font-size derived
 * from the viewport, and every size in index.scss is expressed in rem, so
 * letters, boxes and spacing grow/shrink with the screen. No CSS `zoom`.
 *
 * Every desktop uses it — host, players and people opening a join link — so
 * two players on two computers see the game the same way. Phones keep the
 * regular 16px base (they get the mobile layout instead).
 */
export function shouldUseFluidScale(): boolean {
  return !isMobileUserAgent();
}
