import React from 'react';
import { TEMPLATE_TOKENS, resolveTheme } from './templateSchema.js';
import { EditableText, EditableMultiline, EditableBullets, EditableSkillChips, BlockWrapper, SectionWrapper } from '../components/InlineCVEditor.jsx';

/**
 * Classic Template — Georgia serif, single-column, traditional layout.
 * Used by both the inline editor (editMode=true) and as a render-only view (editMode=false).
 */
const ClassicTemplate = ({ resumeData = {}, onUpdate, editMode = true, theme: rawTheme }) => {
  const p = resumeData.personalInfo || {};
  const t = resolveTheme('classic', rawTheme || resumeData.theme);
  const s = TEMPLATE_TOKENS.classic.styles(t);
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
  const addExp = () => {
    const arr = [...(resumeData.experience || []), { role: 'New Role', company: 'Company', startDate: '', endDate: '', current: false, location: '', description: '', achievements: [] }];
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
    const arr = [...(resumeData.education || []), { institution: 'University', degree: 'Bachelor', field: '', startDate: '', endDate: '', gpa: '' }];
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
    const arr = [...(resumeData.projects || []), { name: 'New Project', description: '', techStack: [], url: '', github: '' }];
    onUpdate?.({ projects: arr });
  };
  const removePr = (i) => {
    const arr = (resumeData.projects || []).filter((_, j) => j !== i);
    onUpdate?.({ projects: arr });
  };

  const T = editMode ? EditableText : ({ children }) => <span>{children}</span>;
  const ML = editMode ? EditableMultiline : ({ children }) => <span style={{ whiteSpace: 'pre-wrap' }}>{children}</span>;

  return (
    <div style={{ fontFamily: TEMPLATE_TOKENS.classic.fontFamily, fontSize: TEMPLATE_TOKENS.classic.fontSize, color: t.primary, background: '#fff', padding: TEMPLATE_TOKENS.classic.bodyPadding, maxWidth: TEMPLATE_TOKENS.classic.maxWidth, margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>

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
            {(p.email || editMode) && <span>✉ <T value={p.email || ''} onChange={updPI('email')} placeholder="email@example.com" /></span>}
            {(p.phone || editMode) && <span>📞 <T value={p.phone || ''} onChange={updPI('phone')} placeholder="+1 555 000" /></span>}
            {(p.location || editMode) && <span>📍 <T value={p.location || ''} onChange={updPI('location')} placeholder="City" /></span>}
            {(p.linkedin || editMode) && <span>🔗 <T value={p.linkedin || ''} onChange={updPI('linkedin')} placeholder="LinkedIn URL" /></span>}
            {(p.github || editMode) && <span>⌥ <T value={p.github || ''} onChange={updPI('github')} placeholder="GitHub URL" /></span>}
          </div>
        </div>
      </div>

      <hr style={s.divider} />

      {/* Summary */}
      {(resumeData.summary || editMode) && (
        <SectionWrapper editMode={editMode}>
          <div style={s.section}>
            <div style={s.sectionTitle}>Professional Summary</div>
            <div style={s.summary}>
              <ML value={resumeData.summary || ''} onChange={updSummary} placeholder="Brief professional overview..." />
            </div>
          </div>
        </SectionWrapper>
      )}

      {/* Experience */}
      {((resumeData.experience || []).length > 0 || editMode) && (
        <SectionWrapper editMode={editMode}>
          <div style={s.section}>
            <div style={s.sectionTitle}>Experience</div>
            {(resumeData.experience || []).map((exp, i) => (
              <BlockWrapper key={i} editMode={editMode} onDelete={() => removeExp(i)} onMoveUp={i > 0 ? () => moveExp(i, -1) : null} onMoveDown={i < (resumeData.experience || []).length - 1 ? () => moveExp(i, 1) : null}>
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
            {editMode && (
              <button onClick={addExp} style={{ width: '100%', padding: '6px', marginTop: '4px', background: 'transparent', border: '1px dashed #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '8pt', color: '#6b7280' }}>
                + Add Experience
              </button>
            )}
          </div>
        </SectionWrapper>
      )}

      {/* Education */}
      {((resumeData.education || []).length > 0 || editMode) && (
        <SectionWrapper editMode={editMode}>
          <div style={s.section}>
            <div style={s.sectionTitle}>Education</div>
            {(resumeData.education || []).map((edu, i) => (
              <BlockWrapper key={i} editMode={editMode} onDelete={() => removeEdu(i)}>
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
            {editMode && (
              <button onClick={addEdu} style={{ width: '100%', padding: '6px', marginTop: '4px', background: 'transparent', border: '1px dashed #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '8pt', color: '#6b7280' }}>
                + Add Education
              </button>
            )}
          </div>
        </SectionWrapper>
      )}

      {/* Skills */}
      {(Object.values(skills).some(v => (v || []).length > 0) || editMode) && (
        <SectionWrapper editMode={editMode}>
          <div style={s.section}>
            <div style={s.sectionTitle}>Skills</div>
            {[['technical', 'Technical'], ['tools', 'Tools & Frameworks'], ['soft', 'Soft Skills'], ['languages', 'Languages']].map(([key, label]) => (
              (skills[key]?.length > 0 || editMode) && (
                <div key={key} style={{ marginBottom: '6px' }}>
                  {editMode && <div style={{ fontSize: '7.5pt', color: '#9ca3af', marginBottom: '3px' }}>{label}</div>}
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
      {((resumeData.projects || []).length > 0 || editMode) && (
        <SectionWrapper editMode={editMode}>
          <div style={s.section}>
            <div style={s.sectionTitle}>Projects</div>
            {(resumeData.projects || []).map((pr, i) => (
              <BlockWrapper key={i} editMode={editMode} onDelete={() => removePr(i)}>
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
            {editMode && (
              <button onClick={addPr} style={{ width: '100%', padding: '6px', marginTop: '4px', background: 'transparent', border: '1px dashed #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '8pt', color: '#6b7280' }}>
                + Add Project
              </button>
            )}
          </div>
        </SectionWrapper>
      )}
    </div>
  );
};

export default ClassicTemplate;
