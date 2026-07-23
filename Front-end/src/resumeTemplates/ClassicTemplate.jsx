import React from 'react';
import { TEMPLATE_TOKENS, resolveTheme, resolvePadding } from './templateSchema.js';
import { EditableText, EditableMultiline, EditableBullets, EditableSkillChips, BlockWrapper, SectionWrapper, AddItemOverlay, EDITOR_UI_PROPS } from '../components/InlineCVEditor.jsx';

const SummaryIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75, flexShrink: 0 }}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const ExperienceIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75, flexShrink: 0 }}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const EducationIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75, flexShrink: 0 }}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>;
const SkillsIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75, flexShrink: 0 }}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
const ProjectsIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75, flexShrink: 0 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;

/**
 * Classic Template — Georgia serif, single-column, traditional layout.
 * Used by both the inline editor (editMode=true) and as a render-only view (editMode=false).
 */
const ClassicTemplate = ({ resumeData = {}, onUpdate, editMode = true, theme: rawTheme }) => {
  const p = resumeData.personalInfo || {};
  const t = resolveTheme('classic', rawTheme || resumeData.theme);
  const s = TEMPLATE_TOKENS.classic.styles(t);
  const skills = resumeData.skills || {};
  const bodyPadding = resolvePadding('classic', t.margins);

  // Overlay-layer add affordance — floats over the section margin, zero
  // layout footprint, stripped from exports.
  const addBtn = (onClick, label) => editMode ? <AddItemOverlay onClick={onClick} label={label} /> : null;

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
  const addExp = () => {
    const arr = [{ role: 'New Role', company: 'Company', startDate: '', endDate: '', current: false, location: '', description: '', achievements: [] }, ...(resumeData.experience || [])];
    onUpdate?.({ experience: arr });
  };
  const removeExp = (i) => {
    const arr = (resumeData.experience || []).filter((_, j) => j !== i);
    onUpdate?.({ experience: arr });
  };
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
  const addEdu = () => {
    const arr = [{ institution: 'University', degree: 'Bachelor', field: '', startDate: '', endDate: '', gpa: '' }, ...(resumeData.education || [])];
    onUpdate?.({ education: arr });
  };
  const removeEdu = (i) => {
    const arr = (resumeData.education || []).filter((_, j) => j !== i);
    onUpdate?.({ education: arr });
  };

  const updSkills = (k) => (v) => onUpdate?.({ skills: { ...skills, [k]: v } });

  const updPr = (i, k) => (v) => {
    const arr = [...(resumeData.projects || [])];
    arr[i] = { ...arr[i], [k]: v };
    onUpdate?.({ projects: arr });
  };
  const addPr = () => {
    const arr = [{ name: 'New Project', description: '', techStack: [], url: '', github: '' }, ...(resumeData.projects || [])];
    onUpdate?.({ projects: arr });
  };
  const removePr = (i) => {
    const arr = (resumeData.projects || []).filter((_, j) => j !== i);
    onUpdate?.({ projects: arr });
  };

  const T = editMode ? EditableText : ({ children, value }) => (
    <span dangerouslySetInnerHTML={{ __html: value || children || '' }} />
  );
  const ML = editMode ? EditableMultiline : ({ children, value }) => (
    <span style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: value || children || '' }} />
  );

  return (
    <div style={{ fontFamily: TEMPLATE_TOKENS.classic.fontFamily, fontSize: TEMPLATE_TOKENS.classic.fontSize, color: t.primary, background: '#fff', padding: bodyPadding, maxWidth: TEMPLATE_TOKENS.classic.maxWidth, margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '0' }}>
        {p.picture && (
          <img src={p.picture} alt="Profile" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        )}
        <div style={{ flex: 1 }}>
          <div style={s.name}>
            <T value={p.name || ''} onChange={updPI('name')} placeholder="Your Name" bold />
          </div>
          {(p.jobTitle || editMode) && (
            <div style={s.headline}>
              <T value={p.jobTitle || ''} onChange={updPI('jobTitle')} placeholder="Job Title" />
            </div>
          )}
          <div style={s.contact}>
            {(p.email || editMode) && <span>Email: <T value={p.email || ''} onChange={updPI('email')} placeholder="email@example.com" /></span>}
            {(p.phone || editMode) && <span>Phone: <T value={p.phone || ''} onChange={updPI('phone')} placeholder="+1 555 000" /></span>}
            {(p.location || editMode) && <span>Location: <T value={p.location || ''} onChange={updPI('location')} placeholder="City" /></span>}
            {(p.linkedin || editMode) && <span>LinkedIn: <T value={p.linkedin || ''} onChange={updPI('linkedin')} placeholder="LinkedIn URL" /></span>}
            {(p.github || editMode) && <span>GitHub: <T value={p.github || ''} onChange={updPI('github')} placeholder="GitHub URL" /></span>}
          </div>
        </div>
      </div>

      <hr style={s.divider} />

      {/* Summary */}
      {Boolean(resumeData.summary && resumeData.summary.trim()) && (
        <SectionWrapper editMode={editMode} sectionLabel="Summary" onDelete={() => onUpdate?.({ summary: '' })}>
          <div style={s.section}>
            <div style={s.sectionTitle} data-heading="true" data-block-id="heading-summary">
              {t.showIcons && <SummaryIcon />}
              Professional Summary
            </div>
            <div style={s.summary} data-block data-block-id="summary-body">
              <ML value={resumeData.summary || ''} onChange={updSummary} placeholder="Brief professional overview..." />
            </div>
          </div>
        </SectionWrapper>
      )}

      {/* Experience */}
      {(resumeData.experience || []).length > 0 && (
        <SectionWrapper editMode={editMode} sectionLabel="Experience" onAdd={addExp} onDelete={() => onUpdate?.({ experience: [] })}>
          <div style={s.section}>
            <div style={s.sectionTitle} data-heading="true" data-block-id="heading-experience">
              {t.showIcons && <ExperienceIcon />}
              Experience
            </div>
            {(resumeData.experience || []).map((exp, i) => (
              <BlockWrapper key={exp.id || exp._id || `exp-${i}-${exp.role || ''}-${exp.company || ''}`} id={`experience-${i}`} editMode={editMode} onDelete={() => removeExp(i)} onMoveUp={i > 0 ? () => moveExp(i, -1) : null} onMoveDown={i < (resumeData.experience || []).length - 1 ? () => moveExp(i, 1) : null}>
                <div style={s.expItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={s.jobTitle}>
                        <T value={exp.role || ''} onChange={updExp(i, 'role')} placeholder="Job Title" bold />
                      </div>
                      <div style={s.company}>
                        <T value={exp.company || ''} onChange={updExp(i, 'company')} placeholder="Company Name" />
                        {(exp.location || editMode) && <span> · <T value={exp.location || ''} onChange={updExp(i, 'location')} placeholder="Location" /></span>}
                      </div>
                    </div>
                    <div style={s.dates}>
                      <T value={exp.startDate || ''} onChange={updExp(i, 'startDate')} placeholder="Jan 2022" />
                      {' – '}
                      <T value={exp.current ? 'Present' : (exp.endDate || '')} onChange={(v) => { if (v === 'Present') updExp(i, 'current')(true); else { updExp(i, 'current')(false); updExp(i, 'endDate')(v); } }} placeholder="Present" />
                    </div>
                  </div>
                  {(exp.description || editMode) && (
                    <div style={s.desc}>
                      <ML value={exp.description || ''} onChange={updExp(i, 'description')} placeholder="Describe your role..." />
                    </div>
                  )}
                  <EditableBullets items={exp.achievements || []} onChange={updExpAch(i)} editMode={editMode} style={s.bullet} />
                </div>
              </BlockWrapper>
            ))}
            {addBtn(addExp, 'Add Experience')}
          </div>
        </SectionWrapper>
      )}

      {/* Education */}
      {(resumeData.education || []).length > 0 && (
        <SectionWrapper editMode={editMode} sectionLabel="Education" onAdd={addEdu} onDelete={() => onUpdate?.({ education: [] })}>
          <div style={s.section}>
            <div style={s.sectionTitle} data-heading="true" data-block-id="heading-education">
              {t.showIcons && <EducationIcon />}
              Education
            </div>
            {(resumeData.education || []).map((edu, i) => (
              <BlockWrapper key={edu.id || edu._id || `edu-${i}-${edu.degree || ''}-${edu.institution || ''}`} id={`education-${i}`} editMode={editMode} onDelete={() => removeEdu(i)}>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={s.jobTitle}>
                        <T value={edu.degree || ''} onChange={updEdu(i, 'degree')} placeholder="Degree" bold />
                        {(edu.field || editMode) && <span style={{ fontWeight: 'normal' }}> in <T value={edu.field || ''} onChange={updEdu(i, 'field')} placeholder="Field of Study" /></span>}
                      </div>
                      <div style={s.company}>
                        <T value={edu.institution || ''} onChange={updEdu(i, 'institution')} placeholder="University Name" />
                      </div>
                    </div>
                    <div style={s.dates}>
                      <T value={edu.endDate || ''} onChange={updEdu(i, 'endDate')} placeholder="2024" />
                    </div>
                  </div>
                  {(edu.gpa || editMode) && (
                    <div style={s.desc}>GPA: <T value={edu.gpa || ''} onChange={updEdu(i, 'gpa')} placeholder="3.8" /></div>
                  )}
                </div>
              </BlockWrapper>
            ))}
            {addBtn(addEdu, 'Add Education')}
          </div>
        </SectionWrapper>
      )}

      {/* Skills */}
      {Object.values(skills).some(v => (v || []).length > 0) && (
        <SectionWrapper editMode={editMode} sectionLabel="Skills" onDelete={() => onUpdate?.({ skills: { technical: [], tools: [], soft: [], languages: [] } })}>
          <div style={s.section}>
            <div style={s.sectionTitle} data-heading="true" data-block-id="heading-skills">
              {t.showIcons && <SkillsIcon />}
              Skills
            </div>
            {[['technical', 'Technical'], ['tools', 'Tools & Frameworks'], ['soft', 'Soft Skills'], ['languages', 'Languages']].map(([key, label]) => (
              (skills[key]?.length > 0 || editMode) && (
                <div key={key} style={{ marginBottom: '6px' }} data-block data-block-id={`skills-${key}`}>
                  {/* Canvas content: rendered in every mode so screen = PDF */}
                  <div style={{ fontSize: '7.5pt', color: '#9ca3af', marginBottom: '3px' }}>{label}</div>
                  <EditableSkillChips
                    items={skills[key] || []}
                    onChange={updSkills(key)}
                    editMode={editMode}
                    chipStyle={s.skillPill}
                  />
                </div>
              )
            ))}
          </div>
        </SectionWrapper>
      )}

      {/* Projects */}
      {(resumeData.projects || []).length > 0 && (
        <SectionWrapper editMode={editMode} sectionLabel="Projects" onAdd={addPr} onDelete={() => onUpdate?.({ projects: [] })}>
          <div style={s.section}>
            <div style={s.sectionTitle} data-heading="true" data-block-id="heading-projects">
              {t.showIcons && <ProjectsIcon />}
              Projects
            </div>
            {(resumeData.projects || []).map((pr, i) => (
              <BlockWrapper key={pr.id || pr._id || `pr-${i}-${pr.name || ''}`} id={`project-${i}`} editMode={editMode} onDelete={() => removePr(i)}>
                <div style={s.expItem}>
                  <div style={s.jobTitle}>
                    <T value={pr.name || ''} onChange={updPr(i, 'name')} placeholder="Project Name" bold />
                    {(pr.url || editMode) && <span style={{ fontWeight: 'normal', fontSize: '8pt', color: '#2563eb', marginLeft: '6px' }}>[<T value={pr.url || ''} onChange={updPr(i, 'url')} placeholder="URL" />]</span>}
                  </div>
                  {(pr.description || editMode) && (
                    <div style={s.desc}>
                      <ML value={pr.description || ''} onChange={updPr(i, 'description')} placeholder="What did you build?" />
                    </div>
                  )}
                  <EditableSkillChips items={pr.techStack || []} onChange={updPr(i, 'techStack')} editMode={editMode} chipStyle={{ ...s.skillPill, color: '#2563eb', borderColor: '#bfdbfe' }} label="Tech Stack" />
                </div>
              </BlockWrapper>
            ))}
            {addBtn(addPr, 'Add Project')}
          </div>
        </SectionWrapper>
      )}

      {/* Restore Hidden Sections Toolbar */}
      {editMode && (
        <div {...EDITOR_UI_PROPS} style={{ marginTop: '16px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '8.5pt', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>Restore Section:</span>
          {!resumeData.summary && (
            <button onClick={() => updSummary('Brief professional overview...')} style={{ fontSize: '8pt', fontWeight: 600, color: '#4f46e5', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '3px 10px', borderRadius: '999px', cursor: 'pointer' }}>+ Professional Summary</button>
          )}
          {!(resumeData.experience || []).length && (
            <button onClick={addExp} style={{ fontSize: '8pt', fontWeight: 600, color: '#4f46e5', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '3px 10px', borderRadius: '999px', cursor: 'pointer' }}>+ Experience</button>
          )}
          {!(resumeData.education || []).length && (
            <button onClick={addEdu} style={{ fontSize: '8pt', fontWeight: 600, color: '#4f46e5', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '3px 10px', borderRadius: '999px', cursor: 'pointer' }}>+ Education</button>
          )}
          {!(resumeData.projects || []).length && (
            <button onClick={addPr} style={{ fontSize: '8pt', fontWeight: 600, color: '#4f46e5', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '3px 10px', borderRadius: '999px', cursor: 'pointer' }}>+ Projects</button>
          )}
          {!Object.values(skills).some(v => (v || []).length > 0) && (
            <button onClick={() => updSkills('technical')(['JavaScript', 'React'])} style={{ fontSize: '8pt', fontWeight: 600, color: '#4f46e5', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '3px 10px', borderRadius: '999px', cursor: 'pointer' }}>+ Skills</button>
          )}
        </div>
      )}
    </div>
  );
};

export default ClassicTemplate;
