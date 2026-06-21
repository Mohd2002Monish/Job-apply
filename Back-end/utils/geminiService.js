const OpenAI = require("openai");

let _openai = null;

const getGemini = () => {
  if (!_openai) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      throw new Error("GEMINI_API_KEY is not configured. Add it to your .env file.");
    }
    _openai = new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    });
  }
  return _openai;
};

/**
 * Robust JSON extraction helper for LLM outputs.
 */
const extractJson = (text) => {
  try {
    return JSON.parse(text);
  } catch (err) {
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const jsonStr = text.substring(startIdx, endIdx + 1);
      try {
        return JSON.parse(jsonStr);
      } catch (innerErr) {
        // Strip out trailing commas in arrays/objects which LLMs frequently output
        const cleaned = jsonStr
          .replace(/,\s*([\]}])/g, '$1')
          .replace(/\\n/g, ' ')
          .replace(/\r/g, '');
        try {
          return JSON.parse(cleaned);
        } catch (finalErr) {
          throw new Error(`JSON parse failed: ${innerErr.message}. Tried cleaning: ${finalErr.message}`);
        }
      }
    }
    throw err;
  }
};

/**
 * Automatically retries OpenAI completions on 429 status code with exponential backoff.
 */
const createChatCompletionWithRetry = async (params, retries = 3, delay = 2000) => {
  const contextStore = require('./contextStore');
  const contextReq = contextStore.getStore();
  const req = params.req || contextReq;
  delete params.req;
  const openai = getGemini();
  for (let i = 0; i <= retries; i++) {
    try {
      const completion = await openai.chat.completions.create(params);
      if (req && completion.usage) {
        if (!req.tokenUsage) {
          req.tokenUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
        }
        req.tokenUsage.prompt_tokens = (req.tokenUsage.prompt_tokens || 0) + (completion.usage.prompt_tokens || 0);
        req.tokenUsage.completion_tokens = (req.tokenUsage.completion_tokens || 0) + (completion.usage.completion_tokens || 0);
        req.tokenUsage.total_tokens = (req.tokenUsage.total_tokens || 0) + (completion.usage.total_tokens || 0);
      }
      return completion;
    } catch (error) {
      const isRateLimit = error.status === 429 || 
                          (error.message && error.message.includes('429')) || 
                          (error.message && error.message.toLowerCase().includes('rate limit')) ||
                          (error.message && error.message.toLowerCase().includes('too many requests'));
                          
      if (isRateLimit && i < retries) {
        console.warn(`⚠️ Gemini API 429 rate limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2.5; // exponential backoff
      } else {
        throw error;
      }
    }
  }
};

/**
 * Format resume data into a readable summary string for AI prompts.
 */
const formatResumeContext = (resumeData) => {
  if (!resumeData) return "No resume profile available.";
  
  const p = resumeData.personalInfo || {};
  const exp = (resumeData.experience || []).map(e => `- ${e.role} at ${e.company} (${e.startDate} - ${e.current ? 'Present' : e.endDate}): ${e.description}`).join('\n');
  const edu = (resumeData.education || []).map(e => `- ${e.degree} in ${e.field} from ${e.institution}`).join('\n');
  const skills = resumeData.skills || {};
  const technicalSkills = (skills.technical || []).join(', ');
  const tools = (skills.tools || []).join(', ');
  const soft = (skills.soft || []).join(', ');
  const languages = (skills.languages || []).join(', ');

  const projectsList = (resumeData.projects || []).map(pr => 
    `- ${pr.name}: ${pr.description} (Tech Stack: ${(pr.techStack || []).join(', ')})`
  ).join('\n');

  const certsList = (resumeData.certifications || []).map(c => 
    `- ${c.name} by ${c.issuer} (${c.date})`
  ).join('\n');

  const awardsList = (resumeData.awards || []).join(', ');

  return `Candidate Name: ${p.name || 'Mohd Monish'}
Job Title: ${p.jobTitle || 'Full Stack Developer'}
Email: ${p.email || ''}
Location: ${p.location || ''}
Professional Summary: ${resumeData.summary || ''}

Work Experience:
${exp}

Education:
${edu}

Projects:
${projectsList || 'None specified'}

Certifications:
${certsList || 'None specified'}

Technical Skills: ${technicalSkills}
Tools & Frameworks: ${tools}
Soft Skills: ${soft}
Languages: ${languages}
Awards: ${awardsList || 'None specified'}`;
};

/**
 * Generate a tailored application email body.
 */
const generateEmailContent = async (job, resumeData) => {
  try {
    const openai = getGemini();
    const candidateContext = formatResumeContext(resumeData);

    const prompt = `Write a short, professional, and concise job application email. The tone should be formal, confident, and approachable. Use natural everyday English with a professional tone.

Here is the Candidate's Resume Profile:
${candidateContext}

Here is the target Job Post:
Job Title: ${job.job}
Job Description: ${job.description}

Requirements for the email:
1. A polite greeting and brief context — confirming interest in the ${job.job} position.
2. A line summarizing candidate's relevant background and expressing genuine interest in the opportunity.
3. Naturally connect how the candidate's experience, education, and skills align with the job requirements.
4. Express enthusiasm for potential next steps — open to further discussion or interviews.
5. A warm and professional closing, signed with the candidate's name.

Return ONLY the email body. Do not include a subject line, Markdown formatting, or extra text. Keep it tight and professional.`;

    const completion = await createChatCompletionWithRetry({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating email content with Gemini:", error.message);
    return null;
  }
};

/**
 * Calculate ATS score and analyze keywords match.
 */
const generateAtsScore = async (jobDescription, resumeData) => {
  try {
    const openai = getGemini();
    const candidateContext = formatResumeContext(resumeData);

    // Truncate inputs to prevent exceeding token limits on the gateway
    const safeJd = (jobDescription || '').slice(0, 2500);
    const safeResume = (candidateContext || '').slice(0, 3000);

    const prompt = `Perform a comprehensive ATS (Applicant Tracking System) scan comparing the candidate's resume profile against the job description.

Candidate Resume Profile:
${safeResume}

Target Job Description:
${safeJd}

You MUST return a JSON object containing the analysis. Return ONLY the JSON object. Do not include comments or markdown.
The JSON must follow this exact schema:
{
  "score": 85,
  "matchSummary": "A concise summary of how well the candidate fits the requirements.",
  "matchingKeywords": ["React.js", "Node.js"],
  "missingKeywords": ["Docker", "AWS"],
  "suggestions": ["Add experience with Docker containerization...", "Incorporate AWS cloud deployment details..."]
}

Rules:
- Crucial: Ensure all double quotes inside string values are properly escaped (e.g. use \\" for internal quotes) so that the output remains a valid JSON string.
- Crucial: Do not include literal unescaped newlines or backslashes in string values. Use \\n for newlines.`;

    const completion = await createChatCompletionWithRetry({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const cleanContent = completion.choices[0].message.content.trim();
    // Strip markdown code block wrappers if any
    const jsonString = cleanContent.replace(/^```json/i, '').replace(/```$/, '').trim();
    try {
      return extractJson(jsonString);
    } catch (parseErr) {
      console.error("Raw Gemini output that failed parsing:\n", cleanContent);
      throw parseErr;
    }
  } catch (error) {
    console.error("Error generating ATS score with Gemini:", error.message);
    try {
      require('fs').writeFileSync(require('path').join(__dirname, '..', 'error_ats.log'), error.stack || error.message);
    } catch (_) {}
    return {
      score: 0,
      matchSummary: "Failed to run ATS analysis due to system error.",
      matchingKeywords: [],
      missingKeywords: [],
      suggestions: ["Ensure Gemini API key is correctly configured."]
    };
  }
};

/**
 * Generate a full cover letter.
 */
const generateCoverLetter = async (job, resumeData) => {
  try {
    const openai = getGemini();
    const candidateContext = formatResumeContext(resumeData);
    const salutation = job.hrName
      ? `Dear ${job.hrName},`
      : 'Dear Hiring Manager,';

    const prompt = `Write a formal and professional cover letter (about 300 words) tailored to the job posting.

${job.hrName ? `The hiring manager's name is ${job.hrName}. Use this for the salutation.` : ''}
${job.companyName ? `The company is ${job.companyName}.` : ''}

Candidate Resume Profile:
${candidateContext}

Target Job:
Job Title: ${job.job}
Job Description: ${job.description}

Start with the salutation: "${salutation}"
The cover letter should contain 3 structured body paragraphs linking the candidate's achievements to the company's needs, and a professional closing.
If the candidate's resume profile has limited info, elaborate on standard full-stack/MERN developer skills, clean code practices, and system optimizations relevant to the role to meet the target length.

Return ONLY the cover letter body. Do not include markdown headers or code block formatting.`;

    const completion = await createChatCompletionWithRetry({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating cover letter with Gemini:", error.message);
    return "Failed to generate cover letter.";
  }
};

/**
 * Generate follow-up email thread reply.
 */
const generateFollowUpEmail = async (job, originalEmail, resumeData) => {
  try {
    const openai = getGemini();
    const candidateName = resumeData?.personalInfo?.name || 'Mohd Monish';

    const prompt = `Write a brief, polite, and professional follow-up email. This will be sent as a reply to a previous job application email.

Original Applied Job: ${job.job}
Original Email Sent:
"${originalEmail}"

Requirements:
1. Polite greeting.
2. Ask if there has been any update on my application.
3. Keep it extremely brief (max 3-4 sentences) and professional.
4. Sign off with my name: ${candidateName}.

Return ONLY the follow-up email body. Do not include a subject line or extra text.`;

    const completion = await createChatCompletionWithRetry({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating follow-up email with Gemini:", error.message);
    return null;
  }
};

/**
 * Generate a fully customizable cover letter with user-defined options.
 */
const generateCustomCoverLetter = async ({ jobTitle, hrName, companyName, description, wordCount = 300, industry = 'Technology', tone = 'Professional', customInstructions = '' }, resumeData) => {
  try {
    const openai = getGemini();
    const candidateContext = formatResumeContext(resumeData);

    const toneGuide = {
      Professional: 'formal, well-structured, and business-appropriate',
      Confident: 'assertive, achievement-oriented, and direct — highlight measurable results',
      Creative: 'engaging, slightly unique, show personality while remaining professional',
      Executive: 'authoritative, results-focused, and commanding — suitable for senior roles',
      Friendly: 'warm, approachable, and conversational while remaining professional',
    };

    const salutation = hrName ? `Dear ${hrName},` : 'Dear Hiring Manager,';

    const prompt = `Write a ${tone} cover letter of approximately ${wordCount} words for a ${jobTitle} position${companyName ? ` at ${companyName}` : ''} in the ${industry} industry.

Tone: ${toneGuide[tone] || 'professional and clear'}

${hrName ? `The hiring manager's name is ${hrName}. Start with the salutation: "${salutation}"` : `Start with the salutation: "${salutation}"`}
${companyName ? `The company is: ${companyName}` : ''}

Candidate Resume Profile:
${candidateContext}

Job Description:
${description}

${customInstructions ? `Additional instructions from the candidate: ${customInstructions}` : ''}

Requirements:
- Target length: approximately ${wordCount} words. You MUST write multiple paragraphs (e.g. 3-4 paragraphs) to reach this length, do not write a single-sentence or very short note.
- Include: salutation, opening hook, 2-3 detailed body paragraphs connecting the candidate's experience to the job requirements, a strong closing with call-to-action, and a professional sign-off.
- If the candidate's resume profile has limited info, elaborate on standard full-stack/MERN developer skills, clean code practices, and system optimizations relevant to the role to meet the target length.
- If company name is provided, reference it naturally in the letter.
- Return ONLY the cover letter body text. No markdown, no code blocks, no extra commentary.`;

    const completion = await createChatCompletionWithRetry({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.75
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating custom cover letter with Gemini:", error.message);
    return "Failed to generate cover letter. Please try again.";
  }
};

/**
 * Extract structured job info from raw text (from PDF, DOCX, or image OCR).
 * Uses Gemini to identify: jobTitle, hrName, hrEmail, companyName, description.
 */
const extractJobInfoFromText = async (rawText) => {
  try {
    const openai = getGemini();

    const prompt = `You are an expert at extracting structured information from job postings and HR documents.

The following text was extracted from a job posting file (could be a PDF, DOCX, or a LinkedIn screenshot). Extract the key information and return it as a JSON object.

Extracted Text:
${rawText.slice(0, 8000)}

Return a JSON object with exactly these fields:
{
  "jobTitle": "the job title or role name, or null if not clearly found",
  "hrName": "the full name of the recruiter, hiring manager, or HR contact person, or null if not found",
  "hrEmail": "the contact or HR email address (format: xxx@xxx.xxx), or null if not found",
  "companyName": "the company or organization name, or null if not found",
  "description": "the complete job description including responsibilities, requirements, and qualifications. Clean up OCR artifacts and formatting issues."
}

Important rules:
- For hrName: Look for names next to 'Hiring Manager', 'Recruiter', 'Posted by', 'Contact', or LinkedIn profile names at the top of the page
- For hrEmail: Only return valid email format strings. If multiple emails found, return the most likely HR/contact one
- For jobTitle: Look for 'Position:', 'Role:', 'Job Title:', or the most prominent heading
- For companyName: Look for 'Company:', 'Organization:', 'at [Company]', or from context
- For description: Include all requirements, responsibilities, and qualifications. Remove excessive whitespace but keep structure
- All fields can be null if the information genuinely isn't present in the text
- Return ONLY valid JSON, no markdown, no extra text`;

    const completion = await createChatCompletionWithRetry({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content.trim();
    const jsonStr = content.replace(/^```json/i, '').replace(/```$/, '').trim();
    return extractJson(jsonStr);
  } catch (error) {
    console.error("Error extracting job info from text:", error.message);
    // Return raw text as description fallback
    return {
      jobTitle: null,
      hrName: null,
      hrEmail: null,
      companyName: null,
      description: rawText
    };
  }
};

/**
 * STEP 1 — JD Analysis.
 * Extract structured requirements from a raw job description text.
 */
const analyzeJobDescription = async (jdText) => {
  const prompt = `You are an ATS recruiter.

Analyze the following job description and extract structured information.

Return JSON only. No markdown, no extra text.

{
  "jobTitle": "",
  "requiredSkills": [],
  "preferredSkills": [],
  "tools": [],
  "frameworks": [],
  "softSkills": [],
  "responsibilities": [],
  "keywords": []
}

Job Description:
${jdText.slice(0, 5000)}`;

  const completion = await createChatCompletionWithRetry({
    model: "gemini-2.5-flash",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    response_format: { type: "json_object" }
  });

  const raw = completion.choices[0].message.content.trim().replace(/^```json/i, '').replace(/```$/, '').trim();
  return extractJson(raw);
};

/**
 * STEP 2 — Resume Gap Analysis.
 * Compare resume against JD analysis to find gaps — analysis only, no rewriting.
 */
const analyzeResumeGap = async (resumeData, jdAnalysis) => {
  const resumeContext = formatResumeContext(resumeData);

  const prompt = `You are an ATS optimization expert.

Compare the resume and job description analysis.

Rules:
- Do not rewrite anything.
- Do not generate a new resume.
- Only analyze and identify gaps.

Identify:
1. Matching skills
2. Missing skills (present in JD but absent in resume)
3. Weakly represented skills (mentioned but not elaborated)
4. Experience entries that should be emphasized
5. Projects that should be emphasized
6. Keywords already present in the resume
7. Keywords missing from the resume

Return JSON only. No markdown, no extra text.

{
  "matchingSkills": [],
  "missingSkills": [],
  "weakSkills": [],
  "experienceToHighlight": [],
  "projectsToHighlight": [],
  "presentKeywords": [],
  "missingKeywords": []
}

Resume:
${resumeContext.slice(0, 3000)}

JD Analysis:
${JSON.stringify(jdAnalysis).slice(0, 2000)}`;

  const completion = await createChatCompletionWithRetry({
    model: "gemini-2.5-flash",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    response_format: { type: "json_object" }
  });

  const raw = completion.choices[0].message.content.trim().replace(/^```json/i, '').replace(/```$/, '').trim();
  return extractJson(raw);
};

/**
 * STEP 5 — Keyword Suggestions.
 * Analyze a tailored resume and return keyword strength ratings and actionable recommendations.
 */
const generateKeywordSuggestions = async (tailoredResume, jdAnalysis) => {
  const resumeContext = formatResumeContext(tailoredResume);

  const prompt = `Analyze the tailored resume against the job description keywords.

Identify:
1. Strong keywords (present and well-represented in the resume)
2. Missing keywords (present in JD but absent in resume)
3. Specific actionable recommendations to add more missing context

Return JSON only.

{
  "strongKeywords": [],
  "missingKeywords": [],
  "recommendations": []
}

Tailored Resume:
${resumeContext.slice(0, 2500)}

JD Keywords:
${JSON.stringify(jdAnalysis?.keywords || [])}`;

  const completion = await createChatCompletionWithRetry({
    model: "gemini-2.5-flash",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    response_format: { type: "json_object" }
  });

  const raw = completion.choices[0].message.content.trim().replace(/^```json/i, '').replace(/```$/, '').trim();
  return extractJson(raw);
};

/**
 * Build a Skill Evidence Map from the resume to prevent AI from claiming skills
 * not evidenced anywhere in the candidate's experience, projects, or skills sections.
 */
const buildSkillEvidenceMap = (resumeData) => {
  const map = {};

  const addEvidence = (skill, source) => {
    const key = skill.trim().toLowerCase();
    if (!map[key]) map[key] = [];
    if (!map[key].includes(source)) map[key].push(source);
  };

  // From skills sections
  const allSkills = [
    ...(resumeData?.skills?.technical || []),
    ...(resumeData?.skills?.tools || []),
    ...(resumeData?.skills?.soft || []),
    ...(resumeData?.skills?.languages || [])
  ];
  allSkills.forEach(s => addEvidence(s, 'Skills Section'));

  // From experience descriptions
  (resumeData?.experience || []).forEach(exp => {
    const text = `${exp.description || ''} ${(exp.achievements || []).join(' ')}`;
    allSkills.forEach(s => {
      if (text.toLowerCase().includes(s.toLowerCase())) {
        addEvidence(s, exp.company || 'Work Experience');
      }
    });
  });

  // From projects
  (resumeData?.projects || []).forEach(proj => {
    (proj.techStack || []).forEach(s => addEvidence(s, proj.name || 'Project'));
  });

  return map;
};

/**
 * STEP 4 — Deterministic ATS Scoring (no AI).
 * Skills 40% + Experience 30% + Keywords 20% + Education 10% = 100
 */
const calculateDeterministicAtsScore = (resumeData, jdAnalysis) => {
  if (!jdAnalysis || !resumeData) return { score: 0, breakdown: {} };

  const resumeSkills = [
    ...(resumeData?.skills?.technical || []),
    ...(resumeData?.skills?.tools || []),
    ...(resumeData?.skills?.soft || [])
  ].map(s => s.toLowerCase());

  const requiredSkills = [
    ...(jdAnalysis.requiredSkills || []),
    ...(jdAnalysis.tools || []),
    ...(jdAnalysis.frameworks || [])
  ].map(s => s.toLowerCase());

  // Skills score (40pts)
  let skillsScore = 0;
  if (requiredSkills.length > 0) {
    const matched = requiredSkills.filter(s => resumeSkills.some(rs => rs.includes(s) || s.includes(rs)));
    skillsScore = Math.round((matched.length / requiredSkills.length) * 40);
  } else {
    skillsScore = 30; // no required skills listed — partial credit
  }

  // Experience score (30pts)
  const hasExperience = (resumeData?.experience || []).length > 0;
  const responsibilities = (jdAnalysis.responsibilities || []).map(r => r.toLowerCase());
  const expText = (resumeData?.experience || []).map(e =>
    `${e.description || ''} ${(e.achievements || []).join(' ')}`
  ).join(' ').toLowerCase();
  let expMatchCount = 0;
  if (responsibilities.length > 0) {
    expMatchCount = responsibilities.filter(r => {
      const words = r.split(' ').filter(w => w.length > 4);
      return words.some(w => expText.includes(w));
    }).length;
    const expScore = Math.round((expMatchCount / responsibilities.length) * 30);
    skillsScore = skillsScore; // keep
    var experienceScore = Math.min(30, expScore + (hasExperience ? 5 : 0));
  } else {
    var experienceScore = hasExperience ? 25 : 0;
  }

  // Keywords score (20pts)
  const keywords = (jdAnalysis.keywords || []).map(k => k.toLowerCase());
  const fullResumeText = formatResumeContext(resumeData).toLowerCase();
  let keywordScore = 0;
  if (keywords.length > 0) {
    const matchedKw = keywords.filter(k => fullResumeText.includes(k));
    keywordScore = Math.round((matchedKw.length / keywords.length) * 20);
  } else {
    keywordScore = 15;
  }

  // Education score (10pts)
  const hasEducation = (resumeData?.education || []).length > 0;
  const educationScore = hasEducation ? 10 : 0;

  const total = Math.min(100, skillsScore + experienceScore + keywordScore + educationScore);

  return {
    score: total,
    breakdown: {
      skills: skillsScore,
      experience: experienceScore,
      keywords: keywordScore,
      education: educationScore
    }
  };
};

/**
 * STEP 3 — Tailored Resume Generator (upgraded to 3-step chain).
 * Tailor/optimize resume data structure to match the job description and hit a high ATS score.
 */
const tailorResumeData = async (jobDescription, resumeData) => {
  try {
    console.log('🔍 Step 1: Analyzing job description...');
    const jdAnalysis = await analyzeJobDescription(jobDescription);

    console.log('📊 Step 2: Running resume gap analysis...');
    const gapAnalysis = await analyzeResumeGap(resumeData, jdAnalysis);

    // Build skill evidence map to prevent hallucination
    const skillEvidenceMap = buildSkillEvidenceMap(resumeData);
    const evidencedSkills = Object.keys(skillEvidenceMap);

    console.log('✍️ Step 3: Generating tailored resume...');

    const prompt = `You are a senior ATS resume optimization expert.

Your task is to optimize a resume for a specific job description.

CRITICAL RULES — You MUST follow these strictly:
- NEVER invent new skills, technologies, companies, projects, certifications, degrees, years of experience, or responsibilities.
- ONLY use information already present in the candidate's resume.
- The candidate's evidenced skills are: ${evidencedSkills.join(', ')}. Do NOT add any skill not in this list.
- You MAY: reorder sections, rewrite bullet points, improve wording, move relevant skills higher, prioritize matching projects, highlight matching experience, rewrite summaries, and improve keyword alignment.

Objective: Maximize ATS compatibility while remaining 100% truthful.

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

CURRENT RESUME (JSON):
${JSON.stringify(resumeData).slice(0, 4000)}

GAP ANALYSIS:
${JSON.stringify(gapAnalysis).slice(0, 2000)}

Optimization priorities:
1. Rewrite professional summary to match the job title and key requirements.
2. Move most relevant skills to top of each skills list.
3. Rewrite experience bullet points using recruiter language that matches the JD.
4. Prioritize and rewrite projects that overlap with job requirements.
5. Emphasize matching technologies naturally in descriptions.
6. Preserve all factual information — company names, dates, degrees, locations.

Return ONLY a valid JSON object. No markdown, no extra text. Use this exact schema:
{
  "personalInfo": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "", "github": "", "website": "", "jobTitle": "" },
  "summary": "",
  "experience": [{ "company": "", "role": "", "startDate": "", "endDate": "", "current": false, "location": "", "description": "", "achievements": [] }],
  "education": [{ "institution": "", "degree": "", "field": "", "startDate": "", "endDate": "", "gpa": "", "location": "" }],
  "skills": { "technical": [], "soft": [], "languages": [], "tools": [] },
  "certifications": [{ "name": "", "issuer": "", "date": "", "url": "" }],
  "projects": [{ "name": "", "description": "", "techStack": [], "url": "", "github": "" }],
  "awards": []
}`;

    const completion = await createChatCompletionWithRetry({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.25,
      response_format: { type: "json_object" }
    });

    const cleanContent = completion.choices[0].message.content.trim();
    const jsonString = cleanContent.replace(/^```json/i, '').replace(/```$/, '').trim();
    const tailoredData = extractJson(jsonString);

    // Attach metadata for callers to use
    tailoredData._jdAnalysis = jdAnalysis;
    tailoredData._gapAnalysis = gapAnalysis;

    return tailoredData;
  } catch (error) {
    console.error("Error tailoring resume data with Gemini:", error.message);
    throw error;
  }
};

/**
 * Generates structured interview prep questions based on job description and resume.
 */
const generateInterviewPrepQuestions = async (jobDescription, resumeData) => {
  const resumeContext = formatResumeContext(resumeData);

  const prompt = `
You are an expert career coach specializing in technical interview preparation.

Based on the following job description and candidate's resume, generate exactly 8 targeted interview questions.
Return a JSON object with a "questions" array. Each question should have:
- "question": the interview question text
- "type": one of "Technical", "Behavioral", or "Situational"
- "suggestedPoints": 2-3 bullet points on what a great answer should cover (as a single string with newlines)

Mix the types: include at least 3 Technical, 2 Behavioral, and 2 Situational questions.
Focus on the specific tech stack and role requirements mentioned in the JD.

JOB DESCRIPTION:
${jobDescription.substring(0, 3000)}

CANDIDATE RESUME:
${resumeContext.substring(0, 2000)}

Return only valid JSON.
`;

  try {
    const completion = await createChatCompletionWithRetry({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const cleanContent = completion.choices[0].message.content.trim();
    const jsonString = cleanContent.replace(/^```json/i, '').replace(/```$/, '').trim();
    return extractJson(jsonString);
  } catch (error) {
    console.error("Error generating interview prep questions:", error.message);
    throw error;
  }
};

/**
 * Evaluates a candidate's interview answer and returns AI feedback with a score.
 */
const evaluateInterviewAnswer = async (question, userNotes, jobDescription) => {
  const prompt = `
You are an expert technical interviewer providing honest, constructive feedback.

Evaluate the following interview answer. Return a JSON object with:
- "score": a number from 1-10 rating the quality of this answer
- "aiFeedback": a 2-3 sentence constructive critique explaining the score, what was good, and what could be improved
- "improvedVersion": a brief (1 paragraph) example of a stronger version of this answer

QUESTION: ${question}

CANDIDATE'S ANSWER:
${userNotes || "(No answer provided yet)"}

JOB CONTEXT:
${jobDescription.substring(0, 1000)}

Return only valid JSON.
`;

  try {
    const completion = await createChatCompletionWithRetry({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      response_format: { type: "json_object" }
    });

    const cleanContent = completion.choices[0].message.content.trim();
    const jsonString = cleanContent.replace(/^```json/i, '').replace(/```$/, '').trim();
    return extractJson(jsonString);
  } catch (error) {
    console.error("Error evaluating interview answer:", error.message);
    throw error;
  }
};

/**
 * Generates a smart reply draft to a recruiter message using AI.
 */
const suggestRecruiterReply = async (recruiterMessage, jobTitle, companyName, resumeData) => {
  const resumeContext = formatResumeContext(resumeData);

  const prompt = `
You are helping a job candidate draft a professional reply to a recruiter email.

Write a professional, concise reply (3-5 sentences) to the recruiter's message below.
The candidate is applying for the ${jobTitle} role at ${companyName}.
Maintain a confident, enthusiastic but professional tone.

RECRUITER'S MESSAGE:
${recruiterMessage}

CANDIDATE BACKGROUND (for context):
${resumeContext.substring(0, 1000)}

Return a JSON object with:
- "suggestedReply": the full reply email text (just the body, no subject line)
- "subject": a fitting reply subject line
`;

  try {
    const completion = await createChatCompletionWithRetry({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      response_format: { type: "json_object" }
    });

    const cleanContent = completion.choices[0].message.content.trim();
    const jsonString = cleanContent.replace(/^```json/i, '').replace(/```$/, '').trim();
    return extractJson(jsonString);
  } catch (error) {
    console.error("Error suggesting recruiter reply:", error.message);
    throw error;
  }
};

/**
 * Uses Gemini API with Search Grounding to find salary benchmarks
 * and draft a custom counter-offer email based on the candidate resume.
 */
const getSalaryBenchmarksWithGrounding = async ({ jobTitle, location, companyName, resumeData, offeredSalary, targetSalary, currency = 'USD' }) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const candidateContext = formatResumeContext(resumeData);
    const searchLocation = location || 'United States';
    const searchQuery = `${jobTitle} salary benchmarks in ${searchLocation} 2025 2026`;

    const systemPrompt = `You are a salary negotiation expert.
Perform web-grounded research to find salary benchmarks (low, average, high) for the role of "${jobTitle}" in "${searchLocation}".
Compare the target salary and offered salary to determine negotiation viability.
Analyze the candidate's resume to identify key value propositions (like years of experience, specific MERN skills, high-impact projects, certifications) that justify a higher counter-offer.
Generate a professional, persuasive counter-offer email to the HR/Hiring Manager at "${companyName || 'the company'}".

IMPORTANT: You must return ONLY a JSON object. Do not include markdown code block formatting (like \`\`\`json) or any extra conversational text. The response must be a single parseable JSON object following this schema:
{
  "benchmarks": {
    "low": 90000,
    "average": 115000,
    "high": 140000,
    "currency": "USD",
    "marketInsights": "According to market research..."
  },
  "talkingPoints": [
    "Highlight specific technical proficiency...",
    "Reference matching project outcomes..."
  ],
  "emailDraft": "Dear Hiring Manager,\\n\\nThank you for the offer... I am writing to discuss the compensation..."
}

Ensure all JSON rules are strictly followed. Avoid trailing commas and ensure string values use escaped double quotes when needed.`;

    const userPrompt = `
Search Query: ${searchQuery}
Offered Salary: ${offeredSalary ? `${offeredSalary} ${currency}` : 'Not specified'}
Target Salary: ${targetSalary ? `${targetSalary} ${currency}` : 'Not specified'}
Company Name: ${companyName || 'the company'}

Candidate Resume Details:
${candidateContext.substring(0, 3000)}

Please execute the search and compile the grounding-aware response in the specified JSON structure.
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
        }],
        tools: [{
          googleSearch: {}
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini grounding request failed: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("No response content from Gemini.");
    }

    const sources = [];
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata && groundingMetadata.groundingChunks) {
      groundingMetadata.groundingChunks.forEach(chunk => {
        if (chunk.web && chunk.web.uri) {
          sources.push({
            title: chunk.web.title || chunk.web.uri,
            url: chunk.web.uri
          });
        }
      });
    }

    const uniqueSources = [];
    const seenUrls = new Set();
    sources.forEach(s => {
      if (!seenUrls.has(s.url)) {
        seenUrls.add(s.url);
        uniqueSources.push(s);
      }
    });

    const parsedJson = extractJson(rawText.trim().replace(/^```json/i, '').replace(/```$/, '').trim());
    
    if (!parsedJson.benchmarks) {
      parsedJson.benchmarks = {
        low: offeredSalary ? Math.round(offeredSalary * 0.9) : 80000,
        average: offeredSalary ? Math.round(offeredSalary * 1.1) : 100000,
        high: offeredSalary ? Math.round(offeredSalary * 1.3) : 120000,
        currency: currency || 'USD',
        marketInsights: "Fallback salary guidelines based on general negotiation frameworks."
      };
    }
    
    parsedJson.sources = uniqueSources.slice(0, 5);
    return parsedJson;
  } catch (error) {
    console.error("Error in getSalaryBenchmarksWithGrounding:", error.message);
    throw error;
  }
};

/**
 * Evaluates a candidate's spoken interview answer, assessing content, structure, and delivery metrics.
 */
const evaluateSpokenInterviewAnswer = async ({ question, transcript, jobDescription, pacingWpm, durationSeconds, fillerCount }) => {
  const prompt = `
You are an expert mock interview coach and delivery analyst.
Evaluate the candidate's spoken response to the interview question below.

Context:
- Interview Question: "${question}"
- Job Description Context:
${jobDescription.substring(0, 1500)}

Spoken Delivery Metrics (provided by client-side analysis):
- Pacing: ${pacingWpm} Words Per Minute (optimal: 110 - 160 WPM)
- Duration: ${durationSeconds} seconds
- Filler Words Detected: ${JSON.stringify(fillerCount)}

Candidate Spoken Transcript:
"${transcript || '(No speech transcribed)'}"

Based on the transcript and metrics, generate a comprehensive evaluation.
You MUST return ONLY a parseable JSON object with the following structure:
{
  "score": 8,
  "breakdown": {
    "content": 8,
    "structure": 7,
    "delivery": 9
  },
  "aiFeedback": "Your content covers the required MERN components well, but your pacing is slightly fast...",
  "fillerAnalysis": "You used 'um' 3 times and 'like' 2 times. Try pausing instead of using fillers.",
  "improvedVersion": "Here is a refined version of your answer that sounds polished..."
}

Rules:
- Do not include markdown code block formatting (like \`\`\`json) or extra text.
- Ensure all double quotes inside string values are properly escaped.
`;

  try {
    const openai = getGemini();
    const completion = await createChatCompletionWithRetry({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      response_format: { type: "json_object" }
    });

    const cleanContent = completion.choices[0].message.content.trim();
    const jsonString = cleanContent.replace(/^```json/i, '').replace(/```$/, '').trim();
    return extractJson(jsonString);
  } catch (error) {
    console.error("Error evaluating spoken interview answer:", error.message);
    throw error;
  }
};

/**
 * Map scraped form fields to candidate resume details using Gemini.
 */
const mapFieldsForFormFill = async (scrapedFields, resumeData) => {
  const resumeContext = formatResumeContext(resumeData);
  const prompt = `You are an AI assistant that maps form fields from a job application to a candidate's resume details.

Candidate Resume Data:
${resumeContext}

Job Application Fields:
${JSON.stringify(scrapedFields, null, 2)}

For each job application field, determine the most appropriate value from the candidate's resume details to populate this field.
Guidelines:
1. If the field is a select dropdown (type: select), choose the exact option value (or option text if value is empty) from the provided 'options' list that matches the candidate's background. If none match, choose the best matching option or empty string "".
2. If the field is a file input (type: file) and is looking for a resume, set mappedValue to "[RESUME_FILE]".
3. If the field is a file input (type: file) and is looking for a cover letter, set mappedValue to "[COVER_LETTER_FILE]".
4. If the field is about work authorization, gender, race, or veteran status, select the best fitting option if present in resume, or leave empty if sensitive/not specified.
5. If no mapping can be found in the resume, set mappedValue to "".
6. Assign a confidence score from 0 to 100 for this mapping decision.
7. Provide a short reason explaining your decision.

You MUST return ONLY a parseable JSON array of objects. Each object MUST have this exact structure:
[
  {
    "id": "field id or unique string",
    "name": "field name attribute",
    "label": "field label or placeholder text",
    "type": "field type (e.g., text, select, email, tel, file, textarea)",
    "selector": "CSS selector to locate the element",
    "frameIndex": 0,
    "mappedValue": "the value to fill",
    "confidence": 95,
    "reason": "explanation of mapping"
  }
]

Rules:
- Do not include markdown code block formatting (like \`\`\`json) or extra text.
- Ensure all double quotes inside string values are properly escaped.
`;

  try {
    const completion = await createChatCompletionWithRetry({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const cleanContent = completion.choices[0].message.content.trim();
    const jsonString = cleanContent.replace(/^```json/i, '').replace(/```$/, '').trim();
    const result = extractJson(jsonString);
    // If result is wrapped inside a key, extract the array
    if (result && !Array.isArray(result) && typeof result === 'object') {
      const keys = Object.keys(result);
      if (keys.length === 1 && Array.isArray(result[keys[0]])) {
        return result[keys[0]];
      }
    }
    return result;
  } catch (error) {
    console.error("Error mapping fields for form fill:", error.message);
    // Return empty fallback array
    return scrapedFields.map(f => ({
      ...f,
      mappedValue: "",
      confidence: 0,
      reason: "Failed to map using Gemini: " + error.message
    }));
  }
};

module.exports = {
  extractJson,
  generateEmailContent,
  generateAtsScore,
  analyzeJobDescription,
  analyzeResumeGap,
  generateKeywordSuggestions,
  calculateDeterministicAtsScore,
  generateCoverLetter,
  generateCustomCoverLetter,
  extractJobInfoFromText,
  generateFollowUpEmail,
  tailorResumeData,
  generateInterviewPrepQuestions,
  evaluateInterviewAnswer,
  suggestRecruiterReply,
  getSalaryBenchmarksWithGrounding,
  evaluateSpokenInterviewAnswer,
  mapFieldsForFormFill
};
