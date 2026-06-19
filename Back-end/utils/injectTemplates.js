const fs = require('fs');
let code = fs.readFileSync('exportService.js', 'utf-8');

const profileClassic = `
const buildProfileClassicHTML = (data) => {
  const p = data.personalInfo || {};
  let baseHTML = buildClassicHTML(data);
  const picHTML = p.picture ? \\\`<img src="\\\${p.picture}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-right:20px;flex-shrink:0;" />\\\` : '';
  
  // Wrap name, headline, contact in a flex row with the picture
  baseHTML = baseHTML.replace(
    /<div class="name">.*<hr class="divider"\\/>/s,
    \\\`<div style="display:flex;align-items:center;margin-bottom:16px;">
       \\\${picHTML}
       <div>
         <div class="name">\\\${p.name || 'Your Name'}</div>
         \\\${p.jobTitle ? \\\`<div class="job-headline">\\\${p.jobTitle}</div>\\\` : ''}
         <div class="contact">
           \\\${p.email ? \\\`<span>✉ \\\${p.email}</span>\\\` : ''}
           \\\${p.phone ? \\\`<span>📞 \\\${p.phone}</span>\\\` : ''}
           \\\${p.location ? \\\`<span>📍 \\\${p.location}</span>\\\` : ''}
           \\\${p.linkedin ? \\\`<span><a href="\\\${p.linkedin}">LinkedIn</a></span>\\\` : ''}
           \\\${p.github ? \\\`<span><a href="\\\${p.github}">GitHub</a></span>\\\` : ''}
           \\\${p.website ? \\\`<span><a href="\\\${p.website}">\\\${p.website}</a></span>\\\` : ''}
         </div>
       </div>
     </div>
     <hr class="divider"/>\\\`
  );
  return baseHTML;
};
`;

const profileModern = `
const buildProfileModernHTML = (data) => {
  const p = data.personalInfo || {};
  let baseHTML = buildModernHTML(data);
  const picHTML = p.picture ? \\\`<div style="text-align:center;margin-bottom:20px;"><img src="\\\${p.picture}" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid white;box-shadow:0 4px 6px rgba(0,0,0,0.1);" /></div>\\\` : '';
  
  // Inject picture at the top of the sidebar
  baseHTML = baseHTML.replace(
    /<div class="sidebar">/,
    \\\`<div class="sidebar">\\\${picHTML}\\\`
  );
  return baseHTML;
};
`;

const profileCreative = `
const buildProfileCreativeHTML = (data) => {
  const p = data.personalInfo || {};
  let baseHTML = buildCreativeHTML(data);
  
  if (p.picture) {
    // Replace the .av-circle with the actual image
    baseHTML = baseHTML.replace(
      /<div class="av-circle">.*?<\\/div>/,
      \\\`<img src="\\\${p.picture}" class="av-circle" style="object-fit:cover;padding:0;border:2px solid rgba(255,255,255,0.4);" />\\\`
    );
  }
  return baseHTML;
};
`;

code = code.replace('const TEMPLATES = {', \`\${profileClassic}\n\${profileModern}\n\${profileCreative}\n\nconst TEMPLATES = {\`);

code = code.replace('const TEMPLATES = {', \`const TEMPLATES = {
  'profile-classic': buildProfileClassicHTML,
  'profile-modern': buildProfileModernHTML,
  'profile-creative': buildProfileCreativeHTML,\`);

code = code.replace('buildExecutiveHTML\\n};', \`buildExecutiveHTML,
  buildProfileClassicHTML,
  buildProfileModernHTML,
  buildProfileCreativeHTML
};\`);

fs.writeFileSync('exportService.js', code);
console.log('Successfully injected profile templates.');
