// ─── Shared Template Schema ───────────────────────────────────────────────────
// Style tokens and data helpers shared between the React inline editor and
// the backend HTML export service. Keeps both in sync automatically.

export const A4_WIDTH_PX = 794;   // at 96 dpi, matches Puppeteer's A4
export const A4_HEIGHT_PX = 1123; // at 96 dpi

// Helper to resolve margins dynamically
export const resolvePadding = (templateId, marginSize = 'normal') => {
  const compactMap = {
    classic: '32px 38px',
    minimal: '36px 44px',
    modern: { header: '20px 24px', sidebar: '14px 10px', main: '14px 20px' }
  };
  const normalMap = {
    classic: '52px 58px',
    minimal: '56px 64px',
    modern: { header: '34px 44px', sidebar: '24px 18px', main: '24px 32px' }
  };
  const wideMap = {
    classic: '68px 74px',
    minimal: '72px 80px',
    modern: { header: '44px 54px', sidebar: '34px 24px', main: '34px 42px' }
  };
  
  const map = marginSize === 'compact' ? compactMap : (marginSize === 'wide' ? wideMap : normalMap);
  return map[templateId] || map.classic;
};

// ─── Template Style Tokens ────────────────────────────────────────────────────

export const TEMPLATE_TOKENS = {
  classic: {
    fontFamily: "var(--font-body, 'Georgia', 'Times New Roman', serif)",
    fontSize: '10.5pt',
    maxWidth: '794px',
    colors: {
      primary: { label: 'Accent Color', default: '#1a1a1a' },
    },
    styles: (t = {}) => ({
      name: { fontSize: '28pt', fontWeight: 'bold', fontFamily: "var(--font-heading, 'Georgia', serif)", color: t.primary || '#1a1a1a', letterSpacing: '-0.5px', lineHeight: '1.1' },
      headline: { fontSize: '11.5pt', fontFamily: "var(--font-body, 'Georgia', serif)", color: '#52525b', marginTop: '5px', fontWeight: '400', letterSpacing: '0.01em' },
      contact: { fontSize: '8.5pt', fontFamily: "var(--font-body, 'Georgia', serif)", color: '#6b7280', marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '14px', lineHeight: '1.5' },
      divider: { border: 'none', borderTop: `1.5px solid ${t.primary || '#1a1a1a'}`, margin: '20px 0 18px', opacity: '0.15' },
      sectionTitle: { fontSize: '8.5pt', fontFamily: "var(--font-heading, 'Georgia', serif)", fontWeight: '750', textTransform: 'uppercase', letterSpacing: '2px', color: t.primary || '#1a1a1a', marginBottom: '14px', opacity: '0.85', display: 'flex', alignItems: 'center', gap: '6px' },
      section: { marginBottom: '26px' },
      summary: { fontSize: '10pt', color: '#374151', lineHeight: '1.8' },
      expItem: { marginBottom: '18px' },
      jobTitle: { fontSize: '10.5pt', fontFamily: "var(--font-heading, 'Georgia', serif)", fontWeight: 'bold', color: t.primary || '#1a1a1a', lineHeight: '1.3' },
      company: { fontSize: '9.5pt', color: '#6b7280', fontStyle: 'italic', marginTop: '1px' },
      dates: { fontSize: '8.5pt', color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: '8px' },
      desc: { fontSize: '9.5pt', color: '#4b5563', marginTop: '6px', lineHeight: '1.75' },
      bullet: { fontSize: '9.5pt', color: '#4b5563', marginBottom: '3px', lineHeight: '1.65' },
      skillPill: { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '3px', padding: '2px 9px', fontSize: '8.5pt', color: '#374151', display: 'inline-block' },
    }),
  },

  modern: {
    fontFamily: "var(--font-body, 'Helvetica Neue', Arial, sans-serif)",
    fontSize: '9.5pt',
    colors: {
      primary: { label: 'Primary Color', default: '#1e40af' },
      secondary: { label: 'Secondary Color', default: '#3b82f6' },
    },
    styles: (t = {}) => ({
      header: { background: `linear-gradient(135deg, ${t.primary || '#1e40af'} 0%, ${t.secondary || '#3b82f6'} 100%)`, color: 'white' },
      name: { fontSize: '25pt', fontWeight: '800', fontFamily: "var(--font-heading, 'Helvetica Neue', Arial, sans-serif)", letterSpacing: '-0.5px', lineHeight: '1.1' },
      headline: { fontSize: '11pt', fontFamily: "var(--font-heading, 'Helvetica Neue', Arial, sans-serif)", opacity: '0.82', marginTop: '5px', fontWeight: '300', letterSpacing: '0.02em' },
      sidebar: { width: '200px', minWidth: '200px', background: '#f8fafc', borderRight: '1px solid #f1f5f9' },
      sidebarTitle: { fontSize: '7.5pt', fontWeight: '800', fontFamily: "var(--font-heading, 'Helvetica Neue', Arial, sans-serif)", textTransform: 'uppercase', letterSpacing: '2px', color: t.primary || '#1e40af', marginBottom: '8px', opacity: '0.85', display: 'flex', alignItems: 'center', gap: '4px' },
      sidebarSection: { marginBottom: '20px' },
      contactRow: { fontSize: '8pt', color: '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', overflowWrap: 'anywhere', wordBreak: 'break-word', lineHeight: '1.4' },
      skillTag: { background: 'white', border: '1px solid #dbeafe', borderRadius: '3px', padding: '2px 8px', fontSize: '7.5pt', color: t.primary || '#1e40af', marginBottom: '3px', display: 'inline-block', marginRight: '3px' },
      main: { flex: '1' },
      section: { marginBottom: '22px' },
      sectionTitle: { fontSize: '8.5pt', fontWeight: '800', fontFamily: "var(--font-heading, 'Helvetica Neue', Arial, sans-serif)", textTransform: 'uppercase', letterSpacing: '2px', color: t.primary || '#1e40af', borderBottom: t.sectionDividers !== false ? `1.5px solid ${t.primary || '#1e40af'}` : 'none', paddingBottom: '5px', marginBottom: '14px', opacity: '0.85', display: 'flex', alignItems: 'center', gap: '6px' },
      summary: { fontSize: '9.5pt', color: '#374151', lineHeight: '1.78' },
      expItem: { marginBottom: '16px' },
      role: { fontWeight: '700', fontSize: '10pt', fontFamily: "var(--font-heading, 'Helvetica Neue', Arial, sans-serif)", color: '#1e293b', lineHeight: '1.3' },
      company: { fontSize: '8.5pt', color: '#64748b', marginTop: '1px' },
      dateBadge: { background: '#eff6ff', color: t.primary || '#1e40af', padding: '2px 8px', borderRadius: '10px', fontSize: '7.5pt', fontWeight: '600', whiteSpace: 'nowrap', marginLeft: '8px' },
      desc: { fontSize: '8.5pt', color: '#4b5563', marginTop: '5px', lineHeight: '1.75' },
      bullet: { fontSize: '8.5pt', color: '#4b5563', marginBottom: '3px', lineHeight: '1.65' },
    }),
  },

  minimal: {
    fontFamily: "var(--font-body, 'Helvetica Neue', Arial, sans-serif)",
    fontSize: '10pt',
    maxWidth: '794px',
    colors: {
      primary: { label: 'Accent Color', default: '#111111' },
    },
    styles: (t = {}) => ({
      name: { fontSize: '30pt', fontWeight: '300', fontFamily: "var(--font-heading, 'Helvetica Neue', Arial, sans-serif)", letterSpacing: '-1.5px', color: t.primary || '#111111', lineHeight: '1.0' },
      headline: { fontSize: '10.5pt', fontFamily: "var(--font-heading, 'Helvetica Neue', Arial, sans-serif)", color: '#9ca3af', marginTop: '6px', letterSpacing: '0.08em', fontWeight: '400' },
      contacts: { display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f3f4f6', fontSize: '8.5pt', color: '#9ca3af', lineHeight: '1.5' },
      section: { marginTop: '28px' },
      sectionTitle: { fontSize: '7.5pt', fontWeight: '800', fontFamily: "var(--font-heading, 'Helvetica Neue', Arial, sans-serif)", textTransform: 'uppercase', letterSpacing: '2.5px', color: '#d1d5db', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' },
      thinLine: { border: 'none', borderTop: t.sectionDividers !== false ? '1px solid #f3f4f6' : 'none', marginBottom: '14px' },
      summary: { fontSize: '9.5pt', color: '#6b7280', lineHeight: '1.85' },
      expItem: { marginBottom: '18px' },
      role: { fontWeight: '600', fontFamily: "var(--font-heading, 'Helvetica Neue', Arial, sans-serif)", color: t.primary || '#111111', fontSize: '10pt', lineHeight: '1.3' },
      company: { fontSize: '8.5pt', color: '#9ca3af', marginTop: '2px', letterSpacing: '0.01em' },
      dates: { fontSize: '8.5pt', color: '#d1d5db' },
      desc: { fontSize: '8.5pt', color: '#6b7280', marginTop: '5px', lineHeight: '1.78' },
      bullet: { fontSize: '8.5pt', color: '#6b7280', marginBottom: '3px', lineHeight: '1.65' },
      skillChip: { border: '1px solid #f3f4f6', borderRadius: '2px', padding: '2px 10px', fontSize: '7.5pt', color: '#9ca3af', display: 'inline-block' },
      eduDegree: { fontSize: '10pt', fontWeight: '600', fontFamily: "var(--font-heading, 'Helvetica Neue', Arial, sans-serif)", color: t.primary || '#111111', lineHeight: '1.3' },
      eduInst: { fontSize: '8.5pt', color: '#9ca3af', marginTop: '2px' },
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
  // Carry over custom style parameters
  result.fontHeading = rawTheme.fontHeading || '';
  result.fontBody = rawTheme.fontBody || '';
  result.pageSize = rawTheme.pageSize || 'A4';
  result.margins = rawTheme.margins || 'normal';
  result.showIcons = rawTheme.showIcons !== false; // default to true
  result.sectionDividers = rawTheme.sectionDividers !== false; // default to true
  return result;
};
