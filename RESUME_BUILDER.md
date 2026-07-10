# Resume Builder — Feature Documentation

## What is it called?

The feature is called **Resume Builder**, displayed in the UI under the label:

> **"Resume Builder"** — accessible from the left sidebar under the `Builder` navigation item.

---

## Feature Overview

Resume Builder is a **pixel-accurate, AI-powered resume authoring tool** built directly into the RecoCareer.ai dashboard. It allows users to design, edit, and export professional resumes without ever leaving the app.

The builder uses a **dual-phase workflow**:
1. **Template Selector** — Pick a visual design.
2. **Inline Editor** — Edit content directly on the resume canvas, exactly as it will appear in the PDF.

---

## Full Feature List

### Template System
- **5 built-in templates**, each with a live thumbnail preview rendered via an `<iframe>` at 25% scale:

| Template ID | Name | Style |
|---|---|---|
| `profile-classic` | Profile Classic | Traditional serif layout + profile photo |
| `profile-modern` | Profile Modern | Gradient header + sidebar + profile photo |
| `classic` | Classic | Georgia serif, clean and timeless |
| `modern` | Modern | Blue sidebar with card-based sections |
| `minimal` | Minimal | Ultra-clean whitespace, typography-first |

- Templates with **Inline Editing support** are marked with a green `Inline editing` badge.
- The selected template is **persisted in `localStorage`** and as a user preference in the backend.
- Templates can be **switched on-the-fly** from the sticky top toolbar without losing content.

---

### Inline Canvas Editor
- The resume is rendered as a **live A4-sized canvas** (794px x 1123px at 96 dpi) directly in the browser.
- **Click-to-edit any field** — names, titles, summaries, dates, descriptions, bullets, and skill chips are all `contentEditable`.
- **Section-level focus activation** — clicking a section (e.g. Experience) activates it with a dashed indigo outline, unlocking contextual controls for that section only.
- **Block-level controls** — clicking any individual block (e.g. a single job entry) reveals a dark floating toolbar to:
  - Move block **up** (up arrow)
  - Move block **down** (down arrow)
  - **Delete** the block (x)
- **Bullet points** — Click a bullet to edit; press `Enter` to add a new bullet; press `Backspace` on an empty bullet to delete it.
- **Skill chips** — Tags with an x to remove and a `+ Add` button to add new ones inline.
- **Add new entries** — Each section (Experience, Education, Projects) has an `+ Add` button visible when the section is active.

---

### Multi-Page Support (Page-Break Engine)
- The canvas automatically **detects content overflow** beyond one A4 page.
- Uses a `ResizeObserver` and a `requestAnimationFrame` loop to measure every `[data-block]` element and compute whether it would cross a page boundary.
- Injects **`margin-top` CSS rules** to push overflowing blocks to the next page with clean visual separation.
- **Visual page gap** of 40px is shown between pages in the browser so the user can see distinct page boundaries.
- On PDF export, the 40px gap is **automatically normalised out** so the downloaded PDF is gap-free and pixel-perfect.
- Page count is tracked and the correct number of A4 background cards are rendered.

---

### Design Panel
Accessed via the **"Design" button** in the top toolbar. Opens a floating dropdown with:
- **Theme Color Picker** — Primary color (all templates) and Secondary color (Modern templates only). Color is applied live with a reset button.
- **Profile Photo Upload** — Upload or remove a profile picture shown inside `profile-classic` and `profile-modern` templates. Photo is stored as a base64 data URL inside the resume data.

---

### Autosave
- All edits are **debounced by 1500ms** and automatically persisted to the backend (`PUT /resume/update`).
- Save status is shown in the toolbar:
  - `Saving...` (amber spinner)
  - `Saved` (green, disappears after 2s)
  - `Save failed` (red)

---

### Multi-Resume History
- Users can store and manage **multiple resumes**.
- A collapsible **"Saved Resumes"** panel on the template selector screen lists all saved resumes with:
  - Resume title and file name
  - An `Active` badge on the current resume
  - **Switch** button to activate a different resume
  - **Delete** button (with a confirm modal) for non-active resumes

---

### Export
From the sticky toolbar, export the resume in three formats:

| Format | Description |
|---|---|
| **PDF** | Puppeteer-rendered, pixel-perfect, page-break-aware |
| **DOCX** | Word document built with `docx.js` |
| **JPG** | High-resolution screenshot (2x scale) |

