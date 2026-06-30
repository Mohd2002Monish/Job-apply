import React from 'react';
import { TEMPLATE_TOKENS, resolveTheme } from './templateSchema.js';
import { EditableText, EditableMultiline, EditableBullets, EditableSkillChips, BlockWrapper, SectionWrapper, SectionActiveContext } from '../components/InlineCVEditor.jsx';

/**
 * Modern Template — Helvetica sans-serif, gradient header, sidebar layout.
 */
const ModernTemplate = ({ resumeData = {}, onUpdate, editMode = true, theme: rawTheme }) => {
  const p = resumeData.personalInfo || {};
  const t = resolveTheme('modern', rawTheme || resumeData.theme);
  const s = TEMPLATE_TOKENS.modern.styles(t);
  const skills = resumeData.skills || {};

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
      <div style={s.header}>
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
        <div style={s.sidebar}>
          {/* Contact */}
          <div style={s.sidebarSection}>
            <div style={s.sidebarTitle}>Contact</div>
            {(p.email || editMode) && <div style={s.contactRow}>✉ <T value={p.email || ''} onChange={updPI('email')} placeholder="email@example.com" /></div>}
            {(p.phone || editMode) && <div style={s.contactRow}>📞 <T value={p.phone || ''} onChange={updPI('phone')} placeholder="+1 555 000" /></div>}
            {(p.location || editMode) && <div style={s.contactRow}>📍 <T value={p.location || ''} onChange={updPI('location')} placeholder="City" /></div>}
            {(p.linkedin || editMode) && <div style={s.contactRow}>in <T value={p.linkedin || ''} onChange={updPI('linkedin')} placeholder="LinkedIn" /></div>}
            {(p.github || editMode) && <div style={s.contactRow}>⌥ <T value={p.github || ''} onChange={updPI('github')} placeholder="GitHub" /></div>}
          </div>

          {/* Skills in sidebar */}
          {[['technical', 'Technical Skills'], ['tools', 'Tools'], ['languages', 'Languages'], ['soft', 'Soft Skills']].map(([key, label]) => (
            (skills[key]?.length > 0 || editMode) && (
              <div key={key} style={s.sidebarSection}>
                <div style={s.sidebarTitle}>{label}</div>
                <EditableSkillChips items={skills[key] || []} onChange={updSkills(key)} editMode={editMode} chipStyle={s.skillTag} />
              </div>
            )
          ))}

          {/* Certifications */}
          {(resumeData.certifications || []).length > 0 && (
            <div style={s.sidebarSection}>
              <div style={s.sidebarTitle}>Certifications</div>
              {resumeData.certifications.map((c, i) => (
                <div key={i} style={{ fontSize: '7.5pt', color: '#475569', marginBottom: '4px', lineHeight: '1.4' }}>
                  {c.name}{c.issuer ? <><br /><span style={{ opacity: 0.75 }}>{c.issuer}</span></> : ''}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div style={s.main}>
          {/* Summary */}
          {(resumeData.summary || editMode) && (
            <SectionWrapper editMode={editMode}>
              <div style={s.section}>
                <div style={s.sectionTitle}>Summary</div>
                <div style={s.summary}><ML value={resumeData.summary || ''} onChange={updSummary} placeholder="Brief professional overview..." /></div>
              </div>
            </SectionWrapper>
          )}

          {/* Experience */}
          {((resumeData.experience || []).length > 0 || editMode) && (
            <SectionWrapper editMode={editMode}>
              <div style={s.section}>
                <div style={s.sectionTitle}>Experience</div>
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
            <SectionWrapper editMode={editMode}>
              <div style={s.section}>
                <div style={s.sectionTitle}>Projects</div>
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
            <SectionWrapper editMode={editMode}>
              <div style={s.section}>
                <div style={s.sectionTitle}>Education</div>
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
