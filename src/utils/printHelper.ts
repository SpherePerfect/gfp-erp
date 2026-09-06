/**
 * Professional, reliable Print Engine for GFP Advisory Platform
 * Handles print execution in browser and sandboxed iframe environments
 */

export interface PrintOptions {
  documentTitle?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

/**
 * Initiates native document printing with custom title and restored state
 */
export function printElementById(elementId: string, options: PrintOptions = {}): boolean {
  const originalTitle = document.title;
  const docTitle = options.documentTitle || originalTitle || 'GFP Advisory Document';

  try {
    if (options.onBeforePrint) {
      options.onBeforePrint();
    }

    // Temporarily set document title so browser uses it as default PDF/print filename
    document.title = docTitle;

    // Ensure window has focus before print
    window.focus();

    // Call browser native print
    window.print();

    // Restore title
    setTimeout(() => {
      document.title = originalTitle;
      if (options.onAfterPrint) {
        options.onAfterPrint();
      }
    }, 800);

    return true;
  } catch (err) {
    console.error('[PrintHelper] Print command failed:', err);
    document.title = originalTitle;
    return false;
  }
}
