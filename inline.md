# Resume Builder Redesign (WYSIWYG Inline Editor)

## Goal

Completely redesign the Resume Builder architecture.

The editor must become a true WYSIWYG (What You See Is What You Get) editor.

The resume visible on the screen should be IDENTICAL to the exported PDF and DOCX.

There should never be two different versions:
- Screen Version
- Export Version

Instead there should only be ONE Resume Canvas.

The export system should simply export that canvas.

---

# Current Problem

Right now the editor mixes two different things:

1. Resume Content
2. Editor Controls

Because of this:

- edit buttons appear inside the resume
- helper controls affect spacing
- exported PDF looks different
- export HTML differs from preview HTML
- difficult to maintain templates

This architecture must be removed.

---

# New Architecture

Separate the application into two completely independent layers.

Layer 1
========
Resume Canvas

This is the actual resume.

It should contain ONLY printable content.

Allowed:

Text

Headings

Images

Icons

Lists

Tables

Columns

Background

Borders

Spacing

Everything inside this layer MUST appear in PDF.

Nothing inside this layer should know that an editor exists.

Think of this as a printable A4 page.

---

Layer 2
========

Editor Overlay

This layer exists only while editing.

Examples:

Hover borders

Selection outline

Drag handles

Delete buttons

Add section buttons

Move Up

Move Down

Resize handles

Drop indicators

Context menus

Floating toolbars

Empty state placeholders

Grid guides

Alignment helpers

Column helpers

Spacing indicators

None of these should ever become part of the document.

These are purely editing tools.

When exporting:

Hide entire overlay layer.

Export only Resume Canvas.

---

# Canvas Rules

Resume Canvas should behave like Canva / Figma / Notion Print Mode.

Every element is editable inline.

Example:

Click Name

cursor appears

edit directly

Click Experience

edit directly

Click Skills

edit directly

No popup modal.

No side editor.

No separate form.

Everything edits directly inside the resume.

---

# WYSIWYG Rules

The canvas is the single source of truth.

If I change

font

margin

spacing

line height

colors

alignment

section order

columns

everything updates instantly.

PDF must look pixel-perfect identical.

DOCX should preserve layout as closely as technically possible.

---

# Export Rules

PDF Export

Before export:

Hide editor overlay

Hide helper UI

Hide drag handles

Hide buttons

Hide hover borders

Hide resize controls

Hide placeholders

Hide insertion indicators

Hide context menus

Render only Resume Canvas.

Export exactly what is visible.

No layout recalculation.

No alternative rendering.

No special PDF version.

---

# DOCX Export

Generate DOCX from the same Resume Canvas structure.

Use identical typography, spacing, headings, bullets, colors, margins, and page breaks as much as the DOCX format allows.

Do not maintain a separate DOCX layout.

---

# Editing Experience

Every editable element should support:

Single click = select

Double click = edit

Hover = show controls

Blur = autosave

Keyboard shortcuts

Undo

Redo

Paste formatting intelligently

Delete section

Duplicate section

Drag reorder

Everything should feel like Notion + Canva.

---

# Component Structure

ResumeEditor

├── ResumeCanvas
│   ├── Header
│   ├── Summary
│   ├── Experience
│   ├── Education
│   ├── Skills
│   ├── Projects
│   ├── Certifications
│   └── etc
│
├── EditorOverlay
│   ├── Selection
│   ├── HoverToolbar
│   ├── DragHandles
│   ├── DropZones
│   ├── ResizeHandles
│   ├── FloatingMenus
│   └── ContextActions
│
└── DesignPanel

Canvas must never import Overlay.

Overlay may reference Canvas.

Never the opposite.

---

# CSS Rules

Create utility classes such as:

.print-only

.editor-only

.export-hidden

.canvas-layer

.overlay-layer

Example:

.editor-only {
    display:block;
}

@media print {
    .editor-only {
        display:none !important;
    }
}

Canvas elements must never depend on editor styles.

---

# Rendering Rules

The same React component tree should be used for:

Editor

Preview

PDF Export

Print

Only editor overlays should be toggled on/off.

No duplicate rendering pipeline.

---

# Future Features

The architecture must support:

AI rewriting

Drag and drop sections

Multiple page resumes

Templates

Live collaboration

Version history

Comments

Review mode

Track changes

Without changing the export system.

---

# Success Criteria

When I compare:

Screen

PDF

Printed paper

They should be visually identical.

The only difference between editing mode and exported document should be that editor overlays disappear.

Everything else should remain exactly the same.