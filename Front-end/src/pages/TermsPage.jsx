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
• Job application tracking, Kanban board, and analytics
• AI-generated outreach emails and cover letters, sent from your own Gmail or Outlook account
• Email open and click tracking with automated follow-ups
• Resume parsing, WYSIWYG builder, and PDF/DOCX export
• ATS compatibility scoring against job descriptions
• Voice and written interview practice with AI grading
• Salary negotiation tools and AI-suggested recruiter replies
• A Chrome extension for importing job postings
• A referral program with personal referral links

The Service is offered as a Pro subscription (with regional pricing), as described on our Pricing page. Features, limits, and packages may change over time.`,
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
• Send spam, bulk unsolicited email, or deceptive outreach. Outreach tools are for genuine, individual job applications only.
• Attempt to gain unauthorized access to any systems or data.
• Upload malicious code, viruses, or harmful content.
• Scrape, harvest, or collect data from the Service without permission.
• Use the Chrome extension in violation of a job board's terms of service.
• Resell or redistribute access to the Service.
• Harass, abuse, or harm other users or third parties.

Violations may result in immediate termination of your account without refund.`,
  },
  {
    title: '5. Email Outreach & Tracking Responsibility',
    content: `The Service sends emails from your own connected Google or Microsoft account and can embed open/click tracking in those emails.

• **You are the sender.** You are solely responsible for the content, recipients, and legality of every email sent through your account, including compliance with anti-spam and privacy laws applicable to you and your recipients (e.g., CAN-SPAM, GDPR, India's IT rules).
• **Tracking**: By enabling tracking you acknowledge that recipients' open and click events will be logged, and you are responsible for ensuring this is lawful in your jurisdiction.
• **Automated follow-ups**: If you enable follow-ups, you authorize the Service to send the configured follow-up emails on your behalf.
• We may suspend sending privileges for accounts that trigger abuse or spam signals.`,
  },
  {
    title: '6. Intellectual Property',
    content: `All software, design, logos, branding, and content produced by RecoCareer.ai are the exclusive property of RecoCareer.ai and its licensors.

**Your Content**: You retain ownership of all resume data, notes, and content you create within the Service. By using the Service, you grant RecoCareer.ai a limited, non-exclusive license to process and display your content solely to provide the Service.

**AI-Generated Content**: Outreach emails, cover letters, and other AI-generated outputs are produced for your personal use. You may use them freely. RecoCareer.ai makes no copyright claims over AI-generated content you create with the Service.`,
  },
  {
    title: '7. Subscription, Billing & Coupons',
    content: `The Pro subscription is billed monthly with regional pricing — ₹999/month in India (processed by Razorpay) and $12/month internationally (processed by Stripe). Your region is detected automatically at checkout. By subscribing, you authorize recurring charges to your payment method through the applicable gateway.

• **Cancellation**: You may cancel at any time from your profile settings. Access continues until the end of the billing period.
• **Refunds**: Refunds are available within 7 days of your initial Pro purchase.
• **Coupons**: Promotional coupon codes (flat or percentage discounts) are subject to their stated expiry dates and usage limits. Coupons cannot be exchanged for cash, and abuse (e.g., automated redemption) voids the discount.
• **Referral Program**: Referral rewards are credited only for genuine new users who upgrade to Pro through your link. Self-referral, fake accounts, or incentivized spam disqualify the reward and may lead to account suspension.
• **Price Changes**: We will provide 30 days' notice of any price increases.
• **Failed Payments**: If payment fails, your subscription is downgraded after a grace period.`,
  },
  {
    title: '8. Disclaimers',
    content: `The Service is provided "AS IS" without warranties of any kind. RecoCareer.ai does not guarantee:
• That the Service will be uninterrupted, error-free, or completely secure.
• That AI-generated content will be accurate, appropriate, or successful in job applications.
• That using the Service will result in job offers or employment.

**We are a tool, not a recruiter.** Results depend on many factors outside our control.`,
  },
  {
    title: '9. Limitation of Liability',
    content: `To the maximum extent permitted by law, RecoCareer.ai shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill.

Our total liability for any claim arising from use of the Service is limited to the amount you paid us in the 12 months preceding the claim, or $100, whichever is greater.`,
  },
  {
    title: '10. Termination',
    content: `We reserve the right to suspend or terminate your account at any time for any reason, including:
• Violation of these Terms.
• Fraudulent or abusive behavior, including spam outreach or referral abuse.
• Extended inactivity (accounts inactive for 12+ months).

You may delete your account at any time from your profile settings or by contacting us. Upon termination, your license to use the Service ends immediately.`,
  },
  {
    title: '11. Governing Law',
    content: `These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law provisions. Any disputes shall be subject to the exclusive jurisdiction of courts located in India.`,
  },
  {
    title: '12. Contact',
    content: `For questions about these Terms:
• **Email**: legal@recocareer.ai
• **Response Time**: Within 10 business days

For general support, visit our Contact page.`,
  },
];

const splitTitle = (title) => {
  const match = title.match(/^(\d+)\.\s*(.*)$/);
  return match ? { num: match[1].padStart(2, '0'), text: match[2] } : { num: '', text: title };
};

const sectionId = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const TermsPage = ({ isDark, onToggleTheme }) => (
  <PublicLayout isDark={isDark} onToggleTheme={onToggleTheme}>
    <section className="max-w-4xl mx-auto px-5 py-16 md:py-24">
      {/* Editorial header */}
      <div className="max-w-2xl mb-10 animate-fade-in">
        <p className="kicker mb-4">Legal · updated July 9, 2026 · ~6 min read</p>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-text-main leading-[1.05] mb-5">
          The deal, in writing.
        </h1>
        <p className="text-base md:text-lg text-text-muted leading-relaxed">
          Twelve sections covering what you can expect from RecoCareer.ai and what
          we expect from you. Using the service means you agree to all of it.
        </p>
      </div>

      {/* Horizontal jump bar */}
      <div className="sticky top-[70px] z-20 -mx-5 px-5 py-3 mb-10">
        <div className="glass-panel rounded-full px-2 py-1.5 flex gap-1 overflow-x-auto scrollbar-thin [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {terms.map(({ title }) => {
            const { num, text } = splitTitle(title);
            return (
              <a
                key={title}
                href={`#${sectionId(title)}`}
                className="shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium text-text-muted hover:text-text-main hover:bg-white/50 dark:hover:bg-white/8 transition-colors"
              >
                <span className="font-mono text-[10px] text-brand-primary/70 mr-1.5">{num}</span>
                {text}
              </a>
            );
          })}
        </div>
      </div>

      {/* Continuous document */}
      <div className="glass-panel p-7 md:p-10">
        {terms.map(({ title, content }, i) => {
          const { num, text } = splitTitle(title);
          return (
            <div
              key={title}
              id={sectionId(title)}
              className={`scroll-mt-36 ${i > 0 ? 'mt-10 pt-10 border-t border-white/40 dark:border-white/8' : ''}`}
            >
              <div className="flex items-baseline gap-3 mb-4">
                <span className="font-mono text-xs font-semibold text-brand-primary">{num}</span>
                <h2 className="text-lg font-bold text-text-main">{text}</h2>
              </div>
              <div className="space-y-2.5 md:pl-8">
                {content.split('\n').filter(Boolean).map((line, li) => (
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
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Agreement notice */}
      <div className="mt-8 glass-chip px-6 py-4 text-center text-sm text-text-muted">
        By using RecoCareer.ai, you confirm that you have read, understood, and agree to these Terms of Service.
      </div>
    </section>
  </PublicLayout>
);

export default TermsPage;
