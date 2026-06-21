import React from 'react';
import { TEMPLATE_TOKENS, resolveTheme } from './templateSchema.js';
import { EditableText, EditableMultiline, EditableBullets, EditableSkillChips, BlockWrapper, SectionWrapper } from '../components/InlineCVEditor.jsx';

/**
 * Minimal Template — ultra-clean, typography-first, whitespace-focused.
 */
const MinimalTemplate = ({ resumeData = {}, onUpdate, editMode = true, theme: rawTheme }) => {
  const p = resumeData.personalInfo || {};
  const t = resolveTheme('minimal', rawTheme || resumeData.theme);
  const s = TEMPLATE_TOKENS.minimal.styles(t);
  const skills = resumeData.skills || {};
  const allSkills = [...(skills.technical || []), ...(skills.tools || [])];

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

  const T = editMode ? EditableText : ({ value }) => <span>{value}</span>;
  const ML = editMode ? EditableMultiline : ({ value }) => <span style={{ whiteSpace: 'pre-wrap' }}>{value}</span>;

  const addBtn = (onClick) => editMode ? (
    <button onClick={onClick} style={{ width: '100%', padding: '5px', marginTop: '4px', background: 'transparent', border: '1px dashed #e5e7eb', borderRadius: '3px', cursor: 'pointer', fontSize: '7.5pt', color: '#9ca3af' }}>
      + Add
    </button>
  ) : null;

  const ThinLine = () => <hr style={s.thinLine} />;

  return (
    <div style={{ fontFamily: TEMPLATE_TOKENS.minimal.fontFamily, fontSize: TEMPLATE_TOKENS.minimal.fontSize, color: '#374151', background: '#fff', padding: TEMPLATE_TOKENS.minimal.bodyPadding, maxWidth: TEMPLATE_TOKENS.minimal.maxWidth, margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>

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
        <SectionWrapper editMode={editMode}>
          <div style={s.section}>
            <div style={s.sectionTitle}>About</div>
            <ThinLine />
            <div style={s.summary}><ML value={resumeData.summary || ''} onChange={updSummary} placeholder="Brief professional overview..." /></div>
          </div>
        </SectionWrapper>
      )}

      {/* Experience */}
      {((resumeData.experience || []).length > 0 || editMode) && (
        <SectionWrapper editMode={editMode}>
          <div style={s.section}>
            <div style={s.sectionTitle}>Experience</div>
            <ThinLine />
            {(resumeData.experience || []).map((exp, i) => (
              <BlockWrapper key={i} editMode={editMode} onDelete={() => removeExp(i)} onMoveUp={i > 0 ? () => moveExp(i, -1) : null} onMoveDown={i < (resumeData.experience || []).length - 1 ? () => moveExp(i, 1) : null}>
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
        <SectionWrapper editMode={editMode}>
          <div style={s.section}>
            <div style={s.sectionTitle}>Skills</div>
            <ThinLine />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '4px' }}>
              <EditableSkillChips items={[...(skills.technical || []), ...(skills.tools || [])]}
                onChange={(v) => {
                  // split first half to technical, rest to tools — simplified for minimal
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
        <SectionWrapper editMode={editMode}>
          <div style={s.section}>
            <div style={s.sectionTitle}>Education</div>
            <ThinLine />
            {(resumeData.education || []).map((edu, i) => (
              <BlockWrapper key={i} editMode={editMode} onDelete={() => removeEdu(i)}>
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
        <SectionWrapper editMode={editMode}>
          <div style={s.section}>
            <div style={s.sectionTitle}>Projects</div>
            <ThinLine />
            {(resumeData.projects || []).map((pr, i) => (
              <BlockWrapper key={i} editMode={editMode} onDelete={() => removePr(i)}>
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
      {(resumeData.certifications || []).length > 0 && (
        <SectionWrapper editMode={editMode}>
          <div style={s.section}>
            <div style={s.sectionTitle}>Certifications</div>
            <ThinLine />
            {resumeData.certifications.map((c, i) => (
              <div key={i} style={{ fontSize: '8.5pt', color: '#4b5563', marginBottom: '4px' }}>
                {c.name}{c.issuer ? ` — ${c.issuer}` : ''}{c.date ? ` (${c.date})` : ''}
              </div>
            ))}
          </div>
        </SectionWrapper>
      )}
    </div>
  );
};

export default MinimalTemplate;
