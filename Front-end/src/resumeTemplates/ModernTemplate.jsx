import React from 'react';
import { TEMPLATE_TOKENS, resolveTheme, resolvePadding } from './templateSchema.js';
import { EditableText, EditableMultiline, EditableBullets, EditableSkillChips, BlockWrapper, SectionWrapper, SectionActiveContext } from '../components/InlineCVEditor.jsx';

const SummaryIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75, flexShrink: 0 }}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const ExperienceIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75, flexShrink: 0 }}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const EducationIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75, flexShrink: 0 }}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>;
const SkillsIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75, flexShrink: 0 }}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
const ProjectsIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75, flexShrink: 0 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const CertificationsIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75, flexShrink: 0 }}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>;
const ContactIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.09h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69A16 16 0 0 0 16 16.73l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 23.73 18z"/></svg>;
const PhoneIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.09h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69A16 16 0 0 0 16 16.73l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 23.73 18z"/></svg>;
const MailIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const MapPinIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const LinkedInIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
const GitHubIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>;

/**
 * Modern Template — Helvetica sans-serif, gradient header, sidebar layout.
 */
const ModernTemplate = ({ resumeData = {}, onUpdate, editMode = true, theme: rawTheme }) => {
  const p = resumeData.personalInfo || {};
  const t = resolveTheme('modern', rawTheme || resumeData.theme);
  const s = TEMPLATE_TOKENS.modern.styles(t);
  const skills = resumeData.skills || {};
  const bodyPadding = resolvePadding('modern', t.margins);

  const updPI = (k) => (v) => onUpdate?.({ personalInfo: { ...p, [k]: v } });
  const updSummary = (v) => onUpdate?.({ summary: v });

  const updExp = (i, k) => (v) => {
    const arr = [...(resumeData.experience || [])];
    arr[i] = { ...arr[i], [k]: v };
    onUpdate?.({ experience: arr });
  };
  const updExpAch = (i) => (v) => {
    const arr = [...(resumeData.experience || [])];
    arr[i] = { ...arr[i], achievements: v };
    onUpdate?.({ experience: arr });
  };
  const addExp = () => onUpdate?.({ experience: [...(resumeData.experience || []), { role: 'New Role', company: 'Company', startDate: '', endDate: '', current: false, location: '', description: '', achievements: [] }] });
  const removeExp = (i) => onUpdate?.({ experience: (resumeData.experience || []).filter((_, j) => j !== i) });
  const moveExp = (i, dir) => {
    const arr = [...(resumeData.experience || [])];
    const to = i + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[i], arr[to]] = [arr[to], arr[i]];
    onUpdate?.({ experience: arr });
  };

  const updEdu = (i, k) => (v) => {
    const arr = [...(resumeData.education || [])];
    arr[i] = { ...arr[i], [k]: v };
    onUpdate?.({ education: arr });
  };
  const addEdu = () => onUpdate?.({ education: [...(resumeData.education || []), { institution: 'University', degree: 'Bachelor', field: '', startDate: '', endDate: '', gpa: '' }] });
  const removeEdu = (i) => onUpdate?.({ education: (resumeData.education || []).filter((_, j) => j !== i) });

  const updSkills = (k) => (v) => onUpdate?.({ skills: { ...skills, [k]: v } });

  const updPr = (i, k) => (v) => {
    const arr = [...(resumeData.projects || [])];
    arr[i] = { ...arr[i], [k]: v };
    onUpdate?.({ projects: arr });
  };
  const addPr = () => onUpdate?.({ projects: [...(resumeData.projects || []), { name: 'New Project', description: '', techStack: [], url: '' }] });
  const removePr = (i) => onUpdate?.({ projects: (resumeData.projects || []).filter((_, j) => j !== i) });

  const T = editMode ? EditableText : ({ children, value }) => (
    <span dangerouslySetInnerHTML={{ __html: value || children || '' }} />
  );
  const ML = editMode ? EditableMultiline : ({ children, value }) => (
    <span style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: value || children || '' }} />
  );

  const { isSectionActive } = React.useContext(SectionActiveContext);
  const addBtn = (onClick) => (editMode && isSectionActive) ? (
    <button onClick={onClick} style={{ width: '100%', padding: '5px', marginTop: '4px', background: 'transparent', border: `1px dashed ${t.primary}44`, borderRadius: '4px', cursor: 'pointer', fontSize: '7.5pt', color: t.primary + '99' }}>
      + Add
    </button>
  ) : null;

  return (
    <div style={{ fontFamily: TEMPLATE_TOKENS.modern.fontFamily, fontSize: TEMPLATE_TOKENS.modern.fontSize, color: '#1e293b', background: '#fff', width: '100%', boxSizing: 'border-box' }}>

      {/* Gradient Header */}
      <div style={{ ...s.header, padding: bodyPadding.header }}>
        {p.picture && (
          <img src={p.picture} alt="Profile" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.6)', marginBottom: '10px' }} />
        )}
        <div style={s.name}>
          <T value={p.name || ''} onChange={updPI('name')} placeholder="Your Name" bold style={{ color: 'white' }} />
        </div>
        {(p.jobTitle || editMode) && (
          <div style={s.headline}>
            <T value={p.jobTitle || ''} onChange={updPI('jobTitle')} placeholder="Job Title" style={{ color: 'rgba(255,255,255,0.85)' }} />
          </div>
        )}
      </div>

      {/* Body: Sidebar + Main */}
      <div style={{ display: 'flex', minHeight: '0' }}>

        {/* Sidebar */}
        <div style={{ ...s.sidebar, padding: bodyPadding.sidebar }}>
          {/* Contact */}
          <div style={s.sidebarSection}>
            <div style={s.sidebarTitle}>
              {t.showIcons && <ContactIcon />}
              Contact
            </div>
            {(p.email || editMode) && (
              <div style={s.contactRow}>
                {t.showIcons !== false ? <MailIcon /> : <span style={{ fontWeight: 'bold', flexShrink: 0 }}>E:</span>}
                <T value={p.email || ''} onChange={updPI('email')} placeholder="email@example.com" />
              </div>
            )}
            {(p.phone || editMode) && (
              <div style={s.contactRow}>
                {t.showIcons !== false ? <PhoneIcon /> : <span style={{ fontWeight: 'bold', flexShrink: 0 }}>P:</span>}
                <T value={p.phone || ''} onChange={updPI('phone')} placeholder="+1 555 000" />
              </div>
            )}
            {(p.location || editMode) && (
              <div style={s.contactRow}>
                {t.showIcons !== false ? <MapPinIcon /> : <span style={{ fontWeight: 'bold', flexShrink: 0 }}>L:</span>}
                <T value={p.location || ''} onChange={updPI('location')} placeholder="City" />
              </div>
            )}
            {(p.linkedin || editMode) && (
              <div style={s.contactRow}>
                {t.showIcons !== false ? <LinkedInIcon /> : <span style={{ fontWeight: 'bold', flexShrink: 0 }}>In:</span>}
                <T value={p.linkedin || ''} onChange={updPI('linkedin')} placeholder="LinkedIn" />
              </div>
            )}
            {(p.github || editMode) && (
              <div style={s.contactRow}>
                {t.showIcons !== false ? <GitHubIcon /> : <span style={{ fontWeight: 'bold', flexShrink: 0 }}>Gh:</span>}
                <T value={p.github || ''} onChange={updPI('github')} placeholder="GitHub" />
              </div>
            )}
          </div>

          {/* Skills in sidebar */}
          {[['technical', 'Technical Skills'], ['tools', 'Tools'], ['languages', 'Languages'], ['soft', 'Soft Skills']].map(([key, label]) => (
            (skills[key]?.length > 0 || editMode) && (
              <SectionWrapper key={key} editMode={editMode} sectionLabel={label} onDelete={() => updSkills(key)([])}>
                <div style={s.sidebarSection}>
                  <div style={s.sidebarTitle}>
                    {t.showIcons && <SkillsIcon />}
                    {label}
                  </div>
                  <EditableSkillChips items={skills[key] || []} onChange={updSkills(key)} editMode={editMode} chipStyle={s.skillTag} />
                </div>
              </SectionWrapper>
            )
          ))}

          {/* Certifications */}
          {((resumeData.certifications || []).length > 0 || editMode) && (
            <SectionWrapper
              editMode={editMode}
              sectionLabel="Certifications"
              onAdd={() => onUpdate?.({ certifications: [...(resumeData.certifications || []), { name: '', issuer: '' }] })}
              onDelete={() => onUpdate?.({ certifications: [] })}
            >
              <div style={s.sidebarSection}>
                <div style={s.sidebarTitle}>
                  {t.showIcons && <CertificationsIcon />}
                  Certifications
                </div>
                {(resumeData.certifications || []).map((c, i) => (
                  <BlockWrapper key={i} id={`certification-${i}`} editMode={editMode} onDelete={() => onUpdate?.({ certifications: (resumeData.certifications || []).filter((_, idx) => idx !== i) })}>
                    <div style={{ fontSize: '7.5pt', color: '#475569', marginBottom: '6px', lineHeight: '1.4' }}>
                      <div style={{ fontWeight: 'bold' }}>
                        <T value={c.name || ''} onChange={(v) => {
                          const next = [...(resumeData.certifications || [])];
                          next[i] = { ...next[i], name: v };
                          onUpdate?.({ certifications: next });
                        }} placeholder="Certification Name" />
                      </div>
                      <div style={{ opacity: 0.8 }}>
                        <T value={c.issuer || ''} onChange={(v) => {
                          const next = [...(resumeData.certifications || [])];
                          next[i] = { ...next[i], issuer: v };
                          onUpdate?.({ certifications: next });
                        }} placeholder="Issuer" />
                      </div>
                    </div>
                  </BlockWrapper>
                ))}
              </div>
            </SectionWrapper>
          )}
        </div>

        {/* Main Content */}
        <div style={{ ...s.main, padding: bodyPadding.main }}>
          {/* Summary */}
          {(resumeData.summary || editMode) && (
            <SectionWrapper editMode={editMode} sectionLabel="Summary" onDelete={() => onUpdate?.({ summary: '' })}>
              <div style={s.section}>
                <div style={s.sectionTitle} data-heading="true" data-block-id="heading-sec-0">
                  {t.showIcons && <SummaryIcon />}
                  Summary
                </div>
                <div style={s.summary} data-block data-block-id="summary-body"><ML value={resumeData.summary || ''} onChange={updSummary} placeholder="Brief professional overview..." /></div>
              </div>
            </SectionWrapper>
          )}

          {/* Experience */}
          {((resumeData.experience || []).length > 0 || editMode) && (
            <SectionWrapper editMode={editMode} sectionLabel="Experience" onAdd={addExp} onDelete={() => onUpdate?.({ experience: [] })}>
              <div style={s.section}>
                <div style={s.sectionTitle} data-heading="true" data-block-id="heading-sec-1">
                  {t.showIcons && <ExperienceIcon />}
                  Experience
                </div>
                {(resumeData.experience || []).map((exp, i) => (
                  <BlockWrapper key={i} id={`experience-${i}`} editMode={editMode} onDelete={() => removeExp(i)} onMoveUp={i > 0 ? () => moveExp(i, -1) : null} onMoveDown={i < (resumeData.experience || []).length - 1 ? () => moveExp(i, 1) : null}>
                    <div style={s.expItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={s.role}><T value={exp.role || ''} onChange={updExp(i, 'role')} placeholder="Job Title" bold /></span>
                          <span style={s.company}>
                            <T value={exp.company || ''} onChange={updExp(i, 'company')} placeholder="Company" />
                            {(exp.location || editMode) && <span>, <T value={exp.location || ''} onChange={updExp(i, 'location')} placeholder="Location" /></span>}
                          </span>
                        </div>
                        <span style={s.dateBadge}>
                          <T value={exp.startDate || ''} onChange={updExp(i, 'startDate')} placeholder="Jan 2022" />
                          {' – '}
                          <T value={exp.current ? 'Present' : (exp.endDate || '')} onChange={(v) => { if (v === 'Present') updExp(i, 'current')(true); else { updExp(i, 'current')(false); updExp(i, 'endDate')(v); } }} placeholder="Present" />
                        </span>
                      </div>
                      {(exp.description || editMode) && (
                        <div style={s.desc}><ML value={exp.description || ''} onChange={updExp(i, 'description')} placeholder="Describe your role..." /></div>
                      )}
                      <EditableBullets items={exp.achievements || []} onChange={updExpAch(i)} editMode={editMode} style={s.bullet} />
                    </div>
                  </BlockWrapper>
                ))}
                {addBtn(addExp)}
              </div>
            </SectionWrapper>
          )}

          {/* Projects */}
          {((resumeData.projects || []).length > 0 || editMode) && (
            <SectionWrapper editMode={editMode} sectionLabel="Projects" onAdd={addPr} onDelete={() => onUpdate?.({ projects: [] })}>
              <div style={s.section}>
                <div style={s.sectionTitle} data-heading="true" data-block-id="heading-sec-2">
                  {t.showIcons && <ProjectsIcon />}
                  Projects
                </div>
                {(resumeData.projects || []).map((pr, i) => (
                  <BlockWrapper key={i} id={`project-${i}`} editMode={editMode} onDelete={() => removePr(i)}>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ ...s.role, fontWeight: '700', fontSize: '9pt' }}>
                        <T value={pr.name || ''} onChange={updPr(i, 'name')} placeholder="Project Name" bold />
                        {(pr.url || editMode) && <span style={{ fontSize: '7.5pt', color: '#2563eb', marginLeft: '6px', fontWeight: 'normal' }}>[<T value={pr.url || ''} onChange={updPr(i, 'url')} placeholder="URL" />]</span>}
                      </div>
                      {(pr.description || editMode) && <div style={s.desc}><ML value={pr.description || ''} onChange={updPr(i, 'description')} placeholder="What did you build?" /></div>}
                      <EditableSkillChips items={pr.techStack || []} onChange={updPr(i, 'techStack')} editMode={editMode} chipStyle={{ ...s.skillTag, color: '#2563eb', borderColor: '#bfdbfe' }} label="Tech" />
                    </div>
                  </BlockWrapper>
                ))}
                {addBtn(addPr)}
              </div>
            </SectionWrapper>
          )}

          {/* Education */}
          {((resumeData.education || []).length > 0 || editMode) && (
            <SectionWrapper editMode={editMode} sectionLabel="Education" onAdd={addEdu} onDelete={() => onUpdate?.({ education: [] })}>
              <div style={s.section}>
                <div style={s.sectionTitle} data-heading="true" data-block-id="heading-sec-3">
                  {t.showIcons && <EducationIcon />}
                  Education
                </div>
                {(resumeData.education || []).map((edu, i) => (
                  <BlockWrapper key={i} id={`education-${i}`} editMode={editMode} onDelete={() => removeEdu(i)}>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '9pt' }}><T value={edu.degree || ''} onChange={updEdu(i, 'degree')} placeholder="Degree" bold />{edu.field || editMode ? <span style={{ fontWeight: 'normal' }}> in <T value={edu.field || ''} onChange={updEdu(i, 'field')} placeholder="Field" /></span> : ''}</div>
                          <div style={{ fontSize: '8.5pt', color: '#64748b' }}><T value={edu.institution || ''} onChange={updEdu(i, 'institution')} placeholder="University" /></div>
                        </div>
                        <span style={s.dateBadge}><T value={edu.endDate || ''} onChange={updEdu(i, 'endDate')} placeholder="2024" /></span>
                      </div>
                      {(edu.gpa || editMode) && <div style={{ fontSize: '8pt', color: '#64748b', marginTop: '2px' }}>GPA: <T value={edu.gpa || ''} onChange={updEdu(i, 'gpa')} placeholder="3.8" /></div>}
                    </div>
                  </BlockWrapper>
                ))}
                {addBtn(addEdu)}
              </div>
            </SectionWrapper>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernTemplate;
