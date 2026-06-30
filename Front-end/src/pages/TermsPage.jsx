import React from 'react';
import PublicLayout from '../components/PublicLayout';

const terms = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using RecoCareer.ai (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, you may not use the Service.

These Terms apply to all visitors, users, and anyone who accesses or uses the Service. We reserve the right to update these Terms at any time. Continued use of the Service constitutes acceptance of any changes.`,
  },
  {
    title: '2. Description of Service',
    content: `RecoCareer.ai provides AI-powered job application management tools including:
• Job application tracking and organization
• AI-generated outreach emails and cover letters
• Resume builder and PDF export
• Voice interview practice and AI scoring
• Salary negotiation tools
• Automated job application form assistance

The Service is available under a Free tier and a Pro subscription tier, as described on our Pricing page.`,
  },
  {
    title: '3. User Accounts',
    content: `You must sign in with a valid Google or Microsoft account to use RecoCareer.ai. You are responsible for:
• Maintaining the security of your account credentials.
• All activities that occur under your account.
• Ensuring the information you provide is accurate.

We reserve the right to suspend or terminate accounts that violate these Terms.`,
  },
  {
    title: '4. Acceptable Use',
    content: `You agree NOT to use the Service to:
• Violate any applicable laws or regulations.
• Submit false, misleading, or fraudulent information.
• Attempt to gain unauthorized access to any systems or data.
• Upload malicious code, viruses, or harmful content.
• Scrape, harvest, or collect data from the Service without permission.
• Resell or redistribute access to the Service.
• Harass, abuse, or harm other users or third parties.

Violations may result in immediate termination of your account without refund.`,
  },
  {
    title: '5. Intellectual Property',
    content: `All software, design, logos, branding, and content produced by RecoCareer.ai are the exclusive property of RecoCareer.ai and its licensors.

**Your Content**: You retain ownership of all resume data, notes, and content you create within the Service. By using the Service, you grant RecoCareer.ai a limited, non-exclusive license to process and display your content solely to provide the Service.

**AI-Generated Content**: Outreach emails, cover letters, and other AI-generated outputs are produced for your personal use. You may use them freely. RecoCareer.ai makes no copyright claims over AI-generated content you create with the Service.`,
  },
  {
    title: '6. Subscription & Billing',
    content: `The Pro subscription is billed monthly. By subscribing, you authorize RecoCareer.ai to charge your payment method on a recurring basis.

• **Cancellation**: You may cancel at any time from your profile settings. Access continues until the end of the billing period.
• **Refunds**: Refunds are available within 7 days of initial Pro purchase.
• **Price Changes**: We will provide 30 days' notice of any price increases.
• **Failed Payments**: If payment fails, your account will be downgraded to the Free tier after a grace period.`,
  },
  {
    title: '7. Disclaimers',
    content: `The Service is provided "AS IS" without warranties of any kind. RecoCareer.ai does not guarantee:
• That the Service will be uninterrupted, error-free, or completely secure.
• That AI-generated content will be accurate, appropriate, or successful in job applications.
• That using the Service will result in job offers or employment.

**We are a tool, not a recruiter.** Results depend on many factors outside our control.`,
  },
  {
    title: '8. Limitation of Liability',
    content: `To the maximum extent permitted by law, RecoCareer.ai shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill.

Our total liability for any claim arising from use of the Service is limited to the amount you paid us in the 12 months preceding the claim, or $100, whichever is greater.`,
  },
  {
    title: '9. Termination',
    content: `We reserve the right to suspend or terminate your account at any time for any reason, including:
• Violation of these Terms.
• Fraudulent or abusive behavior.
• Extended inactivity (Free accounts inactive for 12+ months).

You may delete your account at any time from your profile settings or by contacting us. Upon termination, your license to use the Service ends immediately.`,
  },
  {
    title: '10. Governing Law',
    content: `These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law provisions. Any disputes shall be subject to the exclusive jurisdiction of courts located in India.`,
  },
  {
    title: '11. Contact',
    content: `For questions about these Terms:
• **Email**: legal@recocareer.ai
• **Response Time**: Within 10 business days

For general support, visit our Contact page.`,
  },
];

const TermsPage = ({ isDark, onToggleTheme }) => (
  <PublicLayout isDark={isDark} onToggleTheme={onToggleTheme}>
    <section className="max-w-4xl mx-auto px-5 py-20">
      {/* Header */}
      <div className="text-center mb-14 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl neo-card flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-50 mb-4">
          Terms of <span className="text-gradient">Service</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Last updated: <strong>June 30, 2025</strong>
        </p>
        <p className="mt-4 text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Please read these terms carefully before using RecoCareer.ai. By using our service, you agree to these terms.
        </p>
      </div>

      {/* Quick navigation */}
      <div className="neo-card-inset p-5 mb-10">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Jump to section</p>
        <div className="flex flex-wrap gap-2">
          {terms.map(({ title }) => (
            <a
              key={title}
              href={`#${title.replace(/\s+/g, '-').toLowerCase()}`}
              className="text-xs px-3 py-1.5 rounded-lg neo-btn text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {title}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-5">
        {terms.map(({ title, content }, i) => (
          <div
            key={i}
            id={title.replace(/\s+/g, '-').toLowerCase()}
            className="neo-card p-7"
          >
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">{title}</h2>
            <div className="space-y-2">
              {content.split('\n').filter(Boolean).map((line, li) => (
                <p key={li} className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {line.startsWith('•') ? (
                    <span className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-1 flex-shrink-0 font-bold">·</span>
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

      {/* Agreement notice */}
      <div className="mt-10 neo-card-inset p-5 text-center text-sm text-slate-500 dark:text-slate-400">
        By using RecoCareer.ai, you confirm that you have read, understood, and agree to these Terms of Service.
      </div>
    </section>
  </PublicLayout>
);

export default TermsPage;
