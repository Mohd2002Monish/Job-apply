const OpenAI = require('openai');

let _openai = null;

const getGemini = () => {
  if (!_openai) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      throw new Error('GEMINI_API_KEY is not configured. Add it to your .env file.');
    }
    _openai = new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
    });
  }
  return _openai;
};

const SYSTEM_PROMPT = `You are a professional resume parser. Extract structured data from the raw resume text provided and return ONLY a valid JSON object with no additional text, markdown, or code blocks.

Return this exact JSON structure:
{
  "personalInfo": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "website": "",
    "jobTitle": ""
  },
  "summary": "",
  "experience": [
    {
      "company": "",
      "role": "",
      "startDate": "",
      "endDate": "",
      "current": false,
      "location": "",
      "description": "",
      "achievements": []
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field": "",
      "startDate": "",
      "endDate": "",
      "gpa": "",
      "location": ""
    }
  ],
  "skills": {
    "technical": [],
    "soft": [],
    "languages": [],
    "tools": []
  },
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": "",
      "url": ""
    }
  ],
  "projects": [
    {
      "name": "",
      "description": "",
      "techStack": [],
      "url": "",
      "github": ""
    }
  ],
  "awards": []
}

Rules:
- Extract ALL information present in the resume
- For dates, use formats like "Jan 2022", "2020", "Present"
- Set "current": true for ongoing positions
- Split skills intelligently into technical/soft/languages/tools
- Extract achievements as separate bullet points where possible
- If a field is empty or not found, use empty string "" or empty array []
- Crucial: Ensure all double quotes inside string values are properly escaped (e.g. use \\" for internal quotes) so that the output remains a valid JSON string.
- Crucial: Do not include unescaped newlines or backslashes in string values.
- Return ONLY the JSON object, no explanation`;

/**
 * Use Gemini (via OpenAI SDK) to parse raw resume text into structured JSON
 * @param {string} rawText - extracted resume text
 * @returns {Promise<Object>} structured resume data
 */
const structureResume = async (rawText) => {
  if (!rawText || rawText.trim().length < 20) {
    throw new Error('Resume text is too short or empty to parse');
  }

  const openai = getGemini();

  const truncatedText = rawText.slice(0, 16000); // generous context window

  console.log(`Structuring resume with Gemini (${truncatedText.length} chars)...`);

  const completion = await openai.chat.completions.create({
    model: 'gemini-2.5-flash',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Parse this resume:\n\n${truncatedText}` },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0].message.content.trim();

  // Strip markdown code block wrappers if any
  let jsonString = raw;
  if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/^```json/i, '').replace(/```$/, '').trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    console.error('Raw Gemini JSON Output that failed parsing:\n', raw);
    throw new Error('Gemini returned invalid JSON: ' + err.message);
  }

  // Ensure all required fields exist
  const defaults = {
    personalInfo: { name: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '', jobTitle: '' },
    summary: '',
    experience: [],
    education: [],
    skills: { technical: [], soft: [], languages: [], tools: [] },
    certifications: [],
    projects: [],
    awards: [],
  };

  return { ...defaults, ...parsed };
};

module.exports = { structureResume };
