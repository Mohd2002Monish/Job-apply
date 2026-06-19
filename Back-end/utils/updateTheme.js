const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'exportService.js');
let code = fs.readFileSync(filePath, 'utf-8');

// Inject theme object extraction at the start of all build*HTML functions
const builders = [
  'buildClassicHTML', 'buildModernHTML', 'buildMinimalHTML', 'buildCreativeHTML', 'buildExecutiveHTML',
  'buildProfileClassicHTML', 'buildProfileModernHTML', 'buildProfileCreativeHTML'
];

builders.forEach(builder => {
  const regex = new RegExp(`const ${builder} = \\(data\\) => {\\n`);
  code = code.replace(regex, `const ${builder} = (data) => {\n  const t = data.theme || {};\n`);
});

// Classic: Replace #1a1a1a with ${t.primary || '#1a1a1a'}
// Limit to within buildClassicHTML and buildProfileClassicHTML by doing it generally? No, #1a1a1a might be used elsewhere.
// Actually, it's safer to just replace it globally where it matches the exact hex.
code = code.replace(/#1a1a1a/g, "${t.primary || '#1a1a1a'}");

// Modern: #1e40af -> ${t.primary || '#1e40af'}
code = code.replace(/#1e40af/g, "${t.primary || '#1e40af'}");
code = code.replace(/#3b82f6/g, "${t.secondary || '#3b82f6'}");

// Minimal: #111111 or #111 -> ${t.primary || '#111111'}
// Be careful with #111 matching #111111
code = code.replace(/#111111/g, "${t.primary || '#111111'}");
code = code.replace(/#111(?![\w])/g, "${t.primary || '#111111'}");

// Creative: #065f46 -> primary, #059669 -> secondary
code = code.replace(/#065f46/g, "${t.primary || '#065f46'}");
code = code.replace(/#059669/g, "${t.secondary || '#059669'}");
// Also update the gradient #047857 to be secondary or primary
code = code.replace(/#047857/g, "${t.secondary || '#047857'}");

// Executive: #0f2d52 -> primary, #c9a84c -> secondary
code = code.replace(/#0f2d52/g, "${t.primary || '#0f2d52'}");
code = code.replace(/#c9a84c/g, "${t.secondary || '#c9a84c'}");

// For DOCX export:
code = code.replace(/const accentColor = templateId === 'modern' \? '1e40af' : templateId === 'minimal' \? '111111' : templateId === 'creative' \? '065f46' : templateId === 'executive' \? '0f2d52' : '000000';/,
  `const t = resumeData.theme || {};
  let accentColor = '000000';
  if (t.primary) {
    accentColor = t.primary.replace('#', '');
  } else {
    accentColor = templateId.includes('modern') ? '1e40af' : templateId.includes('minimal') ? '111111' : templateId.includes('creative') ? '065f46' : templateId.includes('executive') ? '0f2d52' : '000000';
  }`
);

fs.writeFileSync(filePath, code);
console.log('Themes injected successfully.');
