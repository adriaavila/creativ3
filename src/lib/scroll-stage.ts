/**
 * Normalized progress of a sticky "stage" section, derived from the section's
 * own rect rather than page scroll — so anything added above or below it
 * leaves the timeline untouched.
 *
 * 0 while the section top is at or below the viewport top, 1 once the section
 * has travelled its full height minus one viewport (the point where a sticky
 * child stops being pinned).
 */
export function stageProgress(rectTop: number, rectHeight: number, viewportHeight: number) {
  const travel = Math.max(1, rectHeight - viewportHeight);
  return Math.min(1, Math.max(0, -rectTop / travel));
}
