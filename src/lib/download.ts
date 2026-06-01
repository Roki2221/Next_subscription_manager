/**
 * Browser-only download helper.
 *
 * Kept separate from the mock API layer so invoice generation (Blob creation)
 * stays decoupled from DOM side-effects — easier to swap in a real PDF library
 * or server-generated signed URLs later without touching api.ts call sites.
 */
export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();

  URL.revokeObjectURL(objectUrl);
}
