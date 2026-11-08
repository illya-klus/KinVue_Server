export const RECONCILE_OVERLAP_MS = 24 * 60 * 60 * 1000;

export function reconcileWindow(
  jobStartedAt: Date,
  lastSuccessfulSync?: Date,
): { from: Date; to: Date } {
  const to = jobStartedAt;
  const from = lastSuccessfulSync
    ? new Date(lastSuccessfulSync.getTime() - RECONCILE_OVERLAP_MS)
    : new Date(0);

  return { from, to };
}
