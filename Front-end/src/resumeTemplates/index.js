// Dynamic-only imports to avoid the Vite "static + dynamic" chunk warning.
// InlineCVEditor uses resolveTemplateComponent() which returns a lazy loader.

export const TEMPLATE_MAP = {
  'classic': () => import('./ClassicTemplate.jsx').then(m => m.default),
  'profile-classic': () => import('./ClassicTemplate.jsx').then(m => m.default),
  'modern': () => import('./ModernTemplate.jsx').then(m => m.default),
  'profile-modern': () => import('./ModernTemplate.jsx').then(m => m.default),
  'minimal': () => import('./MinimalTemplate.jsx').then(m => m.default),
};

/** Resolve template ID to the right React component (lazy loader fn) */
export const resolveTemplateComponent = (templateId) => {
  return TEMPLATE_MAP[templateId] || TEMPLATE_MAP['classic'];
};
