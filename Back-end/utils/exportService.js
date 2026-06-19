const puppeteer = require('puppeteer');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType } = require('docx');

// ─── Template HTML Generators ────────────────────────────────────────────────

const buildClassicHTML = (data) => {
  const t = data.theme || {};
  const p = data.personalInfo || {};
  const exp = (data.experience || []).map(e => `
    <div class="exp-item">
      <div class="exp-header">
        <div>
          <div class="job-title">${e.role || ''}</div>
          <div class="company">${e.company || ''}${e.location ? ` · ${e.location}` : ''}</div>
        </div>
        <div class="dates">${e.startDate || ''}${e.endDate || e.current ? ` – ${e.current ? 'Present' : e.endDate}` : ''}</div>
      </div>
      ${e.description ? `<p class="desc">${e.description}</p>` : ''}
      ${(e.achievements || []).length ? `<ul>${e.achievements.map(a => `<li>${a}</li>`).join('')}</ul>` : ''}
    </div>
  `).join('');

  const edu = (data.education || []).map(e => `
    <div class="edu-item">
      <div class="exp-header">
        <div>
          <div class="job-title">${e.degree || ''} ${e.field ? `in ${e.field}` : ''}</div>
          <div class="company">${e.institution || ''}</div>
        </div>
        <div class="dates">${e.startDate || ''}${e.endDate ? ` – ${e.endDate}` : ''}</div>
      </div>
      ${e.gpa ? `<p class="desc">GPA: ${e.gpa}</p>` : ''}
    </div>
  `).join('');

  const skills = data.skills || {};
  const allSkills = [...(skills.technical || []), ...(skills.tools || [])];

  const projects = (data.projects || []).map(pr => `
    <div class="exp-item">
      <div class="job-title">${pr.name || ''}${pr.url ? ` <a href="${pr.url}" style="font-size:0.75rem;color:#2563eb;">[Link]</a>` : ''}</div>
      ${pr.description ? `<p class="desc">${pr.description}</p>` : ''}
      ${(pr.techStack || []).length ? `<p class="desc tech-stack"><strong>Tech:</strong> ${pr.techStack.join(', ')}</p>` : ''}
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', serif; font-size: 10pt; color: ${t.primary || '#1a1a1a'}; background: #fff; padding: 40px 50px; max-width: 800px; margin: 0 auto; }
  .name { font-size: 26pt; font-weight: bold; color: ${t.primary || '#1a1a1a'}; letter-spacing: -0.5px; }
  .job-headline { font-size: 11pt; color: #4b5563; margin-top: 4px; }
  .contact { font-size: 8.5pt; color: #4b5563; margin-top: 8px; display: flex; flex-wrap: wrap; gap: 12px; }
  .contact span { display: flex; align-items: center; gap: 3px; }
  .divider { border: none; border-top: 2px solid ${t.primary || '#1a1a1a'}; margin: 16px 0 12px; }
  .section-title { font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: ${t.primary || '#1a1a1a'}; margin-bottom: 10px; page-break-after: avoid; break-after: avoid; }
  .section { margin-bottom: 18px; }
  .summary { font-size: 9.5pt; color: #374151; line-height: 1.6; }
  .exp-item { margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid; }
  .exp-header { display: flex; justify-content: space-between; align-items: flex-start; }
  .job-title { font-size: 10pt; font-weight: bold; color: ${t.primary || '#1a1a1a'}; }
  .company { font-size: 9pt; color: #4b5563; font-style: italic; }
  .dates { font-size: 8.5pt; color: #6b7280; white-space: nowrap; margin-left: 8px; }
  .desc { font-size: 9pt; color: #374151; margin-top: 4px; line-height: 1.5; }
  ul { margin-top: 4px; margin-left: 16px; }
  li { font-size: 9pt; color: #374151; margin-bottom: 2px; line-height: 1.4; }
  .skills-grid { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill-pill { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 3px; padding: 2px 8px; font-size: 8.5pt; color: #374151; }
  .tech-stack { color: #4b5563; font-size: 8.5pt; }
  .edu-item { margin-bottom: 8px; page-break-inside: avoid; break-inside: avoid; }
  .cert-item { font-size: 9pt; color: #374151; margin-bottom: 4px; page-break-inside: avoid; break-inside: avoid; }
  a { color: #2563eb; text-decoration: none; }
</style>
</head>
<body>
  <div class="name">${p.name || 'Your Name'}</div>
  ${p.jobTitle ? `<div class="job-headline">${p.jobTitle}</div>` : ''}
  <div class="contact">
    ${p.email ? `<span>✉ ${p.email}</span>` : ''}
    ${p.phone ? `<span>📞 ${p.phone}</span>` : ''}
    ${p.location ? `<span>📍 ${p.location}</span>` : ''}
    ${p.linkedin ? `<span><a href="${p.linkedin}">LinkedIn</a></span>` : ''}
    ${p.github ? `<span><a href="${p.github}">GitHub</a></span>` : ''}
    ${p.website ? `<span><a href="${p.website}">${p.website}</a></span>` : ''}
  </div>
  <hr class="divider"/>

  ${data.summary ? `
  <div class="section">
    <div class="section-title">Professional Summary</div>
    <div class="summary">${data.summary}</div>
  </div>` : ''}

  ${exp ? `
  <div class="section">
    <div class="section-title">Experience</div>
    ${exp}
  </div>` : ''}

  ${edu ? `
  <div class="section">
    <div class="section-title">Education</div>
    ${edu}
  </div>` : ''}

  ${allSkills.length ? `
  <div class="section">
    <div class="section-title">Skills</div>
    <div class="skills-grid">${allSkills.map(s => `<span class="skill-pill">${s}</span>`).join('')}</div>
    ${(skills.soft || []).length ? `<div style="margin-top:6px;font-size:8.5pt;color:#4b5563;"><strong>Soft Skills:</strong> ${skills.soft.join(', ')}</div>` : ''}
    ${(skills.languages || []).length ? `<div style="margin-top:4px;font-size:8.5pt;color:#4b5563;"><strong>Languages:</strong> ${skills.languages.join(', ')}</div>` : ''}
  </div>` : ''}

  ${projects ? `
  <div class="section">
    <div class="section-title">Projects</div>
    ${projects}
  </div>` : ''}

  ${(data.certifications || []).length ? `
  <div class="section">
    <div class="section-title">Certifications</div>
    ${data.certifications.map(c => `<div class="cert-item">• ${c.name}${c.issuer ? ` — ${c.issuer}` : ''}${c.date ? ` (${c.date})` : ''}</div>`).join('')}
  </div>` : ''}
</body>
</html>`;
};

const buildModernHTML = (data) => {
  const t = data.theme || {};
  const p = data.personalInfo || {};
  const exp = (data.experience || []).map(e => `
    <div class="exp-item">
      <div class="exp-row">
        <div class="role-company">
          <span class="role">${e.role || ''}</span>
          <span class="company">${e.company || ''}${e.location ? `, ${e.location}` : ''}</span>
        </div>
        <span class="date-badge">${e.startDate || ''}${e.endDate || e.current ? ` – ${e.current ? 'Present' : e.endDate}` : ''}</span>
      </div>
      ${e.description ? `<p class="desc">${e.description}</p>` : ''}
      ${(e.achievements || []).length ? `<ul>${e.achievements.map(a => `<li>${a}</li>`).join('')}</ul>` : ''}
    </div>
  `).join('');

  const edu = (data.education || []).map(e => `
    <div class="edu-card">
      <div class="edu-top">
        <div><div class="edu-degree">${e.degree || ''} ${e.field ? `in ${e.field}` : ''}</div>
        <div class="edu-inst">${e.institution || ''}</div></div>
        <span class="date-badge">${e.endDate || ''}</span>
      </div>
      ${e.gpa ? `<div class="gpa">GPA: ${e.gpa}</div>` : ''}
    </div>
  `).join('');

  const skills = data.skills || {};

  const sidebar = `
    ${p.email || p.phone || p.location || p.linkedin || p.github ? `
    <div class="sidebar-section">
      <div class="sidebar-title">Contact</div>
      ${p.email ? `<div class="contact-row">✉ <span>${p.email}</span></div>` : ''}
      ${p.phone ? `<div class="contact-row">📞 <span>${p.phone}</span></div>` : ''}
      ${p.location ? `<div class="contact-row">📍 <span>${p.location}</span></div>` : ''}
      ${p.linkedin ? `<div class="contact-row">in <a href="${p.linkedin}">LinkedIn</a></div>` : ''}
      ${p.github ? `<div class="contact-row">⌥ <a href="${p.github}">GitHub</a></div>` : ''}
      ${p.website ? `<div class="contact-row">🔗 <a href="${p.website}">${p.website}</a></div>` : ''}
    </div>` : ''}

    ${(skills.technical || []).length ? `
    <div class="sidebar-section">
      <div class="sidebar-title">Technical Skills</div>
      ${skills.technical.map(s => `<div class="skill-tag">${s}</div>`).join('')}
    </div>` : ''}

    ${(skills.tools || []).length ? `
    <div class="sidebar-section">
      <div class="sidebar-title">Tools</div>
      ${skills.tools.map(s => `<div class="skill-tag">${s}</div>`).join('')}
    </div>` : ''}

    ${(skills.languages || []).length ? `
    <div class="sidebar-section">
      <div class="sidebar-title">Languages</div>
      ${skills.languages.map(s => `<div class="skill-tag">${s}</div>`).join('')}
    </div>` : ''}

    ${(data.certifications || []).length ? `
    <div class="sidebar-section">
      <div class="sidebar-title">Certifications</div>
      ${data.certifications.map(c => `<div class="cert-mini">${c.name}${c.issuer ? `<br><span style="opacity:0.75">${c.issuer}</span>` : ''}</div>`).join('')}
    </div>` : ''}
  `;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 9.5pt; color: #1e293b; background: #fff; }
  .header { background: linear-gradient(135deg, ${t.primary || '#1e40af'} 0%, ${t.secondary || '#3b82f6'} 100%); color: white; padding: 30px 40px; }
  .name { font-size: 24pt; font-weight: 800; letter-spacing: -0.5px; }
  .headline { font-size: 11pt; opacity: 0.85; margin-top: 4px; font-weight: 300; }
  .body { display: flex; min-height: calc(100% - 100px); }
  .sidebar { width: 200px; min-width: 200px; background: #f1f5f9; padding: 20px 16px; border-right: 1px solid #e2e8f0; }
  .main { flex: 1; padding: 20px 28px; }
  .sidebar-section { margin-bottom: 16px; page-break-inside: avoid; break-inside: avoid; }
  .sidebar-title { font-size: 7.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: ${t.primary || '#1e40af'}; margin-bottom: 6px; page-break-after: avoid; break-after: avoid; }
  .contact-row { font-size: 8pt; color: #475569; margin-bottom: 4px; display: flex; align-items: center; gap: 5px; word-break: break-all; }
  .contact-row a { color: #2563eb; text-decoration: none; }
  .skill-tag { background: white; border: 1px solid #bfdbfe; border-radius: 3px; padding: 2px 7px; font-size: 7.5pt; color: ${t.primary || '#1e40af'}; margin-bottom: 3px; display: inline-block; margin-right: 2px; page-break-inside: avoid; break-inside: avoid; }
  .cert-mini { font-size: 7.5pt; color: #475569; margin-bottom: 4px; line-height: 1.4; page-break-inside: avoid; break-inside: avoid; }
  .section { margin-bottom: 18px; }
  .section-title { font-size: 9pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: ${t.primary || '#1e40af'}; border-bottom: 2px solid #bfdbfe; padding-bottom: 4px; margin-bottom: 10px; page-break-after: avoid; break-after: avoid; }
  .summary { font-size: 9pt; color: #374151; line-height: 1.6; }
  .exp-item { margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid; }
  .exp-row { display: flex; justify-content: space-between; align-items: flex-start; }
  .role-company { display: flex; flex-direction: column; }
  .role { font-weight: 700; font-size: 9.5pt; color: #1e293b; }
  .company { font-size: 8.5pt; color: #64748b; }
  .date-badge { background: #dbeafe; color: ${t.primary || '#1e40af'}; padding: 1px 7px; border-radius: 10px; font-size: 7.5pt; font-weight: 600; white-space: nowrap; margin-left: 8px; }
  .desc { font-size: 8.5pt; color: #475569; margin-top: 4px; line-height: 1.5; }
  ul { margin-left: 14px; margin-top: 3px; }
  li { font-size: 8.5pt; color: #475569; margin-bottom: 2px; }
  .edu-card { margin-bottom: 8px; page-break-inside: avoid; break-inside: avoid; }
  .edu-top { display: flex; justify-content: space-between; }
  .edu-degree { font-weight: 700; font-size: 9pt; }
  .edu-inst { font-size: 8.5pt; color: #64748b; }
  .gpa { font-size: 8pt; color: #64748b; margin-top: 2px; }
  .project-item { margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid; }
  .project-name { font-weight: 700; font-size: 9pt; }
  .project-tech { font-size: 7.5pt; color: #2563eb; margin-top: 2px; }
</style>
</head>
<body>
  <div class="header">
    <div class="name">${p.name || 'Your Name'}</div>
    ${p.jobTitle ? `<div class="headline">${p.jobTitle}</div>` : ''}
  </div>
  <div class="body">
    <div class="sidebar">${sidebar}</div>
    <div class="main">
      ${data.summary ? `
      <div class="section">
        <div class="section-title">Summary</div>
        <div class="summary">${data.summary}</div>
      </div>` : ''}

      ${exp ? `
      <div class="section">
        <div class="section-title">Experience</div>
        ${exp}
      </div>` : ''}

      ${(data.projects || []).length ? `
      <div class="section">
        <div class="section-title">Projects</div>
        ${data.projects.map(pr => `
          <div class="project-item">
            <div class="project-name">${pr.name || ''}${pr.url ? ` <a href="${pr.url}" style="font-size:7.5pt;color:#2563eb;">[Link]</a>` : ''}</div>
            ${pr.description ? `<p class="desc">${pr.description}</p>` : ''}
            ${(pr.techStack || []).length ? `<div class="project-tech">🛠 ${pr.techStack.join(' · ')}</div>` : ''}
          </div>
        `).join('')}
      </div>` : ''}

      ${edu ? `
      <div class="section">
        <div class="section-title">Education</div>
        ${edu}
      </div>` : ''}
    </div>
  </div>
</body>
</html>`;
};

const buildMinimalHTML = (data) => {
  const t = data.theme || {};
  const p = data.personalInfo || {};
  const exp = (data.experience || []).map(e => `
    <div style="margin-bottom:14px; page-break-inside: avoid; break-inside: avoid;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <div style="font-weight:600;color:${t.primary || '#111111'};">${e.role || ''}</div>
        <div style="font-size:8.5pt;color:#9ca3af;">${e.startDate || ''}${e.endDate || e.current ? ` – ${e.current ? 'Present' : e.endDate}` : ''}</div>
      </div>
      <div style="font-size:8.5pt;color:#6b7280;margin-top:1px;">${e.company || ''}${e.location ? `, ${e.location}` : ''}</div>
      ${e.description ? `<p style="font-size:8.5pt;color:#4b5563;margin-top:4px;line-height:1.5;">${e.description}</p>` : ''}
      ${(e.achievements || []).length ? `<ul style="margin-left:14px;margin-top:3px;">${e.achievements.map(a => `<li style="font-size:8.5pt;color:#4b5563;margin-bottom:2px;">${a}</li>`).join('')}</ul>` : ''}
    </div>
  `).join('');

  const skills = data.skills || {};
  const allSkills = [...(skills.technical || []), ...(skills.tools || [])];

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 9.5pt; color: #374151; background: #fff; padding: 48px 56px; max-width: 800px; margin: 0 auto; }
  .name { font-size: 28pt; font-weight: 300; letter-spacing: -1px; color: ${t.primary || '#111111'}; }
  .name strong { font-weight: 700; }
  .headline { font-size: 10pt; color: #6b7280; margin-top: 4px; letter-spacing: 0.5px; }
  .contacts { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 8pt; color: #6b7280; }
  .contacts a { color: #374151; text-decoration: none; }
  .section { margin-top: 22px; }
  .section-title { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #9ca3af; margin-bottom: 10px; page-break-after: avoid; break-after: avoid; }
  .thin-line { border: none; border-top: 1px solid #f3f4f6; margin-bottom: 10px; }
  .summary { font-size: 9pt; color: #4b5563; line-height: 1.65; }
  .skill-list { display: flex; flex-wrap: wrap; gap: 5px; }
  .skill-chip { border: 1px solid #e5e7eb; border-radius: 2px; padding: 2px 9px; font-size: 7.5pt; color: #4b5563; page-break-inside: avoid; break-inside: avoid; }
  .edu-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; page-break-inside: avoid; break-inside: avoid; }
  .edu-degree { font-size: 9.5pt; font-weight: 600; color: ${t.primary || '#111111'}; }
  .edu-inst { font-size: 8.5pt; color: #6b7280; }
</style>
</head>
<body>
  <div class="name"><strong>${(p.name || 'Your Name').split(' ')[0]}</strong> ${(p.name || '').split(' ').slice(1).join(' ')}</div>
  ${p.jobTitle ? `<div class="headline">${p.jobTitle}</div>` : ''}
  <div class="contacts">
    ${p.email ? `<span>${p.email}</span>` : ''}
    ${p.phone ? `<span>${p.phone}</span>` : ''}
    ${p.location ? `<span>${p.location}</span>` : ''}
    ${p.linkedin ? `<a href="${p.linkedin}">LinkedIn</a>` : ''}
    ${p.github ? `<a href="${p.github}">GitHub</a>` : ''}
    ${p.website ? `<a href="${p.website}">${p.website}</a>` : ''}
  </div>

  ${data.summary ? `
  <div class="section">
    <div class="section-title">About</div>
    <hr class="thin-line"/>
    <div class="summary">${data.summary}</div>
  </div>` : ''}

  ${exp ? `
  <div class="section">
    <div class="section-title">Experience</div>
    <hr class="thin-line"/>
    ${exp}
  </div>` : ''}

  ${allSkills.length ? `
  <div class="section">
    <div class="section-title">Skills</div>
    <hr class="thin-line"/>
    <div class="skill-list">${allSkills.map(s => `<span class="skill-chip">${s}</span>`).join('')}</div>
    ${(skills.soft || []).length ? `<div style="margin-top:6px;font-size:8pt;color:#6b7280;">Soft: ${skills.soft.join(' · ')}</div>` : ''}
    ${(skills.languages || []).length ? `<div style="margin-top:4px;font-size:8pt;color:#6b7280;">Languages: ${skills.languages.join(' · ')}</div>` : ''}
  </div>` : ''}

  ${(data.education || []).length ? `
  <div class="section">
    <div class="section-title">Education</div>
    <hr class="thin-line"/>
    ${data.education.map(e => `
      <div class="edu-row">
        <div>
          <div class="edu-degree">${e.degree || ''} ${e.field ? `in ${e.field}` : ''}</div>
          <div class="edu-inst">${e.institution || ''}</div>
        </div>
        <div style="font-size:8.5pt;color:#9ca3af;">${e.endDate || ''}</div>
      </div>
    `).join('')}
  </div>` : ''}

  ${(data.projects || []).length ? `
  <div class="section">
    <div class="section-title">Projects</div>
    <hr class="thin-line"/>
    ${data.projects.map(pr => `
      <div style="margin-bottom:10px; page-break-inside: avoid; break-inside: avoid;">
        <div style="font-weight:600;color:${t.primary || '#111111'};font-size:9.5pt;">${pr.name || ''}${pr.url ? ` <a href="${pr.url}" style="font-size:8pt;color:#6b7280;">[↗]</a>` : ''}</div>
        ${pr.description ? `<p style="font-size:8.5pt;color:#4b5563;margin-top:3px;line-height:1.5;">${pr.description}</p>` : ''}
        ${(pr.techStack || []).length ? `<div style="font-size:7.5pt;color:#9ca3af;margin-top:3px;">${pr.techStack.join(' · ')}</div>` : ''}
      </div>
    `).join('')}
  </div>` : ''}

  ${(data.certifications || []).length ? `
  <div class="section">
    <div class="section-title">Certifications</div>
    <hr class="thin-line"/>
    ${data.certifications.map(c => `<div style="font-size:8.5pt;color:#4b5563;margin-bottom:4px; page-break-inside: avoid; break-inside: avoid;">${c.name}${c.issuer ? ` — ${c.issuer}` : ''}${c.date ? ` (${c.date})` : ''}</div>`).join('')}
  </div>` : ''}
</body>
</html>`;
};

const buildCreativeHTML = (data) => {
  const t = data.theme || {};
  const p = data.personalInfo || {};
  const exp = (data.experience || []).map(e => `
    <div class="card-item">
      <div class="card-row">
        <div>
          <div class="card-title">${e.role || ''}</div>
          <div class="card-sub">${e.company || ''}${e.location ? ` · ${e.location}` : ''}</div>
        </div>
        <span class="date-chip">${e.startDate || ''}${e.endDate || e.current ? ` – ${e.current ? 'Present' : e.endDate}` : ''}</span>
      </div>
      ${e.description ? `<p class="desc">${e.description}</p>` : ''}
      ${(e.achievements || []).length ? `<ul>${e.achievements.map(a => `<li>${a}</li>`).join('')}</ul>` : ''}
    </div>
  `).join('');

  const edu = (data.education || []).map(e => `
    <div class="card-item">
      <div class="card-row">
        <div>
          <div class="card-title">${e.degree || ''} ${e.field ? `in ${e.field}` : ''}</div>
          <div class="card-sub">${e.institution || ''}</div>
        </div>
        <span class="date-chip">${e.endDate || ''}</span>
      </div>
      ${e.gpa ? `<div class="desc">GPA: ${e.gpa}</div>` : ''}
    </div>
  `).join('');

  const skills = data.skills || {};

  const projects = (data.projects || []).map(pr => `
    <div class="card-item">
      <div class="card-title">${pr.name || ''}${pr.url ? ` <a href="${pr.url}" style="font-size:7.5pt;color:${t.secondary || '#059669'};">[↗]</a>` : ''}</div>
      ${pr.description ? `<p class="desc">${pr.description}</p>` : ''}
      ${(pr.techStack || []).length ? `<div class="tech-row">${pr.techStack.map(t => `<span class="tech-chip">${t}</span>`).join('')}</div>` : ''}
    </div>
  `).join('');

  const sideSkills = (k, label) => (skills[k] || []).length ? `
    <div class="side-section">
      <div class="side-title">${label}</div>
      <div class="skill-wrap">${(skills[k] || []).map(s => `<span class="skill-bubble">${s}</span>`).join('')}</div>
    </div>` : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 9.5pt; color: #1a1a2e; background: #fff; display: flex; min-height: 100vh; }
  .left-bar { width: 210px; min-width: 210px; background: linear-gradient(160deg, ${t.primary || '#065f46'} 0%, ${t.secondary || '#047857'} 60%, ${t.secondary || '#059669'} 100%); color: white; padding: 30px 18px; display: flex; flex-direction: column; gap: 0; }
  .av-circle { width: 60px; height: 60px; border-radius: 50%; background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; font-size: 20pt; font-weight: 800; color: white; margin-bottom: 12px; }
  .side-name { font-size: 14pt; font-weight: 800; color: white; line-height: 1.2; margin-bottom: 3px; }
  .side-role { font-size: 8pt; color: rgba(255,255,255,0.75); margin-bottom: 20px; letter-spacing: 0.3px; }
  .side-section { margin-bottom: 18px; page-break-inside: avoid; break-inside: avoid; }
  .side-title { font-size: 6.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.55); margin-bottom: 7px; page-break-after: avoid; break-after: avoid; }
  .contact-item { font-size: 7.5pt; color: rgba(255,255,255,0.85); margin-bottom: 5px; display: flex; align-items: flex-start; gap: 5px; word-break: break-all; line-height: 1.3; }
  .contact-item a { color: rgba(255,255,255,0.85); text-decoration: none; }
  .skill-wrap { display: flex; flex-wrap: wrap; gap: 3px; }
  .skill-bubble { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 20px; padding: 2px 8px; font-size: 7pt; color: rgba(255,255,255,0.9); page-break-inside: avoid; break-inside: avoid; }
  .cert-item { font-size: 7.5pt; color: rgba(255,255,255,0.8); margin-bottom: 5px; line-height: 1.4; page-break-inside: avoid; break-inside: avoid; }
  .main { flex: 1; padding: 28px 28px; overflow: hidden; }
  .section { margin-bottom: 20px; }
  .section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; page-break-after: avoid; break-after: avoid; }
  .section-dot { width: 10px; height: 10px; border-radius: 50%; background: ${t.secondary || '#059669'}; flex-shrink: 0; }
  .section-title { font-size: 9pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: ${t.primary || '#065f46'}; }
  .section-line { flex: 1; height: 1px; background: #d1fae5; }
  .summary { font-size: 9pt; color: #374151; line-height: 1.65; }
  .card-item { margin-bottom: 12px; padding: 10px 12px; border-radius: 6px; background: #f0fdf4; border-left: 3px solid ${t.secondary || '#059669'}; page-break-inside: avoid; break-inside: avoid; }
  .card-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; }
  .card-title { font-size: 9.5pt; font-weight: 700; color: ${t.primary || '#1a1a1a'}; }
  .card-sub { font-size: 8pt; color: #6b7280; }
  .date-chip { background: ${t.secondary || '#059669'}; color: white; padding: 1px 8px; border-radius: 20px; font-size: 7pt; font-weight: 700; white-space: nowrap; margin-left: 8px; }
  .desc { font-size: 8.5pt; color: #4b5563; margin-top: 4px; line-height: 1.5; }
  ul { margin-left: 14px; margin-top: 3px; }
  li { font-size: 8.5pt; color: #4b5563; margin-bottom: 2px; }
  .tech-row { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 5px; }
  .tech-chip { background: #d1fae5; color: ${t.primary || '#065f46'}; padding: 1px 7px; border-radius: 3px; font-size: 7pt; font-weight: 600; }
  a { color: ${t.secondary || '#059669'}; text-decoration: none; }
</style>
</head>
<body>
  <div class="left-bar">
    <div class="av-circle">${(p.name || 'U').charAt(0)}</div>
    <div class="side-name">${p.name || 'Your Name'}</div>
    <div class="side-role">${p.jobTitle || ''}</div>
    <div class="side-section">
      <div class="side-title">Contact</div>
      ${p.email ? `<div class="contact-item">✉ ${p.email}</div>` : ''}
      ${p.phone ? `<div class="contact-item">📞 ${p.phone}</div>` : ''}
      ${p.location ? `<div class="contact-item">📍 ${p.location}</div>` : ''}
      ${p.linkedin ? `<div class="contact-item">in <a href="${p.linkedin}">${p.linkedin.replace('https://','').replace('http://','')}</a></div>` : ''}
      ${p.github ? `<div class="contact-item">⎇ <a href="${p.github}">${p.github.replace('https://','').replace('http://','')}</a></div>` : ''}
      ${p.website ? `<div class="contact-item">🔗 <a href="${p.website}">${p.website}</a></div>` : ''}
    </div>
    ${sideSkills('technical', 'Technical')}
    ${sideSkills('tools', 'Tools')}
    ${sideSkills('soft', 'Soft Skills')}
    ${sideSkills('languages', 'Languages')}
    ${(data.certifications || []).length ? `<div class="side-section"><div class="side-title">Certifications</div>${data.certifications.map(c => `<div class="cert-item">${c.name}${c.issuer ? `<br><span style="opacity:0.7">${c.issuer}</span>` : ''}</div>`).join('')}</div>` : ''}
  </div>
  <div class="main">
    ${data.summary ? `
    <div class="section">
      <div class="section-header"><div class="section-dot"></div><div class="section-title">About Me</div><div class="section-line"></div></div>
      <div class="summary">${data.summary}</div>
    </div>` : ''}
    ${exp ? `
    <div class="section">
      <div class="section-header"><div class="section-dot"></div><div class="section-title">Experience</div><div class="section-line"></div></div>
      ${exp}
    </div>` : ''}
    ${projects ? `
    <div class="section">
      <div class="section-header"><div class="section-dot"></div><div class="section-title">Projects</div><div class="section-line"></div></div>
      ${projects}
    </div>` : ''}
    ${edu ? `
    <div class="section">
      <div class="section-header"><div class="section-dot"></div><div class="section-title">Education</div><div class="section-line"></div></div>
      ${edu}
    </div>` : ''}
  </div>
</body>
</html>`;
};

const buildExecutiveHTML = (data) => {
  const t = data.theme || {};
  const p = data.personalInfo || {};
  const exp = (data.experience || []).map(e => `
    <div class="exp-block">
      <div class="exp-head">
        <div class="exp-left">
          <div class="exp-role">${e.role || ''}</div>
          <div class="exp-company">${e.company || ''}${e.location ? ` &mdash; ${e.location}` : ''}</div>
        </div>
        <div class="exp-dates">${e.startDate || ''}${e.endDate || e.current ? ` &ndash; ${e.current ? 'Present' : e.endDate}` : ''}</div>
      </div>
      ${e.description ? `<p class="body-text">${e.description}</p>` : ''}
      ${(e.achievements || []).length ? `<ul class="ach-list">${e.achievements.map(a => `<li>${a}</li>`).join('')}</ul>` : ''}
    </div>
  `).join('');

  const edu = (data.education || []).map(e => `
    <div class="edu-block">
      <div class="exp-head">
        <div class="exp-left">
          <div class="exp-role">${e.degree || ''} ${e.field ? `in ${e.field}` : ''}</div>
          <div class="exp-company">${e.institution || ''}</div>
        </div>
        <div class="exp-dates">${e.endDate || ''}</div>
      </div>
      ${e.gpa ? `<div class="body-text">GPA: ${e.gpa}</div>` : ''}
    </div>
  `).join('');

  const skills = data.skills || {};
  const allSkills = [...(skills.technical || []), ...(skills.tools || [])];

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', 'Times New Roman', serif; font-size: 10pt; color: ${t.primary || '#1a1a1a'}; background: #fff; }
  .exec-header { background: ${t.primary || '#0f2d52'}; padding: 36px 50px; position: relative; }
  .exec-header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, ${t.secondary || '#c9a84c'}, #e8c97e, ${t.secondary || '#c9a84c'}); }
  .exec-name { font-size: 28pt; font-weight: 400; color: #ffffff; letter-spacing: 1px; font-family: 'Georgia', serif; }
  .exec-title { font-size: 11pt; color: ${t.secondary || '#c9a84c'}; margin-top: 6px; letter-spacing: 2px; text-transform: uppercase; font-family: 'Helvetica Neue', sans-serif; font-weight: 300; }
  .exec-contact { display: flex; flex-wrap: wrap; gap: 20px; margin-top: 14px; }
  .exec-contact span { font-size: 8pt; color: rgba(255,255,255,0.7); font-family: 'Helvetica Neue', sans-serif; letter-spacing: 0.3px; }
  .exec-contact a { color: ${t.secondary || '#c9a84c'}; text-decoration: none; }
  .body { padding: 32px 50px; }
  .two-col { display: grid; grid-template-columns: 1fr 220px; gap: 36px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 7.5pt; font-weight: 400; text-transform: uppercase; letter-spacing: 3px; color: ${t.primary || '#0f2d52'}; padding-bottom: 6px; border-bottom: 1px solid ${t.secondary || '#c9a84c'}; margin-bottom: 14px; font-family: 'Helvetica Neue', sans-serif; page-break-after: avoid; break-after: avoid; }
  .summary { font-size: 9.5pt; color: #374151; line-height: 1.7; }
  .exp-block { margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid; }
  .edu-block { margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid; }
  .exp-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
  .exp-left {}
  .exp-role { font-size: 10.5pt; font-weight: bold; color: ${t.primary || '#0f2d52'}; }
  .exp-company { font-size: 9pt; color: #6b7280; font-style: italic; margin-top: 1px; }
  .exp-dates { font-size: 8.5pt; color: ${t.secondary || '#c9a84c'}; white-space: nowrap; margin-left: 10px; font-family: 'Helvetica Neue', sans-serif; font-weight: 600; }
  .body-text { font-size: 9pt; color: #4b5563; margin-top: 4px; line-height: 1.55; }
  .ach-list { margin-left: 16px; margin-top: 4px; }
  .ach-list li { font-size: 9pt; color: #4b5563; margin-bottom: 2px; line-height: 1.45; }
  .side-box { }
  .side-section { margin-bottom: 20px; page-break-inside: avoid; break-inside: avoid; }
  .side-section-title { font-size: 7pt; font-weight: 400; text-transform: uppercase; letter-spacing: 2.5px; color: ${t.primary || '#0f2d52'}; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb; margin-bottom: 10px; font-family: 'Helvetica Neue', sans-serif; page-break-after: avoid; break-after: avoid; }
  .side-skill { font-size: 8.5pt; color: #374151; padding: 3px 0; border-bottom: 1px dotted #f3f4f6; line-height: 1.4; page-break-inside: avoid; break-inside: avoid; }
  .side-skill:last-child { border-bottom: none; }
  .cert-block { font-size: 8.5pt; color: #374151; margin-bottom: 6px; line-height: 1.4; page-break-inside: avoid; break-inside: avoid; }
  .proj-block { margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid; }
  .proj-name { font-size: 9.5pt; font-weight: bold; color: ${t.primary || '#0f2d52'}; }
  .proj-tech { font-size: 7.5pt; color: ${t.secondary || '#c9a84c'}; margin-top: 2px; letter-spacing: 0.3px; }
  a { color: ${t.primary || '#0f2d52'}; text-decoration: none; }
</style>
</head>
<body>
  <div class="exec-header">
    <div class="exec-name">${p.name || 'Your Name'}</div>
    ${p.jobTitle ? `<div class="exec-title">${p.jobTitle}</div>` : ''}
    <div class="exec-contact">
      ${p.email ? `<span>✉ ${p.email}</span>` : ''}
      ${p.phone ? `<span>📞 ${p.phone}</span>` : ''}
      ${p.location ? `<span>📍 ${p.location}</span>` : ''}
      ${p.linkedin ? `<span><a href="${p.linkedin}">LinkedIn</a></span>` : ''}
      ${p.github ? `<span><a href="${p.github}">GitHub</a></span>` : ''}
      ${p.website ? `<span><a href="${p.website}">${p.website}</a></span>` : ''}
    </div>
  </div>
  <div class="body">
    ${data.summary ? `
    <div class="section">
      <div class="section-title">Executive Profile</div>
      <div class="summary">${data.summary}</div>
    </div>` : ''}
    <div class="two-col">
      <div class="main-col">
        ${exp ? `
        <div class="section">
          <div class="section-title">Professional Experience</div>
          ${exp}
        </div>` : ''}
        ${(data.projects || []).length ? `
        <div class="section">
          <div class="section-title">Key Projects</div>
          ${data.projects.map(pr => `
            <div class="proj-block">
              <div class="proj-name">${pr.name || ''}${pr.url ? ` <a href="${pr.url}" style="font-size:8pt;">[Link]</a>` : ''}</div>
              ${pr.description ? `<p class="body-text">${pr.description}</p>` : ''}
              ${(pr.techStack || []).length ? `<div class="proj-tech">${pr.techStack.join(' · ')}</div>` : ''}
            </div>
          `).join('')}
        </div>` : ''}
        ${edu ? `
        <div class="section">
          <div class="section-title">Education</div>
          ${edu}
        </div>` : ''}
      </div>
      <div class="side-box">
        ${allSkills.length ? `
        <div class="side-section">
          <div class="side-section-title">Core Skills</div>
          ${allSkills.map(s => `<div class="side-skill">${s}</div>`).join('')}
        </div>` : ''}
        ${(skills.languages || []).length ? `
        <div class="side-section">
          <div class="side-section-title">Languages</div>
          ${skills.languages.map(s => `<div class="side-skill">${s}</div>`).join('')}
        </div>` : ''}
        ${(data.certifications || []).length ? `
        <div class="side-section">
          <div class="side-section-title">Certifications</div>
          ${data.certifications.map(c => `<div class="cert-block">${c.name}${c.issuer ? `<br><em style="font-size:8pt;color:#9ca3af">${c.issuer}</em>` : ''}${c.date ? ` <span style="font-size:7.5pt;color:${t.secondary || '#c9a84c'}">(${c.date})</span>` : ''}</div>`).join('')}
        </div>` : ''}
      </div>
    </div>
  </div>
</body>
</html>`;
};

// ─── Template Map ─────────────────────────────────────────────────────────────

const buildProfileClassicHTML = (data) => {
  const t = data.theme || {};
  const p = data.personalInfo || {};
  let baseHTML = buildClassicHTML(data);
  const picHTML = p.picture ? `<img src="${p.picture}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-right:20px;flex-shrink:0;" />` : '';
  baseHTML = baseHTML.replace(
    /<div class="name">.*<hr class="divider"\/>/s,
    `<div style="display:flex;align-items:center;margin-bottom:16px;">
       ${picHTML}
       <div>
         <div class="name">${p.name || 'Your Name'}</div>
         ${p.jobTitle ? `<div class="job-headline">${p.jobTitle}</div>` : ''}
         <div class="contact">
           ${p.email ? `<span>✉ ${p.email}</span>` : ''}
           ${p.phone ? `<span>📞 ${p.phone}</span>` : ''}
           ${p.location ? `<span>📍 ${p.location}</span>` : ''}
           ${p.linkedin ? `<span><a href="${p.linkedin}">LinkedIn</a></span>` : ''}
           ${p.github ? `<span><a href="${p.github}">GitHub</a></span>` : ''}
           ${p.website ? `<span><a href="${p.website}">${p.website}</a></span>` : ''}
         </div>
       </div>
     </div>
     <hr class="divider"/>`
  );
  return baseHTML;
};

const buildProfileModernHTML = (data) => {
  const t = data.theme || {};
  const p = data.personalInfo || {};
  let baseHTML = buildModernHTML(data);
  const picHTML = p.picture ? `<div style="text-align:center;margin-bottom:20px;"><img src="${p.picture}" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid white;box-shadow:0 4px 6px rgba(0,0,0,0.1);" /></div>` : '';
  baseHTML = baseHTML.replace(
    /<div class="sidebar">/,
    `<div class="sidebar">${picHTML}`
  );
  return baseHTML;
};

const buildProfileCreativeHTML = (data) => {
  const t = data.theme || {};
  const p = data.personalInfo || {};
  let baseHTML = buildCreativeHTML(data);
  if (p.picture) {
    baseHTML = baseHTML.replace(
      /<div class="av-circle">.*?<\/div>/,
      `<img src="${p.picture}" class="av-circle" style="object-fit:cover;padding:0;border:2px solid rgba(255,255,255,0.4);" />`
    );
  }
  return baseHTML;
};

const TEMPLATES = {
  'profile-classic': buildProfileClassicHTML,
  'profile-modern': buildProfileModernHTML,
  'profile-creative': buildProfileCreativeHTML,
  classic: buildClassicHTML,
  modern: buildModernHTML,
  minimal: buildMinimalHTML,
  creative: buildCreativeHTML,
  executive: buildExecutiveHTML,
};

// ─── Puppeteer PDF/JPG ────────────────────────────────────────────────────────

const getBrowser = async () => {
  return puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
};

const exportAsPdf = async (resumeData, templateId = 'classic') => {
  const htmlBuilder = TEMPLATES[templateId] || TEMPLATES.classic;
  const html = htmlBuilder(resumeData);

  const browser = await getBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
};

const exportAsJpg = async (resumeData, templateId = 'classic') => {
  const htmlBuilder = TEMPLATES[templateId] || TEMPLATES.classic;
  const html = htmlBuilder(resumeData);

  const browser = await getBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const imgBuffer = await page.screenshot({
      type: 'jpeg',
      quality: 95,
      fullPage: true,
    });
    return Buffer.from(imgBuffer);
  } finally {
    await browser.close();
  }
};

// ─── DOCX Export ─────────────────────────────────────────────────────────────

const exportAsDocx = async (resumeData, templateId = 'classic') => {
  const p = resumeData.personalInfo || {};
  const skills = resumeData.skills || {};
  const allSkills = [...(skills.technical || []), ...(skills.tools || [])];

  const t = resumeData.theme || {};
  let accentColor = '000000';
  if (t.primary) {
    accentColor = t.primary.replace('#', '');
  } else {
    accentColor = templateId.includes('modern') ? '1e40af' : templateId.includes('minimal') ? '111111' : templateId.includes('creative') ? '065f46' : templateId.includes('executive') ? '0f2d52' : '000000';
  }

  const makeHeading = (text) => new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    border: { bottom: { color: accentColor, size: 6, style: BorderStyle.SINGLE } },
    run: { color: accentColor, bold: true, size: 20 },
  });

  const sections = [];

  // Name
  sections.push(new Paragraph({
    children: [new TextRun({ text: p.name || 'Your Name', bold: true, size: 48, color: accentColor })],
    spacing: { after: 60 },
  }));

  if (p.jobTitle) {
    sections.push(new Paragraph({
      children: [new TextRun({ text: p.jobTitle, size: 24, color: '6b7280' })],
      spacing: { after: 80 },
    }));
  }

  // Contact line
  const contactParts = [p.email, p.phone, p.location, p.linkedin, p.github, p.website].filter(Boolean);
  if (contactParts.length) {
    sections.push(new Paragraph({
      children: [new TextRun({ text: contactParts.join(' | '), size: 18, color: '6b7280' })],
      spacing: { after: 120 },
    }));
  }

  // Summary
  if (resumeData.summary) {
    sections.push(makeHeading('Professional Summary'));
    sections.push(new Paragraph({ children: [new TextRun({ text: resumeData.summary, size: 20 })], spacing: { after: 100 } }));
  }

  // Experience
  if ((resumeData.experience || []).length) {
    sections.push(makeHeading('Experience'));
    for (const e of resumeData.experience) {
      sections.push(new Paragraph({
        children: [
          new TextRun({ text: e.role || '', bold: true, size: 22 }),
          new TextRun({ text: ` @ ${e.company || ''}`, size: 20, color: '6b7280' }),
          new TextRun({ text: `  ${e.startDate || ''} – ${e.current ? 'Present' : e.endDate || ''}`, size: 18, color: '9ca3af' }),
        ],
        spacing: { before: 100, after: 40 },
      }));
      if (e.description) {
        sections.push(new Paragraph({ children: [new TextRun({ text: e.description, size: 19 })], spacing: { after: 40 } }));
      }
      for (const ach of (e.achievements || [])) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: ach, size: 19 })],
          bullet: { level: 0 },
          spacing: { after: 30 },
        }));
      }
    }
  }

  // Education
  if ((resumeData.education || []).length) {
    sections.push(makeHeading('Education'));
    for (const e of resumeData.education) {
      sections.push(new Paragraph({
        children: [
          new TextRun({ text: `${e.degree || ''} in ${e.field || ''}`, bold: true, size: 22 }),
          new TextRun({ text: ` — ${e.institution || ''}`, size: 20, color: '6b7280' }),
          new TextRun({ text: `  ${e.endDate || ''}`, size: 18, color: '9ca3af' }),
        ],
        spacing: { before: 80, after: 40 },
      }));
      if (e.gpa) {
        sections.push(new Paragraph({ children: [new TextRun({ text: `GPA: ${e.gpa}`, size: 18, color: '6b7280' })], spacing: { after: 40 } }));
      }
    }
  }

  // Skills
  if (allSkills.length) {
    sections.push(makeHeading('Skills'));
    sections.push(new Paragraph({ children: [new TextRun({ text: allSkills.join(' · '), size: 19 })], spacing: { after: 60 } }));
    if ((skills.soft || []).length) {
      sections.push(new Paragraph({ children: [new TextRun({ text: `Soft Skills: ${skills.soft.join(', ')}`, size: 18, color: '6b7280' })], spacing: { after: 40 } }));
    }
    if ((skills.languages || []).length) {
      sections.push(new Paragraph({ children: [new TextRun({ text: `Languages: ${skills.languages.join(', ')}`, size: 18, color: '6b7280' })], spacing: { after: 40 } }));
    }
  }

  // Projects
  if ((resumeData.projects || []).length) {
    sections.push(makeHeading('Projects'));
    for (const pr of resumeData.projects) {
      sections.push(new Paragraph({
        children: [new TextRun({ text: pr.name || '', bold: true, size: 22 })],
        spacing: { before: 80, after: 30 },
      }));
      if (pr.description) {
        sections.push(new Paragraph({ children: [new TextRun({ text: pr.description, size: 19 })], spacing: { after: 30 } }));
      }
      if ((pr.techStack || []).length) {
        sections.push(new Paragraph({ children: [new TextRun({ text: `Tech: ${pr.techStack.join(', ')}`, size: 18, color: '6b7280' })], spacing: { after: 40 } }));
      }
    }
  }

  // Certifications
  if ((resumeData.certifications || []).length) {
    sections.push(makeHeading('Certifications'));
    for (const c of resumeData.certifications) {
      sections.push(new Paragraph({
        children: [new TextRun({ text: `${c.name}${c.issuer ? ` — ${c.issuer}` : ''}${c.date ? ` (${c.date})` : ''}`, size: 19 })],
        bullet: { level: 0 },
        spacing: { after: 30 },
      }));
    }
  }

  const doc = new Document({
    sections: [{ children: sections }],
    styles: {
      default: { document: { run: { font: 'Calibri', size: 20 } } },
    },
  });

  return Packer.toBuffer(doc);
};

// ─── Main Export Function ────────────────────────────────────────────────────

const exportResume = async (resumeData, templateId = 'classic', format = 'pdf') => {
  switch (format) {
    case 'pdf': return { buffer: await exportAsPdf(resumeData, templateId), mime: 'application/pdf', ext: 'pdf' };
    case 'jpg': return { buffer: await exportAsJpg(resumeData, templateId), mime: 'image/jpeg', ext: 'jpg' };
    case 'docx': return { buffer: await exportAsDocx(resumeData, templateId), mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' };
    default: throw new Error(`Unsupported format: ${format}`);
  }
};

const exportCoverLetterAsPdf = async (text) => {
  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Georgia', serif; font-size: 11pt; color: ${t.primary || '#1a1a1a'}; padding: 50px 60px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
      p { margin-bottom: 15px; white-space: pre-line; }
    </style>
  </head>
  <body>
    <p>${text}</p>
  </body>
  </html>`;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
};

const exportCoverLetterAsDocx = async (text) => {
  const paragraphs = text.split('\n').map(p => new Paragraph({
    children: [new TextRun({ text: p, size: 22 })],
    spacing: { after: 120 }
  }));

  const doc = new Document({
    sections: [{ children: paragraphs }],
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22 } } },
    },
  });

  return Packer.toBuffer(doc);
};

const exportCoverLetter = async (text, format = 'pdf') => {
  switch (format) {
    case 'pdf': return { buffer: await exportCoverLetterAsPdf(text), mime: 'application/pdf', ext: 'pdf' };
    case 'docx': return { buffer: await exportCoverLetterAsDocx(text), mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' };
    default: throw new Error(`Unsupported cover letter format: ${format}`);
  }
};

module.exports = {
  exportResume,
  exportCoverLetter,
  TEMPLATES,
  buildClassicHTML,
  buildModernHTML,
  buildMinimalHTML,
  buildCreativeHTML,
  buildExecutiveHTML,
  buildProfileClassicHTML,
  buildProfileModernHTML,
  buildProfileCreativeHTML,
};
