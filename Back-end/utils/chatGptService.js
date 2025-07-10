const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
const generateEmailContent = async (job) => {
    try {
        const prompt = `Write a short, professional, and concise job application confirmation email. The tone should be formal, confident, and approachable — similar to what you'd send to a hiring manager in a business environment. Use natural everyday English with a professional tone.

Include in the email:
1. A polite greeting and brief context — confirming either that I’ve applied to or received the job posting ( ${job.job}).
2. A line summarizing the job title and description (from below), and expressing genuine interest in the opportunity.
3. A concise professional introduction:
   - Name: Mohd Monish
   - Education: BCA Graduate
   - Role: Full Stack MERN Developer
   - Frontend: HTML, CSS, JavaScript, React.js, Next.js, Chakra UI, Redux, TypeScript
   - Backend: Node.js, Express.js, MongoDB
   - Tools & DevOps: Docker, CI/CD, GitHub Actions, DigitalOcean
   - Experience: 2+ years of industry experience
4. Naturally connect how my experience and skills align with the job requirements.
5. Express enthusiasm for potential next steps — open to further discussion or interviews.
6. A warm and professional closing, signed with my name.

Job Title: ${job.job}
Job Description: ${job.description}

Return only the email body. Do not include a subject line or extra formatting. Keep it tight, professional, and to the point.`;



        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 500,
            temperature: 0.7
        });
        
        console.log(completion.choices[0].message.content.trim());
        return completion.choices[0].message.content.trim();
    } catch (error) {
        console.error("Error generating email content:", error);
        return null;
    }
};

module.exports = { generateEmailContent };
