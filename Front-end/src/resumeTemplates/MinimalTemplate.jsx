import React from 'react';
import { TEMPLATE_TOKENS, resolveTheme, resolvePadding } from './templateSchema.js';
import { EditableText, EditableMultiline, EditableBullets, EditableSkillChips, BlockWrapper, SectionWrapper, SectionActiveContext } from '../components/InlineCVEditor.jsx';

const SummaryIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75, flexShrink: 0 }}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const ExperienceIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75, flexShrink: 0 }}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const EducationIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75, flexShrink: 0 }}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>;
const SkillsIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75, flexShrink: 0 }}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
const ProjectsIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75, flexShrink: 0 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const CertificationsIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75, flexShrink: 0 }}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>;

/**
 * Minimal Template — ultra-clean, typography-first, whitespace-focused.
 */
const MinimalTemplate = ({ resumeData = {}, onUpdate, editMode = true, theme: rawTheme }) => {
  const p = resumeData.personalInfo || {};
  const t = resolveTheme('minimal', rawTheme || resumeData.theme);
  const s = TEMPLATE_TOKENS.minimal.styles(t);
  const skills = resumeData.skills || {};
  const allSkills = [...(skills.technical || []), ...(skills.tools || [])];
  const bodyPadding = resolvePadding('minimal', t.margins);

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
  const addEdu = () => onUpdate?.({ education: [...(resumeData.education || []), { institution: 'University', degree: 'Bachelor', field: '', endDate: '' }] });
  const removeEdu = (i) => onUpdate?.({ education: (resumeData.education || []).filter((_, j) => j !== i) });

  const updSkills = (k) => (v) => onUpdate?.({ skills: { ...skills, [k]: v } });

  const updPr = (i, k) => (v) => {
    const arr = [...(resumeData.projects || [])];
    arr[i] = { ...arr[i], [k]: v };
    onUpdate?.({ projects: arr });
  };
  const addPr = () => onUpdate?.({ projects: [...(resumeData.projects || []), { name: 'New Project', description: '', techStack: [] }] });
  const removePr = (i) => onUpdate?.({ projects: (resumeData.projects || []).filter((_, j) => j !== i) });

  const T = editMode ? EditableText : ({ children, value }) => (
    <span dangerouslySetInnerHTML={{ __html: value || children || '' }} />
  );
  const ML = editMode ? EditableMultiline : ({ children, value }) => (
    <span style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: value || children || '' }} />
  );

  const { isSectionActive } = React.useContext(SectionActiveContext);
  const addBtn = (onClick) => (editMode && isSectionActive) ? (
    <button onClick={onClick} style={{ width: '100%', padding: '5px', marginTop: '4px', background: 'transparent', border: '1px dashed #e5e7eb', borderRadius: '3px', cursor: 'pointer', fontSize: '7.5pt', color: '#9ca3af' }}>
      + Add
    </button>
  ) : null;

  const ThinLine = () => <hr style={s.thinLine} />;

  return (
    <div style={{ fontFamily: TEMPLATE_TOKENS.minimal.fontFamily, fontSize: TEMPLATE_TOKENS.minimal.fontSize, color: '#374151', background: '#fff', padding: bodyPadding, maxWidth: TEMPLATE_TOKENS.minimal.maxWidth, margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>

      {/* Name — split weight trick: first name bold, rest light */}
      <div style={s.name}>
        <strong style={{ fontWeight: '700' }}>
          <T value={(p.name || 'Your Name').split(' ')[0]} onChange={(v) => { const rest = (p.name || '').split(' ').slice(1).join(' '); updPI('name')(rest ? v + ' ' + rest : v); }} placeholder="First" />
        </strong>
        {' '}
        <T value={(p.name || '').split(' ').slice(1).join(' ')} onChange={(v) => { const first = (p.name || '').split(' ')[0]; updPI('name')(first ? first + ' ' + v : v); }} placeholder="Last Name" />
      </div>

      {(p.jobTitle || editMode) && (
        <div style={s.headline}>
          <T value={p.jobTitle || ''} onChange={updPI('jobTitle')} placeholder="Job Title" />
        </div>
      )}

      {/* Contacts */}
      <div style={s.contacts}>
        {(p.email || editMode) && <span><T value={p.email || ''} onChange={updPI('email')} placeholder="email@example.com" /></span>}
        {(p.phone || editMode) && <span><T value={p.phone || ''} onChange={updPI('phone')} placeholder="+1 555 000" /></span>}
        {(p.location || editMode) && <span><T value={p.location || ''} onChange={updPI('location')} placeholder="City" /></span>}
        {(p.linkedin || editMode) && <a href={p.linkedin} style={{ color: '#374151', textDecoration: 'none' }}><T value={p.linkedin || ''} onChange={updPI('linkedin')} placeholder="LinkedIn" /></a>}
        {(p.github || editMode) && <a href={p.github} style={{ color: '#374151', textDecoration: 'none' }}><T value={p.github || ''} onChange={updPI('github')} placeholder="GitHub" /></a>}
      </div>

      {/* About / Summary */}
      {(resumeData.summary || editMode) && (
        <SectionWrapper editMode={editMode} sectionLabel="Summary" onDelete={() => onUpdate?.({ summary: '' })}>
          <div style={s.section}>
            <div style={s.sectionTitle} data-heading="true" data-block-id="heading-sec-0">
              {t.showIcons && <SummaryIcon />}
              About
            </div>
            <ThinLine />
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
            <ThinLine />
            {(resumeData.experience || []).map((exp, i) => (
              <BlockWrapper key={i} id={`experience-${i}`} editMode={editMode} onDelete={() => removeExp(i)} onMoveUp={i > 0 ? () => moveExp(i, -1) : null} onMoveDown={i < (resumeData.experience || []).length - 1 ? () => moveExp(i, 1) : null}>
                <div style={s.expItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={s.role}><T value={exp.role || ''} onChange={updExp(i, 'role')} placeholder="Job Title" bold /></div>
                    <div style={s.dates}>
                      <T value={exp.startDate || ''} onChange={updExp(i, 'startDate')} placeholder="Jan 2022" />
                      {' – '}
                      <T value={exp.current ? 'Present' : (exp.endDate || '')} onChange={(v) => { if (v === 'Present') updExp(i, 'current')(true); else { updExp(i, 'current')(false); updExp(i, 'endDate')(v); } }} placeholder="Present" />
                    </div>
                  </div>
                  <div style={s.company}>
                    <T value={exp.company || ''} onChange={updExp(i, 'company')} placeholder="Company Name" />
                    {(exp.location || editMode) && <span>, <T value={exp.location || ''} onChange={updExp(i, 'location')} placeholder="Location" /></span>}
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

      {/* Skills */}
      {(allSkills.length > 0 || editMode) && (
        <SectionWrapper editMode={editMode} sectionLabel="Skills" onDelete={() => onUpdate?.({ skills: { technical: [], tools: [], soft: [], languages: [] } })}>
          <div style={s.section}>
            <div style={s.sectionTitle} data-heading="true" data-block-id="heading-sec-2">
              {t.showIcons && <SkillsIcon />}
              Skills
            </div>
            <ThinLine />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '4px' }} data-block data-block-id="skills-main">
              <EditableSkillChips items={[...(skills.technical || []), ...(skills.tools || [])]}
                onChange={(v) => {
                  const mid = Math.ceil(v.length / 2);
                  updSkills('technical')(v.slice(0, mid));
                  updSkills('tools')(v.slice(mid));
                }}
                editMode={editMode} chipStyle={s.skillChip} />
            </div>
            {(skills.soft?.length > 0 || editMode) && (
              <div style={{ marginTop: '4px', fontSize: '8pt', color: '#6b7280' }}>
                Soft: <EditableSkillChips items={skills.soft || []} onChange={updSkills('soft')} editMode={editMode} chipStyle={{ ...s.skillChip, background: 'transparent', border: 'none', padding: '0', borderRadius: '0' }} inline />
              </div>
            )}
            {(skills.languages?.length > 0 || editMode) && (
              <div style={{ marginTop: '4px', fontSize: '8pt', color: '#6b7280' }}>
                Languages: <EditableSkillChips items={skills.languages || []} onChange={updSkills('languages')} editMode={editMode} chipStyle={{ ...s.skillChip, background: 'transparent', border: 'none', padding: '0', borderRadius: '0' }} inline />
              </div>
            )}
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
            <ThinLine />
            {(resumeData.education || []).map((edu, i) => (
              <BlockWrapper key={i} id={`education-${i}`} editMode={editMode} onDelete={() => removeEdu(i)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                  <div>
                    <div style={s.eduDegree}>
                      <T value={edu.degree || ''} onChange={updEdu(i, 'degree')} placeholder="Degree" bold />
                      {(edu.field || editMode) && <span style={{ fontWeight: '400' }}> in <T value={edu.field || ''} onChange={updEdu(i, 'field')} placeholder="Field" /></span>}
                    </div>
                    <div style={s.eduInst}>
                      <T value={edu.institution || ''} onChange={updEdu(i, 'institution')} placeholder="University" />
                    </div>
                  </div>
                  <div style={{ fontSize: '8.5pt', color: '#9ca3af' }}>
                    <T value={edu.endDate || ''} onChange={updEdu(i, 'endDate')} placeholder="2024" />
                  </div>
                </div>
              </BlockWrapper>
            ))}
            {addBtn(addEdu)}
          </div>
        </SectionWrapper>
      )}

      {/* Projects */}
      {((resumeData.projects || []).length > 0 || editMode) && (
        <SectionWrapper editMode={editMode} sectionLabel="Projects" onAdd={addPr} onDelete={() => onUpdate?.({ projects: [] })}>
          <div style={s.section}>
            <div style={s.sectionTitle} data-heading="true" data-block-id="heading-sec-4">
              {t.showIcons && <ProjectsIcon />}
              Projects
            </div>
            <ThinLine />
            {(resumeData.projects || []).map((pr, i) => (
              <BlockWrapper key={i} id={`project-${i}`} editMode={editMode} onDelete={() => removePr(i)}>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontWeight: '600', color: t.primary, fontSize: '9.5pt' }}>
                    <T value={pr.name || ''} onChange={updPr(i, 'name')} placeholder="Project Name" bold />
                    {(pr.url || editMode) && <span style={{ fontSize: '8pt', color: '#6b7280', fontWeight: 'normal', marginLeft: '6px' }}>[<T value={pr.url || ''} onChange={updPr(i, 'url')} placeholder="URL" />]</span>}
                  </div>
                  {(pr.description || editMode) && <div style={s.desc}><ML value={pr.description || ''} onChange={updPr(i, 'description')} placeholder="What did you build?" /></div>}
                  {(pr.techStack?.length > 0 || editMode) && (
                    <div style={{ fontSize: '7.5pt', color: '#9ca3af', marginTop: '3px' }}>
                      <EditableSkillChips items={pr.techStack || []} onChange={updPr(i, 'techStack')} editMode={editMode} chipStyle={{ ...s.skillChip, background: 'transparent', border: 'none', padding: '0', borderRadius: '0', color: '#9ca3af' }} inline separator=" · " />
                    </div>
                  )}
                </div>
              </BlockWrapper>
            ))}
            {addBtn(addPr)}
          </div>
        </SectionWrapper>
      )}

      {/* Certifications */}
      {((resumeData.certifications || []).length > 0 || editMode) && (
        <SectionWrapper
          editMode={editMode}
          sectionLabel="Certifications"
          onAdd={() => onUpdate?.({ certifications: [...(resumeData.certifications || []), { name: '', issuer: '' }] })}
          onDelete={() => onUpdate?.({ certifications: [] })}
        >
          <div style={s.section}>
            <div style={s.sectionTitle} data-heading="true" data-block-id="heading-sec-5">
              {t.showIcons && <CertificationsIcon />}
              Certifications
            </div>
            <ThinLine />
            {(resumeData.certifications || []).map((c, i) => (
              <BlockWrapper key={i} id={`certification-${i}`} editMode={editMode} onDelete={() => onUpdate?.({ certifications: (resumeData.certifications || []).filter((_, idx) => idx !== i) })}>
                <div style={{ fontSize: '8.5pt', color: '#4b5563', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600' }}>
                    <T value={c.name || ''} onChange={(v) => {
                      const next = [...(resumeData.certifications || [])];
                      next[i] = { ...next[i], name: v };
                      onUpdate?.({ certifications: next });
                    }} placeholder="Certification" />
                  </span>
                  {' — '}
                  <T value={c.issuer || ''} onChange={(v) => {
                    const next = [...(resumeData.certifications || [])];
                    next[i] = { ...next[i], issuer: v };
                    onUpdate?.({ certifications: next });
                  }} placeholder="Issuer" />
                </div>
              </BlockWrapper>
            ))}
          </div>
        </SectionWrapper>
      )}
    </div>
  );
};

export default MinimalTemplate;
