/**
 * Reusable Print Utility for Phase 11
 */

export const triggerReportPrint = (
  actingUserFullName?: string,
  reportTitle?: string
): void => {
  if (typeof window === 'undefined') return;

  // Let browser layout settle then trigger print dialog
  setTimeout(() => {
    window.print();
  }, 150);
};
