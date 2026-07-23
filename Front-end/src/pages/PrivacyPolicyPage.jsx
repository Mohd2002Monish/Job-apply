import React, { useState, useEffect } from 'react';
import PublicLayout from '../components/PublicLayout';

const sections = [
  {
    title: '1. Information We Collect',
    content: `When you sign in with Google or Microsoft, we collect your name, email address, and profile picture from those services. If you upload a custom profile picture, it is stored on our servers.

We also collect the following information as you use RecoCareer.ai:
• **Resume Data**: The content you upload or enter into the resume builder, including work experience, education, skills, and personal information. Uploaded documents (PDF, DOCX, images) are parsed by AI and OCR to extract this data.
• **Job Application Records**: Jobs you track or import via the Chrome extension, statuses, notes, recruiter contact details, and the outreach emails and cover letters you generate.
• **Email Engagement Data**: When you send outreach with tracking enabled, we log open events (via a tracking pixel) and link clicks (via redirect links) on those emails, including timestamps.
• **Referral Data**: Clicks on your personal referral link and conversions attributed to it.
• **Usage Data**: Features used, AI request counts, and AI token consumption for billing, plan limits, and abuse prevention.
• **Device & Browser Data**: Browser type, operating system, IP address, and general location (country level) — used for security and to route you to the correct regional payment gateway.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use collected data for the following purposes:
• **Provide the Service**: Your resume and job data power AI-generated emails, cover letters, ATS match scores, interview questions, and form fills.
• **Email Sending on Your Behalf**: With your consent we hold OAuth tokens scoped to sending mail (gmail.send / Mail.Send) so outreach and follow-ups go out from your own inbox. These tokens cannot read your mailbox, and we only send when you trigger it (or when you enable automated follow-ups).
• **Personalization**: We tailor suggestions and AI outputs to your profile and job history.
• **Billing & Subscriptions**: Payments are processed by Razorpay (India/INR) or Stripe (international/USD) depending on your region. We never store your card details.
• **Security**: We monitor usage for fraud, abuse, and unauthorized access, and enforce plan limits.
• **Improvement**: Aggregate, anonymized usage data helps us improve product features.

We do NOT use your data to train AI models.`,
  },
  {
    title: '3. Data Sharing & Third Parties',
    content: `We do not sell your personal data. We share your data only with:
• **Authentication Providers**: Google and Microsoft handle sign-in; we receive your basic profile from them.
• **Payment Gateways**: Razorpay (for Indian customers) and Stripe (for international customers) process payments and subscription lifecycle events via webhooks. Subject to their respective privacy policies.
• **Google Gemini**: AI features send relevant inputs (resume content, job descriptions, your prompts) to the Gemini API to generate outputs for you. We do not send more than the feature requires.
• **Email Delivery**: Outreach is dispatched through your own connected Google/Microsoft account or our SMTP relay. The recipient recruiter receives only what you choose to send.
• **Hosting**: Our servers run on secure cloud infrastructure. Data is encrypted in transit (TLS) and sensitive credentials are encrypted at rest (AES-256-GCM).
• **Legal Compliance**: We may disclose data to law enforcement if required by valid legal process.`,
  },
  {
    title: '4. Email Tracking Disclosure',
    content: `Outreach emails you send through RecoCareer.ai may include a 1×1 tracking pixel and wrapped redirect links so you can see when your email is opened and which links are clicked.

• The data collected from recipients is limited to open/click events and timestamps tied to that specific email.
• You are responsible for ensuring your use of tracking complies with the laws applicable to you and your recipients.
• We do not build profiles of email recipients or use their data for any other purpose.`,
  },
  {
    title: '5. Data Retention',
    content: `We retain your account data for as long as your account is active. If you delete your account:
• Your personal profile, resume data, uploaded documents, and job records are permanently deleted within 30 days.
• Payment records may be retained as required by tax and accounting law.
• Anonymized, aggregated analytics data may be retained indefinitely.
• Backup copies may persist for up to 90 days before complete purge.

You can also revoke our email-sending access at any time from your Google or Microsoft account security settings — the rest of the service keeps working.`,
  },
  {
    title: '6. Your Rights',
    content: `Depending on your jurisdiction (including GDPR and India's DPDP Act), you may have the right to:
• **Access**: Request a copy of all personal data we hold about you.
• **Correction**: Correct inaccurate data via your profile settings or by contacting us.
• **Deletion**: Request deletion of your account and all associated data.
• **Data Portability**: Request your data in a machine-readable format (JSON/CSV).
• **Opt-Out**: Opt out of non-essential communications in your account settings.

To exercise any of these rights, email privacy@recocareer.ai or use the Contact page.`,
  },
  {
    title: '7. Cookies & Tracking',
    content: `We use a session cookie (HTTP-only, containing a signed JWT) for authentication, and a short-lived cookie to attribute referral link visits. We do not use third-party advertising cookies.

You can clear cookies at any time via your browser settings. Disabling cookies will log you out of the service.`,
  },
  {
    title: '8. Security',
    content: `We implement multiple layers of security:
• HTTPS/TLS encryption for all data in transit.
• AES-256-GCM encryption for stored payment gateway credentials — raw keys are never returned in plain text.
• HTTP-only, signed session tokens that are inaccessible to client-side scripts.
• Rate limiting and plan-based quotas on API endpoints.

No system is completely secure. If you discover a security vulnerability, please report it responsibly to security@recocareer.ai.`,
  },
  {
    title: '9. Children\'s Privacy',
    content: `RecoCareer.ai is not intended for users under the age of 16. We do not knowingly collect personal information from children. If you believe a child has provided us data, please contact us and we will delete it promptly.`,
  },
  {
    title: '10. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notification. Continued use of the service after changes constitutes acceptance.`,
  },
  {
    title: '11. Contact Us',
    content: `For privacy-related questions or requests:
• **Email**: privacy@recocareer.ai
• **Response Time**: Within 5 business days

For general inquiries, visit our Contact page.`,
  },
];

