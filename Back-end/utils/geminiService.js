const OpenAI = require("openai");

let _geminiClient = null;
let _openaiClient = null;

const getGemini = () => {
  if (!_geminiClient) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      throw new Error("GEMINI_API_KEY is not configured. Add it to your .env file.");
    }
    _geminiClient = new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    });
  }
  return _geminiClient;
};

const getClientForModel = (modelName) => {
  const model = modelName || "gemini-2.5-flash";
  const isOpenAi = model.startsWith("gpt-");

  if (isOpenAi) {
    const hasOpenAiKey = process.env.OPENAI_API_KEY && 
                         process.env.OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY_HERE' && 
                         process.env.OPENAI_API_KEY.trim() !== '';
    if (hasOpenAiKey) {
      if (!_openaiClient) {
        _openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
      }
      return { client: _openaiClient, modelName: model };
    } else {
      console.warn(`⚠️ OpenAI API Key not configured. Falling back to Gemini equivalent for model ${model}`);
      const geminiFallback = model === "gpt-4o" ? "gemini-1.5-pro" : "gemini-2.5-flash";
      return { client: getGemini(), modelName: geminiFallback };
    }
  }

  return { client: getGemini(), modelName: model };
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
 * Automatically retries OpenAI/Gemini completions on 429 status code with exponential backoff.
 */
const createChatCompletionWithRetry = async (params, retries = 3, delay = 2000) => {
  const contextStore = require('./contextStore');
  const contextReq = contextStore.getStore();
  const req = params.req || contextReq;
  delete params.req;

  const requestedModel = req?.body?.aiModel || req?.query?.aiModel || params.model || "gemini-2.5-flash";
  const { client, modelName } = getClientForModel(requestedModel);

  params.model = modelName;

  for (let i = 0; i <= retries; i++) {
    try {
      const completion = await client.chat.completions.create(params);
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
        console.warn(`⚠️ API 429 rate limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
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

    const prompt = `You are an enterprise-grade ATS (Applicant Tracking System) parsing engine. Perform a precise, rubric-based keyword and qualification match between a candidate's resume and a job description.

SCORING RUBRIC (apply strictly, do not deviate):

CATEGORY 1 - Hard Skills Match (0-35 points):
For each technical skill explicitly required in the JD, check if it appears verbatim or as a recognized synonym in the resume. Score = (matched_count / total_required) * 35. Round to nearest integer.

CATEGORY 2 - Experience Alignment (0-25 points):
Do the candidate's job titles, described responsibilities, and implied years of experience align with the JD requirements? Score based on:
- Job title relevance (0-8)
- Responsibility overlap (0-10)
- Seniority/experience level match (0-7)

CATEGORY 3 - Keyword Density (0-20 points):
Count all JD-specific terms (tools, frameworks, methodologies, certifications, domain terms) that appear anywhere in the resume. Score = (found_count / total_jd_keywords) * 20.

CATEGORY 4 - Education & Certifications (0-10 points):
Does the candidate meet stated education requirements? Any relevant certifications?
- Degree match: 0-6
- Relevant certifications: 0-4

CATEGORY 5 - Format Compatibility (0-10 points):
Are standard ATS-parseable elements present? (clear section headers, structured skills list, reverse-chronological experience)

Candidate Resume Profile:
${safeResume}

Target Job Description:
${safeJd}

Return ONLY a JSON object. No markdown, no commentary:
{
  "score": 78,
  "breakdown": {
    "hardSkills": { "score": 28, "maxScore": 35, "matched": ["React", "Node.js"], "total": 10 },
    "experienceAlignment": { "score": 20, "maxScore": 25, "detail": "Strong role overlap, 1 level below target seniority" },
    "keywordDensity": { "score": 14, "maxScore": 20, "found": 14, "total": 20 },
    "education": { "score": 8, "maxScore": 10, "detail": "Degree matches, no certifications listed" },
    "formatCompatibility": { "score": 8, "maxScore": 10, "detail": "Clean structure, missing dedicated certifications section" }
  },
  "matchSummary": "2-3 sentence assessment of overall fit",
  "matchingKeywords": ["exact terms found in both resume and JD"],
  "missingKeywords": ["JD terms NOT found anywhere in the resume"],
  "suggestions": [
    { "priority": "critical", "action": "Add Docker experience to skills and mention containerization in deployment-related work" },
    { "priority": "high", "action": "Include AWS services used in project descriptions" },
    { "priority": "medium", "action": "Rewrite summary to echo the exact job title from the JD" }
  ]
}

Rules:
- Score MUST equal the sum of all 5 breakdown category scores.
- Each suggestion must be specific and actionable - not generic advice.
- Prioritize suggestions as "critical" (would cause auto-rejection), "high" (significantly impacts ranking), or "medium" (minor improvement).
- Ensure all double quotes inside string values are properly escaped.
- Do not include literal unescaped newlines in string values.`;

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
      breakdown: {
        hardSkills: { score: 0, maxScore: 35, matched: [], total: 0 },
        experienceAlignment: { score: 0, maxScore: 25, detail: "Analysis failed" },
        keywordDensity: { score: 0, maxScore: 20, found: 0, total: 0 },
        education: { score: 0, maxScore: 10, detail: "Analysis failed" },
        formatCompatibility: { score: 0, maxScore: 10, detail: "Analysis failed" }
      },
      matchSummary: "Failed to run ATS analysis due to system error.",
      matchingKeywords: [],
      missingKeywords: [],
      suggestions: [{ priority: "critical", action: "Ensure Gemini API key is correctly configured and retry." }]
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
  const prompt = `You are a senior technical recruiter with 15 years of experience parsing job descriptions for ATS optimization. Your task is to extract every structured signal from a job posting that an ATS system or resume optimizer would need.

ANALYSIS FRAMEWORK:
1. HARD REQUIREMENTS: Skills, tools, frameworks, and certifications explicitly stated as "required", "must have", or listed without qualifiers.
2. PREFERRED/BONUS: Skills preceded by "nice to have", "preferred", "bonus", "ideally", or "plus".
3. IMPLICIT REQUIREMENTS: Technologies implied by the tech stack context (e.g., if they mention "React" and "TypeScript", "JavaScript" is implicit even if not stated).
4. EXPERIENCE SIGNALS: Years of experience, seniority level, leadership expectations.
5. INDUSTRY CONTEXT: Domain-specific terminology (fintech, healthtech, e-commerce, etc.) that signals industry knowledge requirements.

Job Description:
${jdText.slice(0, 5000)}

Return ONLY a JSON object with this exact schema:
{
  "jobTitle": "exact job title from the posting",
  "seniorityLevel": "Junior | Mid | Senior | Lead | Staff | Principal | Manager | Director",
  "yearsExperienceRequired": "e.g. '3+' or '5-7' or null if not specified",
  "requiredSkills": ["skills explicitly marked as required or must-have"],
  "preferredSkills": ["skills marked as nice-to-have, preferred, or bonus"],
  "implicitSkills": ["skills implied by context but not explicitly listed"],
  "tools": ["specific tools, platforms, and services mentioned (e.g. Docker, AWS, Jira)"],
  "frameworks": ["frameworks and libraries mentioned (e.g. React, Express, TailwindCSS)"],
  "programmingLanguages": ["programming languages mentioned (e.g. JavaScript, Python, Go)"],
  "softSkills": ["communication, leadership, teamwork, etc."],
  "responsibilities": ["each key responsibility as a separate item"],
  "dealBreakers": ["absolute requirements that would disqualify a candidate if missing"],
  "industryContext": "the industry or domain this role operates in, or 'General' if not specified",
  "keywords": ["ALL unique technical and non-technical terms an ATS would scan for - be exhaustive"]
}

Rules:
- Extract keywords aggressively. Include acronyms AND their full forms (e.g. both "CI/CD" and "Continuous Integration").
- For responsibilities, extract the action + object (e.g. "Design and implement RESTful APIs"), not filler text.
- If a skill appears in both required and preferred sections, list it ONLY in requiredSkills.
- keywords should be the union of ALL technical terms, tools, frameworks, methodologies, and domain terms found anywhere in the JD.`;

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

  const prompt = `You are an ATS gap analysis specialist. Your job is to perform a forensic comparison between a candidate's resume and a structured job description analysis.

CRITICAL RULES:
- This is ANALYSIS ONLY. Do NOT rewrite, rephrase, or generate any resume content.
- Do NOT suggest adding skills the candidate does not have. Only identify what is present vs. absent.
- Be precise: a skill is "matching" ONLY if it appears explicitly in the resume text.

ANALYSIS TASKS:

1. SKILL MATCHING: For each required skill in the JD, determine if it exists in the resume.
   Rate each match as "strong" (explicitly mentioned + demonstrated in experience/projects),
   "weak" (mentioned in skills list but not demonstrated), or "missing" (not found at all).

2. EXPERIENCE RELEVANCE: Identify which experience entries have the strongest overlap with
   JD responsibilities. Rank by relevance.

3. PROJECT RELEVANCE: Identify which projects use technologies required by the JD.

4. KEYWORD AUDIT: Cross-reference ALL JD keywords against the full resume text.

5. CRITICAL GAPS: Identify the top 3-5 gaps that would have the highest negative impact on ATS scoring.

Resume:
${resumeContext.slice(0, 3000)}

JD Analysis:
${JSON.stringify(jdAnalysis).slice(0, 2000)}

Return ONLY a JSON object:
{
  "matchingSkills": [
    { "skill": "React.js", "strength": "strong", "evidence": "Used in 2 projects and current role" }
  ],
  "missingSkills": [
    { "skill": "Docker", "priority": "high", "impact": "Listed as required skill - major ATS penalty" }
  ],
  "weakSkills": [
    { "skill": "TypeScript", "issue": "Listed in skills but no project or experience demonstrates it" }
  ],
  "experienceToHighlight": [
    { "company": "Company Name", "role": "Role Title", "relevance": "Direct overlap with JD responsibility X" }
  ],
  "projectsToHighlight": [
    { "project": "Project Name", "relevance": "Uses 3 of the 5 required frameworks" }
  ],
  "presentKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword3", "keyword4"],
  "criticalGaps": [
    { "gap": "No cloud deployment experience", "impact": "high", "suggestion": "Emphasize any deployment or DevOps work in existing experience" }
  ]
}`;

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

  const prompt = `You are an ATS keyword density analyzer. Your task is to audit a tailored resume and determine exactly how well it covers the target job description's keyword requirements.

For each keyword from the JD, determine:
- Is it present in the resume? (exact match or close synonym)
- How many times does it appear? (density)
- Where does it appear? (summary, skills, experience, projects)
- Is it well-contextualized (used in a meaningful sentence) or just listed?

Tailored Resume:
${resumeContext.slice(0, 2500)}

JD Keywords to audit:
${JSON.stringify(jdAnalysis?.keywords || [])}

Required Skills from JD:
${JSON.stringify(jdAnalysis?.requiredSkills || [])}

Return ONLY a JSON object:
{
  "strongKeywords": [
    { "keyword": "React.js", "frequency": 4, "locations": ["summary", "skills", "experience"], "status": "well-integrated" }
  ],
  "missingKeywords": [
    { "keyword": "Docker", "importance": "critical", "suggestedPlacement": "Add to tools section and mention in deployment-related experience bullets" }
  ],
  "weakKeywords": [
    { "keyword": "TypeScript", "frequency": 1, "issue": "Only listed in skills, not demonstrated in any experience or project description", "suggestedFix": "Mention TypeScript usage in the project descriptions where applicable" }
  ],
  "keywordDensityScore": 75,
  "recommendations": [
    { "priority": "high", "action": "specific actionable step with exact wording suggestion", "targetSection": "experience | skills | summary | projects" }
  ],
  "overallAssessment": "1-2 sentence summary of keyword coverage quality"
}`;

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

  // Normalize helper: lowercase + trim for consistent matching
  const norm = (s) => (s || '').trim().toLowerCase();

  // Build comprehensive resume skill set from ALL sections
  const resumeSkills = [
    ...(resumeData?.skills?.technical || []),
    ...(resumeData?.skills?.tools || []),
    ...(resumeData?.skills?.soft || []),
    ...(resumeData?.skills?.languages || [])
  ].map(norm);

  // Build comprehensive JD required skills from ALL relevant fields
  const requiredSkills = [
    ...(jdAnalysis.requiredSkills || []),
    ...(jdAnalysis.tools || []),
    ...(jdAnalysis.frameworks || []),
    ...(jdAnalysis.programmingLanguages || [])
  ].map(norm);

  // Deduplicate required skills
  const uniqueRequired = [...new Set(requiredSkills)];

  // Common alias map for fuzzy matching (e.g., "react" matches "react.js", "reactjs")
  const aliases = {
    'react': ['react.js', 'reactjs'],
    'react.js': ['react', 'reactjs'],
    'node': ['node.js', 'nodejs'],
    'node.js': ['node', 'nodejs'],
    'vue': ['vue.js', 'vuejs'],
    'vue.js': ['vue', 'vuejs'],
    'next': ['next.js', 'nextjs'],
    'next.js': ['next', 'nextjs'],
    'express': ['express.js', 'expressjs'],
    'express.js': ['express', 'expressjs'],
    'typescript': ['ts'],
    'javascript': ['js'],
    'mongodb': ['mongo'],
    'postgresql': ['postgres'],
    'ci/cd': ['continuous integration', 'continuous deployment'],
    'aws': ['amazon web services'],
    'gcp': ['google cloud platform', 'google cloud'],
  };

  // Smart matching: checks direct inclusion + alias expansion
  const skillMatches = (jdSkill, resumeSkillsList) => {
    const jd = norm(jdSkill);
    if (resumeSkillsList.some(rs => rs.includes(jd) || jd.includes(rs))) return true;
    const alts = aliases[jd] || [];
    return alts.some(alt => resumeSkillsList.some(rs => rs.includes(alt) || alt.includes(rs)));
  };

  // === SKILLS SCORE (0-35 pts) ===
  let skillsScore = 0;
  const matchedSkills = [];
  const unmatchedSkills = [];
  if (uniqueRequired.length > 0) {
    uniqueRequired.forEach(s => {
      if (skillMatches(s, resumeSkills)) {
        matchedSkills.push(s);
      } else {
        unmatchedSkills.push(s);
      }
    });
    skillsScore = Math.round((matchedSkills.length / uniqueRequired.length) * 35);
  } else {
    skillsScore = 28; // no required skills listed — generous partial credit
  }

  // === EXPERIENCE SCORE (0-25 pts) ===
  const hasExperience = (resumeData?.experience || []).length > 0;
  const responsibilities = (jdAnalysis.responsibilities || []).map(norm);
  const expText = (resumeData?.experience || []).map(e =>
    `${e.role || ''} ${e.description || ''} ${(e.achievements || []).join(' ')}`
  ).join(' ').toLowerCase();

  let experienceScore = 0;
  if (responsibilities.length > 0) {
    const expMatchCount = responsibilities.filter(r => {
      // Extract meaningful words (5+ chars) and check if any appear in experience text
      const words = r.split(/\s+/).filter(w => w.length > 4);
      return words.some(w => expText.includes(w));
    }).length;
    const respScore = Math.round((expMatchCount / responsibilities.length) * 25);
    experienceScore = Math.min(25, respScore + (hasExperience ? 3 : 0));
  } else {
    experienceScore = hasExperience ? 20 : 0;
  }

  // === KEYWORD SCORE (0-20 pts) ===
  const keywords = (jdAnalysis.keywords || []).map(norm);
  const fullResumeText = formatResumeContext(resumeData).toLowerCase();
  let keywordScore = 0;
  if (keywords.length > 0) {
    const matchedKw = keywords.filter(k => fullResumeText.includes(k));
    keywordScore = Math.round((matchedKw.length / keywords.length) * 20);
  } else {
    keywordScore = 14;
  }

  // === EDUCATION SCORE (0-10 pts) ===
  const hasEducation = (resumeData?.education || []).length > 0;
  const hasCertifications = (resumeData?.certifications || []).length > 0;
  let educationScore = 0;
  if (hasEducation) educationScore += 7;
  if (hasCertifications) educationScore += 3;

  // === DEAL-BREAKER PENALTY ===
  // If the JD has explicit deal-breakers and the resume is missing them, apply a penalty
  const dealBreakers = (jdAnalysis.dealBreakers || []).map(norm);
  let dealBreakerPenalty = 0;
  if (dealBreakers.length > 0) {
    const missingDealBreakers = dealBreakers.filter(db => !skillMatches(db, resumeSkills) && !fullResumeText.includes(db));
    // Each missing deal-breaker costs 5 points, up to 15
    dealBreakerPenalty = Math.min(15, missingDealBreakers.length * 5);
  }

  const rawTotal = skillsScore + experienceScore + keywordScore + educationScore;
  const total = Math.max(0, Math.min(100, rawTotal - dealBreakerPenalty));

  return {
    score: total,
    breakdown: {
      skills: skillsScore,
      experience: experienceScore,
      keywords: keywordScore,
      education: educationScore,
      dealBreakerPenalty: dealBreakerPenalty > 0 ? -dealBreakerPenalty : 0
    },
    matchedSkills,
    unmatchedSkills
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

    const prompt = `You are a world-class ATS resume optimization specialist who has helped 10,000+ candidates achieve 90%+ ATS scores. Your task: restructure and reword an existing resume to maximize its ATS compatibility for a specific job description while maintaining absolute factual accuracy.

=== ABSOLUTE CONSTRAINTS (violating ANY of these is a critical failure) ===

1. NEVER ADD anything not present in the original resume:
   - No new skills, technologies, tools, or frameworks
   - No new companies, job titles, or responsibilities
   - No new projects, certifications, degrees, or institutions
   - No fabricated metrics, percentages, or numbers
   
2. ALLOWED SKILLS LIST (use ONLY these, do not add any others):
   [${evidencedSkills.join(', ')}]
   Any skill NOT in this list must NOT appear in your output.

3. IMMUTABLE FIELDS (copy exactly, do not modify):
   - Company names, institution names, degree names
   - Start dates, end dates, current status
   - Locations, contact info, URLs
   - GPA values, certification dates

=== WHAT YOU CAN AND SHOULD DO ===

A. SUMMARY REWRITE:
   - Rewrite the professional summary to mirror the exact job title from the JD
   - Front-load the top 3 JD-required skills that the candidate actually has
   - Include years of experience if stated in the original resume
   - Keep to 2-3 impactful sentences

B. SKILLS REORDERING:
   - Move JD-matching skills to the FRONT of each skills array
   - Group related skills together (e.g., all frontend together, all backend together)
   - Use the exact terminology from the JD where the candidate has an equivalent skill
     (e.g., if JD says "React.js" and resume says "React", use "React.js")

C. EXPERIENCE BULLET REWRITES:
   - Rewrite each achievement/bullet using the XYZ format:
     "Accomplished [X] as measured by [Y] by doing [Z]"
   - Only use metrics/numbers if they exist in the original resume
   - If no metrics exist, describe the IMPACT qualitatively (e.g., "improved performance", "reduced load times", "streamlined workflow")
   - Naturally weave in JD keywords where the candidate actually used those skills
   - Use strong action verbs that echo the JD language: architected, engineered, optimized, scaled, spearheaded, delivered, automated
   - Each experience should have 3-5 achievement bullets

D. DESCRIPTION FIELD:
   - Write a 1-2 sentence role overview that connects to JD responsibilities
   - This is separate from achievements - it sets context

E. PROJECT OPTIMIZATION:
   - Reorder projects so JD-relevant ones appear first
   - Rewrite descriptions to emphasize the tech stack overlap with the JD
   - Highlight the problem solved and technologies used

F. JOB TITLE IN personalInfo:
   - Update the jobTitle field to match or closely mirror the JD's job title,
     but ONLY if the candidate's actual experience supports that title

=== INPUTS ===

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

CURRENT RESUME (JSON):
${JSON.stringify(resumeData).slice(0, 4000)}

GAP ANALYSIS (use this to prioritize rewrites):
${JSON.stringify(gapAnalysis).slice(0, 2000)}

=== OUTPUT ===

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
