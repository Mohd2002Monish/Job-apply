import React from 'react';
import PublicLayout from '../components/PublicLayout';

const sections = [
  {
    title: '1. Information We Collect',
    content: `When you sign in with Google or Microsoft, we collect your name, email address, and profile picture from those services.

We also collect the following information as you use RecoCareer.ai:
• **Resume Data**: The content you enter into the resume builder, including work experience, education, skills, and personal information.
• **Job Application Records**: Jobs you track, statuses, notes, and associated outreach emails you generate.
• **Usage Data**: Pages visited, features used, and AI request counts for billing and improvement purposes.
• **Device & Browser Data**: Browser type, operating system, IP address, and general location (country/city level) for security and analytics.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use collected data for the following purposes:
• **Provide the Service**: Your resume data powers AI-generated emails, cover letters, and form fills.
• **Personalization**: We tailor suggestions and AI outputs to your profile and job history.
• **Billing & Subscriptions**: We use Stripe to process payments. We never store your card details directly.
• **Security**: We monitor usage for fraud, abuse, and unauthorized access.
• **Improvement**: Aggregate, anonymized usage data helps us improve product features.

We do NOT use your data to train external AI models without your explicit consent.`,
  },
  {
    title: '3. Data Sharing & Third Parties',
    content: `We do not sell your personal data. We share your data only with:
• **Authentication Providers**: Google and Microsoft receive authentication requests only. We receive your profile info from them.
• **Stripe**: Payment processing. Subject to Stripe's Privacy Policy.
• **Google Gemini / OpenAI**: AI-generated content is processed via API. Inputs may be sent to their servers. We do not share personal identifiers with AI providers.
• **Hosting**: Our servers are hosted on secure cloud infrastructure (AWS/GCP). Data is encrypted at rest and in transit.
• **Legal Compliance**: We may disclose data to law enforcement if required by valid legal process.`,
  },
  {
    title: '4. Data Retention',
    content: `We retain your account data for as long as your account is active. If you delete your account:
• Your personal profile, resume data, and job records are permanently deleted within 30 days.
• Anonymized, aggregated analytics data may be retained indefinitely.
• Backup copies may persist for up to 90 days before complete purge.`,
  },
  {
    title: '5. Your Rights',
    content: `Depending on your jurisdiction, you may have the right to:
• **Access**: Request a copy of all personal data we hold about you.
• **Correction**: Correct inaccurate data via your profile settings or by contacting us.
• **Deletion**: Request deletion of your account and all associated data.
• **Data Portability**: Request your data in a machine-readable format (JSON/CSV).
• **Opt-Out**: Opt out of non-essential communications in your account settings.

To exercise any of these rights, email privacy@recocareer.ai or use the Contact page.`,
  },
  {
    title: '6. Cookies & Tracking',
    content: `We use session cookies for authentication. We do not use third-party advertising cookies or behavioral tracking pixels.

You can clear cookies at any time via your browser settings. Disabling cookies will log you out of the service.`,
  },
  {
    title: '7. Security',
    content: `We implement multiple layers of security:
• HTTPS/TLS encryption for all data in transit.
• Encrypted session tokens.
• Regular security audits and penetration testing.
• Rate limiting on all API endpoints.

No system is completely secure. If you discover a security vulnerability, please report it responsibly to security@recocareer.ai.`,
  },
  {
    title: '8. Children\'s Privacy',
    content: `RecoCareer.ai is not intended for users under the age of 16. We do not knowingly collect personal information from children. If you believe a child has provided us data, please contact us and we will delete it promptly.`,
  },
  {
    title: '9. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notification. Continued use of the service after changes constitutes acceptance.`,
  },
  {
    title: '10. Contact Us',
    content: `For privacy-related questions or requests:
• **Email**: privacy@recocareer.ai
• **Response Time**: Within 5 business days

For general inquiries, visit our Contact page.`,
  },
];

const PrivacyPolicyPage = ({ isDark, onToggleTheme }) => (
  <PublicLayout isDark={isDark} onToggleTheme={onToggleTheme}>
    <section className="max-w-4xl mx-auto px-5 py-20">
      {/* Header */}
      <div className="text-center mb-14 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl neo-card flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-50 mb-4">
          Privacy <span className="text-gradient">Policy</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Last updated: <strong>June 30, 2025</strong> · Effective immediately
        </p>
        <p className="mt-4 text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          We built RecoCareer.ai with your privacy as a priority. This policy explains what we collect, why, and how we protect it.
        </p>
      </div>

      {/* Quick summary neo-card */}
      <div className="neo-card-inset p-6 mb-10 flex flex-col gap-3">
        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">TL;DR Summary</p>
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          {[
            'We only collect what\'s needed to run the service.',
            'We never sell your data.',
            'You can delete your account and all data anytime.',
            'AI processing uses your data only to generate outputs for you.',
            'We use Stripe for payments — we never store card details.',
          ].map((point, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5 flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      {/* Sections */}
      <div className="space-y-5">
        {sections.map(({ title, content }, i) => (
          <div key={i} className="neo-card p-7">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">{title}</h2>
            <div className="space-y-2">
              {content.split('\n').filter(Boolean).map((line, li) => (
                <p key={li} className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {line.startsWith('•') ? (
                    <span className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-1 flex-shrink-0">·</span>
                      <span dangerouslySetInnerHTML={{ __html: line.slice(1).trim().replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-800 dark:text-slate-200">$1</strong>') }} />
                    </span>
                  ) : (
                    <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-800 dark:text-slate-200">$1</strong>') }} />
                  )}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  </PublicLayout>
);

export default PrivacyPolicyPage;