const splitTitle = (title) => {
  const match = title.match(/^(\d+)\.\s*(.*)$/);
  return match ? { num: match[1].padStart(2, '0'), text: match[2] } : { num: '', text: title };
};

const sectionId = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const renderContent = (content) => content.split('\n').filter(Boolean).map((line, li) => (
  <p key={li} className="text-sm text-text-muted leading-relaxed">
    {line.startsWith('•') ? (
      <span className="flex items-start gap-2.5">
        <span className="text-brand-primary mt-[7px] flex-shrink-0 w-1 h-1 rounded-full bg-current" />
        <span dangerouslySetInnerHTML={{ __html: line.slice(1).trim().replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-main font-semibold">$1</strong>') }} />
      </span>
    ) : (
      <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-main font-semibold">$1</strong>') }} />
    )}
  </p>
));

const tldr = [
  'We only collect what\'s needed to run the service.',
  'We never sell your data, and never train AI models on it.',
  'You can delete your account and all data anytime.',
  'Email-sending access is send-only — we can\'t read your inbox.',
  'Payments run through Razorpay (India) or Stripe (international) — we never store card details.',
];

const PrivacyPolicyPage = ({ isDark, onToggleTheme }) => {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const elements = sections.map(s => document.getElementById(sectionId(s.title))).filter(Boolean);
      const scrollPos = window.scrollY + 140;

      for (let i = elements.length - 1; i >= 0; i--) {
        if (elements[i] && elements[i].offsetTop <= scrollPos) {
          setActiveId(elements[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <PublicLayout isDark={isDark} onToggleTheme={onToggleTheme}>
      <section className="max-w-6xl mx-auto px-5 py-16 md:py-24">
        {/* Editorial header */}
        <div className="max-w-2xl mb-12 animate-fade-in">
          <p className="kicker mb-4">Legal · updated July 9, 2026</p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-text-main leading-[1.05] mb-5">
            Your data, plainly.
          </h1>
          <p className="text-base md:text-lg text-text-muted leading-relaxed">
            No legalese wall. This is exactly what we collect, why we collect it,
            and how you get rid of it — written to be read.
          </p>
        </div>

        {/* TL;DR strip */}
        <div className="glass-panel p-6 md:p-7 mb-12">
          <p className="kicker mb-4">The short version</p>
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {tldr.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-text-main">
                <svg className="w-4 h-4 text-brand-accent mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile Sticky Horizontal Bar */}
        <div className="lg:hidden sticky top-[64px] z-20 -mx-5 px-5 py-2.5 mb-8 bg-bg-app/90 backdrop-blur-md border-b border-border-card/40">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-thin [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
            {sections.map(({ title }) => {
              const id = sectionId(title);
              const { num, text } = splitTitle(title);
              const isActive = activeId === id;
              return (
                <a
                  key={title}
                  href={`#${id}`}
                  className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-brand-primary text-white shadow-sm font-bold'
                      : 'glass-chip text-text-muted hover:text-text-main'
                  }`}
                >
                  <span className="font-mono opacity-80 mr-1">{num}</span>
                  {text}
                </a>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Sticky Desktop TOC Box */}
          <nav className="hidden lg:block lg:sticky lg:top-[84px] glass-panel p-3 rounded-3xl space-y-1">
            <div className="px-3.5 py-2 mb-1 border-b border-border-card/40">
              <span className="kicker text-[10px]">Table of Contents</span>
            </div>
            {sections.map(({ title }) => {
              const id = sectionId(title);
              const { num, text } = splitTitle(title);
              const isActive = activeId === id;
              return (
                <a
                  key={title}
                  href={`#${id}`}
                  className={`flex items-center justify-between px-3.5 py-2 rounded-2xl text-[13px] transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-primary/10 text-brand-primary font-bold border border-brand-primary/20 shadow-xs'
                      : 'text-text-muted hover:text-text-main hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-baseline gap-2.5 truncate">
                    <span className={`font-mono text-[10px] ${isActive ? 'text-brand-primary' : 'text-brand-primary/70'}`}>{num}</span>
                    <span className="truncate leading-snug">{text}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 ml-2 animate-pulse" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Continuous document */}
          <div className="lg:col-span-3 glass-panel p-7 md:p-10">
            {sections.map(({ title, content }, i) => {
              const { num, text } = splitTitle(title);
              const id = sectionId(title);
              return (
                <div
                  key={title}
                  id={id}
                  className={`scroll-mt-28 ${i > 0 ? 'mt-10 pt-10 border-t border-white/40 dark:border-white/8' : ''}`}
                >
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="font-mono text-xs font-semibold text-brand-primary">{num}</span>
                    <h2 className="text-lg font-bold text-text-main">{text}</h2>
                  </div>
                  <div className="space-y-2.5 md:pl-8">
                    {renderContent(content)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default PrivacyPolicyPage;