- Export uses the current template and live resume data.
- The **page-break margin CSS** is normalised before PDF export to remove browser preview gaps.
- Puppeteer viewport is set to **794px wide** (exact A4 at 96 dpi) before rendering.

---

### Cover Letter Drawer
Accessed via the **"Cover Letter" button** in the toolbar. Opens a 340px side drawer on the left of the canvas with:
- **Job selector** — Dropdown (powered by `react-select`) listing all tracked job applications by role and recruiter email.
- **AI Cover Letter Generation** — Generates a tailored cover letter using Gemini AI against the selected job description and the user's resume data.
- **Inline text editor** — `<textarea>` with monospace font to review and manually edit the generated letter.
- **Save** — Saves the cover letter text back to the job record.
- **Export PDF / DOCX** — Download the cover letter in the chosen format via the backend export endpoint.

---

### AI Tailoring (Backend)
- The backend route `POST /resume/tailor` uses Gemini AI to **optimise the resume data** for a specific job description, improving ATS keyword alignment.
- The tailored resume can be re-exported as PDF/DOCX for that specific application.

---

## UI Architecture

```
ResumeBuilder (main component)
|
+-- Step: "select" — Template Selector Screen
|   +-- Hero CTA card (gradient header, candidate name, Continue editing button)
|   +-- Saved Resumes collapsible list (switch / delete)
|   +-- Template Grid (2-4 columns, iframe previews at 25% scale)
|
+-- Step: "edit" — Inline Editor Screen
    +-- Sticky Top Toolbar
    |   +-- Back to Templates arrow
    |   +-- Template Pills (switch without leaving editor)
    |   +-- Save status indicator
    |   +-- Design button (opens color + photo popover)
    |   +-- Cover Letter button (opens side drawer)
    |   +-- Export buttons (PDF, DOCX, JPG)
    |
    +-- Cover Letter Drawer (340px, conditionally open)
    |   +-- Job selector
    |   +-- Generate / edit / save cover letter
    |   +-- Export cover letter (PDF / DOCX)
    |
    +-- CV Canvas (flex: 1, slate-50 background)
        +-- InlineCVEditor
            +-- A4 Background Cards (one white card per page)
            +-- CSS Mask Layer (hides content in the PAGE_GAP zones)
            +-- Template Component (ClassicTemplate / ModernTemplate / MinimalTemplate)
            |   +-- SectionWrapper (click to activate a whole section)
            |   +-- BlockWrapper (data-block — tracked by page-break engine)
            |       +-- EditableText (single-line contentEditable)
            |       +-- EditableMultiline (multi-line contentEditable)
            |       +-- EditableBullets (list with add/remove per bullet)
            |       +-- EditableSkillChips (tag chips with add/remove)
            +-- Page-break engine (ResizeObserver -> inject margin-top CSS)
```

---

## Tech Stack

| Concern | Technology |
|---|---|
| Frontend framework | React 18 + Redux Toolkit |
| State persistence | `localStorage` + backend REST API |
| Inline editing | Native `contentEditable` + `ResizeObserver` |
| PDF generation | Puppeteer (headless Chromium) on the backend |
| DOCX generation | `docx.js` |
| Cover letter AI | Google Gemini API |
| Styling | Tailwind CSS + inline styles for PDF fidelity |
| Template rendering | React components (browser) + custom HTML builders (server) |

---

## Key Files

| File | Role |
|---|---|
| `Front-end/src/components/ResumeBuilder.jsx` | Main component — orchestrates all panels, export, autosave, template selection |
| `Front-end/src/components/InlineCVEditor.jsx` | Canvas engine — page-break logic, editable primitives, block/section wrappers |
| `Front-end/src/resumeTemplates/ClassicTemplate.jsx` | React template (Classic / Profile Classic) |
| `Front-end/src/resumeTemplates/ModernTemplate.jsx` | React template (Modern / Profile Modern) |
| `Front-end/src/resumeTemplates/MinimalTemplate.jsx` | React template (Minimal) |
| `Front-end/src/resumeTemplates/templateSchema.js` | Shared A4 constants, design tokens, and theme helpers |
| `Back-end/utils/exportService.js` | Backend — Puppeteer PDF, JPG screenshot, DOCX builder, HTML template builders |
| `Back-end/controllers/resumeController.js` | Backend — export endpoints, preview endpoint, tailor endpoint |
