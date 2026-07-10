// ─── WYSIWYG Resume Export Capture ────────────────────────────────────────────
// Snapshots the inline editor's EXACT rendered DOM and wraps it in a
// standalone HTML document for the backend's Puppeteer printer. Because the
// PDF renders the same markup, same fonts, and same 794px layout width as the
// editor, the exported pages match the on-screen pages pixel for pixel.

import { A4_WIDTH_PX } from '../resumeTemplates/templateSchema.js';

// The editor lives inside the app, which applies Tailwind's preflight resets.
// The print document must replicate the resets that affect layout, otherwise
// default UA styles (line-height 1.2, list markers, ul padding…) reflow
// every line and shift the page breaks.
const PREFLIGHT_MIRROR = `
  *, ::before, ::after { box-sizing: border-box; margin: 0; padding: 0; border: 0 solid; }
  html { line-height: 1.5; -webkit-text-size-adjust: 100%; tab-size: 4; }
  body { margin: 0; background: #fff; }
  ol, ul { list-style: none; }
  img, svg, video, canvas { display: block; vertical-align: middle; }
  img { max-width: 100%; height: auto; }
  a { color: inherit; text-decoration: inherit; }
  b, strong { font-weight: bolder; }
  hr { height: 0; color: inherit; }
  small { font-size: 80%; }
`;

/**
 * Capture the currently rendered CV canvas as a self-contained HTML document.
 *
 * @param {object} theme - resumeData.theme (for the font pairing)
 * @returns {string|null} full HTML document, or null if the editor is not mounted
 */
export const captureResumeExportHTML = (theme = {}) => {
  const layer = document.querySelector('.cv-mask-layer');
  if (!layer) return null;

  const clone = layer.cloneNode(true);

  // Strip editor chrome. All interactive controls in the editor are <button>
  // elements and resumes contain none, so this is a safe blanket rule.
  clone.querySelectorAll('button').forEach((el) => el.remove());
  clone.querySelectorAll('[contenteditable]').forEach((el) => el.removeAttribute('contenteditable'));

  // Gap-free page-break margins computed by the editor's break engine.
  const pdfStyleEl = document.getElementById('cv-pdf-margins');
  const pdfMargins = pdfStyleEl ? pdfStyleEl.textContent : '';

  const fontHeading = theme.fontHeading || 'Poppins';
  const fontBody = theme.fontBody || 'Inter';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=${fontHeading.replace(/\s+/g, '+')}:wght@300;400;550;700;800&family=${fontBody.replace(/\s+/g, '+')}:wght@300;400;500;700&display=swap');
  ${PREFLIGHT_MIRROR}
  .cv-mask-layer, .cv-mask-layer * {
    --font-heading: '${fontHeading}', sans-serif !important;
    --font-body: '${fontBody}', sans-serif !important;
  }
  /* Empty fields keep their exact on-screen footprint but print invisibly. */
  [data-placeholder="true"] { color: transparent !important; }
  ${pdfMargins}
</style>
</head>
<body>
  <div class="cv-mask-layer" style="width: ${A4_WIDTH_PX}px; margin: 0 auto; background: #fff;">${clone.innerHTML}</div>
</body>
</html>`;
};
