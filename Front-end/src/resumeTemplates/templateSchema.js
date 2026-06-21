// ─── Shared Template Schema ───────────────────────────────────────────────────
// Style tokens and data helpers shared between the React inline editor and
// the backend HTML export service. Keeps both in sync automatically.

export const A4_WIDTH_PX = 794;   // at 96 dpi, matches Puppeteer's A4
export const A4_HEIGHT_PX = 1123; // at 96 dpi

// ─── Template Style Tokens ────────────────────────────────────────────────────

export const TEMPLATE_TOKENS = {
  classic: {
    fontFamily: "'Georgia', serif",
    fontSize: '10pt',
    bodyPadding: '40px 50px',
    maxWidth: '794px',
    colors: {
      primary: { label: 'Accent Color', default: '#1a1a1a' },
    },
    styles: (t = {}) => ({
      name: { fontSize: '26pt', fontWeight: 'bold', color: t.primary || '#1a1a1a', letterSpacing: '-0.5px' },
      headline: { fontSize: '11pt', color: '#4b5563', marginTop: '4px' },
      contact: { fontSize: '8.5pt', color: '#4b5563', marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '12px' },
      divider: { border: 'none', borderTop: `2px solid ${t.primary || '#1a1a1a'}`, margin: '16px 0 12px' },
      sectionTitle: { fontSize: '9pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1.5px', color: t.primary || '#1a1a1a', marginBottom: '10px' },
      section: { marginBottom: '18px' },
      summary: { fontSize: '9.5pt', color: '#374151', lineHeight: '1.6' },
      expItem: { marginBottom: '12px' },
      jobTitle: { fontSize: '10pt', fontWeight: 'bold', color: t.primary || '#1a1a1a' },
      company: { fontSize: '9pt', color: '#4b5563', fontStyle: 'italic' },
      dates: { fontSize: '8.5pt', color: '#6b7280', whiteSpace: 'nowrap', marginLeft: '8px' },
      desc: { fontSize: '9pt', color: '#374151', marginTop: '4px', lineHeight: '1.5' },
      bullet: { fontSize: '9pt', color: '#374151', marginBottom: '2px', lineHeight: '1.4' },
      skillPill: { background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '3px', padding: '2px 8px', fontSize: '8.5pt', color: '#374151', display: 'inline-block' },
    }),
  },

  modern: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: '9.5pt',
    colors: {
      primary: { label: 'Primary Color', default: '#1e40af' },
      secondary: { label: 'Secondary Color', default: '#3b82f6' },
    },
    styles: (t = {}) => ({
      header: { background: `linear-gradient(135deg, ${t.primary || '#1e40af'} 0%, ${t.secondary || '#3b82f6'} 100%)`, color: 'white', padding: '30px 40px' },
      name: { fontSize: '24pt', fontWeight: '800', letterSpacing: '-0.5px' },
      headline: { fontSize: '11pt', opacity: '0.85', marginTop: '4px', fontWeight: '300' },
      sidebar: { width: '200px', minWidth: '200px', background: '#f1f5f9', padding: '20px 16px', borderRight: '1px solid #e2e8f0' },
      sidebarTitle: { fontSize: '7.5pt', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', color: t.primary || '#1e40af', marginBottom: '6px' },
      sidebarSection: { marginBottom: '16px' },
      contactRow: { fontSize: '8pt', color: '#475569', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px', wordBreak: 'break-all' },
      skillTag: { background: 'white', border: '1px solid #bfdbfe', borderRadius: '3px', padding: '2px 7px', fontSize: '7.5pt', color: t.primary || '#1e40af', marginBottom: '3px', display: 'inline-block', marginRight: '2px' },
      main: { flex: '1', padding: '20px 28px' },
      section: { marginBottom: '18px' },
      sectionTitle: { fontSize: '9pt', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.2px', color: t.primary || '#1e40af', borderBottom: '2px solid #bfdbfe', paddingBottom: '4px', marginBottom: '10px' },
      summary: { fontSize: '9pt', color: '#374151', lineHeight: '1.6' },
      expItem: { marginBottom: '12px' },
      role: { fontWeight: '700', fontSize: '9.5pt', color: '#1e293b' },
      company: { fontSize: '8.5pt', color: '#64748b' },
      dateBadge: { background: '#dbeafe', color: t.primary || '#1e40af', padding: '1px 7px', borderRadius: '10px', fontSize: '7.5pt', fontWeight: '600', whiteSpace: 'nowrap', marginLeft: '8px' },
      desc: { fontSize: '8.5pt', color: '#475569', marginTop: '4px', lineHeight: '1.5' },
      bullet: { fontSize: '8.5pt', color: '#475569', marginBottom: '2px' },
    }),
  },

  minimal: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: '9.5pt',
    bodyPadding: '48px 56px',
    maxWidth: '794px',
    colors: {
      primary: { label: 'Accent Color', default: '#111111' },
    },
    styles: (t = {}) => ({
      name: { fontSize: '28pt', fontWeight: '300', letterSpacing: '-1px', color: t.primary || '#111111' },
      headline: { fontSize: '10pt', color: '#6b7280', marginTop: '4px', letterSpacing: '0.5px' },
      contacts: { display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb', fontSize: '8pt', color: '#6b7280' },
      section: { marginTop: '22px' },
      sectionTitle: { fontSize: '7.5pt', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: '#9ca3af', marginBottom: '10px' },
      thinLine: { border: 'none', borderTop: '1px solid #f3f4f6', marginBottom: '10px' },
      summary: { fontSize: '9pt', color: '#4b5563', lineHeight: '1.65' },
      expItem: { marginBottom: '14px' },
      role: { fontWeight: '600', color: t.primary || '#111111' },
      company: { fontSize: '8.5pt', color: '#6b7280', marginTop: '1px' },
      dates: { fontSize: '8.5pt', color: '#9ca3af' },
      desc: { fontSize: '8.5pt', color: '#4b5563', marginTop: '4px', lineHeight: '1.5' },
      bullet: { fontSize: '8.5pt', color: '#4b5563', marginBottom: '2px' },
      skillChip: { border: '1px solid #e5e7eb', borderRadius: '2px', padding: '2px 9px', fontSize: '7.5pt', color: '#4b5563', display: 'inline-block' },
      eduDegree: { fontSize: '9.5pt', fontWeight: '600', color: t.primary || '#111111' },
      eduInst: { fontSize: '8.5pt', color: '#6b7280' },
    }),
  },
};

// ─── Data helpers ─────────────────────────────────────────────────────────────

export const emptyExperience = () => ({
  role: '', company: '', startDate: '', endDate: '', current: false,
  location: '', description: '', achievements: [],
});

export const emptyEducation = () => ({
  institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '',
});

export const emptyProject = () => ({
  name: '', description: '', techStack: [], url: '', github: '',
});

/** Derive effective theme with fallbacks for a given template */
export const resolveTheme = (templateId, rawTheme = {}) => {
  const tokens = TEMPLATE_TOKENS[templateId] || TEMPLATE_TOKENS.classic;
  const result = {};
  Object.keys(tokens.colors || {}).forEach(key => {
    result[key] = rawTheme[key] || tokens.colors[key].default;
  });
  return result;
};
