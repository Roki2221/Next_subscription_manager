/**
 * Browser-only download helper.
 *
 * Kept separate from the API layer so invoice generation stays decoupled from
 * DOM side-effects — easier to swap in signed URLs or a PDF library later.
 */
export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(objectUrl);
}
