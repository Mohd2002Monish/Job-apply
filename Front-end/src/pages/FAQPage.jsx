import React, { useState } from 'react';
import PublicLayout from '../components/PublicLayout';

const PlusIcon = ({ rotate }) => (
  <svg
    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.3s ease', transform: rotate ? 'rotate(45deg)' : 'rotate(0deg)' }}
  >
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const categories = [
  {
    title: 'General',
    color: 'indigo',
    items: [
      {
        q: 'What is RecoCareer.ai?',
        a: 'RecoCareer.ai is an AI-powered job application management platform. It helps you track applications, write targeted outreach emails, generate cover letters, practice interview skills, and auto-fill job application forms — all in one place.',
      },
      {
        q: 'Do I need to create an account?',
        a: 'Yes. You can sign in with your Google or Microsoft account in one click — no password needed. Your data is stored securely on our servers.',
      },
      {
        q: 'Is my data safe?',
        a: 'Absolutely. We use industry-standard encryption for data in transit and at rest. We never sell your data to third parties. See our Privacy Policy for full details.',
      },
      {
        q: 'What browsers are supported?',
        a: 'RecoCareer.ai works best on Google Chrome, Apple Safari, Microsoft Edge, and Firefox. Some AI voice features require Chrome or Edge for the Web Speech API.',
      },
    ],
  },
  {
    title: 'Pricing & Billing',
    color: 'violet',
    items: [
      {
        q: 'What is included in the free tier?',
        a: 'The free tier includes tracking up to 5 jobs, 3 AI feature uses per month, access to the resume builder with 3 templates, and basic outreach email generation.',
      },
      {
        q: 'How much does Pro cost?',
        a: 'Pro is $12/month, billed monthly via Stripe. You get unlimited job tracking, unlimited AI features, all resume templates, and all advanced tools.',
      },
      {
        q: 'Can I cancel my subscription anytime?',
        a: 'Yes! You can cancel from your Profile Settings at any time. Your Pro access continues until the end of the current billing period — no partial refunds.',
      },
      {
        q: 'Do you offer refunds?',
        a: 'We offer refunds within 7 days of your first Pro purchase if you are not satisfied. Contact us at support@recocareer.ai to request one.',
      },
    ],
  },
  {
    title: 'Features',
    color: 'purple',
    items: [
      {
        q: 'How does the AI outreach email work?',
        a: 'When you add a job, our AI analyzes the job description and your resume to craft a personalized outreach email. You can choose length, tone, and word count. Then send directly from RecoCareer.ai if you have Gmail or Outlook connected.',
      },
      {
        q: 'What is the voice interview practice feature?',
        a: 'The Voice Practice tab lets you answer interview questions out loud. We analyze your speech in real-time: pacing, filler words, sentiment, and give you an AI-graded score with detailed feedback.',
      },
      {
        q: 'How does auto form fill work?',
        a: 'Our Chrome extension detects job application forms and maps your profile data to the right fields automatically. You review and submit — saving you 10–15 minutes per application.',
      },
      {
        q: 'Can I use multiple resumes?',
        a: 'Yes! Pro users can create and manage multiple resume versions and select which one to use per job application or outreach email.',
      },
    ],
  },
  {
    title: 'Privacy',
    color: 'emerald',
    items: [
      {
        q: 'What data do you collect?',
        a: 'We collect your email, name, and profile picture from your OAuth provider. We also store resume data, job application records, and AI interaction logs to power the platform features.',
      },
      {
        q: 'Do you share my data with employers?',
        a: 'Never. Your job tracker data, resume content, and application notes are completely private and are never shared with employers or third parties.',
      },
      {
        q: 'Can I delete my account and data?',
        a: 'Yes. You can request full account deletion from the Contact page or by emailing privacy@recocareer.ai. We will delete all your data within 30 days.',
      },
    ],
  },
];

const colorMap = {
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

const FAQPage = ({ isDark, onToggleTheme }) => {
  const [openItems, setOpenItems] = useState({});

  const toggle = (catIdx, itemIdx) => {
    const key = `${catIdx}-${itemIdx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <PublicLayout isDark={isDark} onToggleTheme={onToggleTheme}>
      <section className="max-w-4xl mx-auto px-5 py-20">
        {/* Hero */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl neo-card flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-50 mb-4">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Find answers to common questions about RecoCareer.ai. Can't find what you need?{' '}
            <a href="/contact" className="text-indigo-500 hover:underline">Contact us</a>.
          </p>
        </div>

        {/* Category tabs hint */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {categories.map(({ title, color }) => (
            <span key={title} className={`px-3.5 py-1.5 rounded-full text-xs font-bold neo-card-inset ${colorMap[color]}`}>
              {title}
            </span>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-10">
          {categories.map((cat, catIdx) => (
            <div key={catIdx}>
              <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 ${colorMap[cat.color]}`}>{cat.title}</h2>
              <div className="space-y-3">
                {cat.items.map((item, itemIdx) => {
                  const key = `${catIdx}-${itemIdx}`;
                  const isOpen = !!openItems[key];
                  return (
                    <div
                      key={itemIdx}
                      className="neo-card p-5 cursor-pointer select-none"
                      onClick={() => toggle(catIdx, itemIdx)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-snug flex-1">
                          {item.q}
                        </span>
                        <span className={`flex-shrink-0 mt-0.5 ${colorMap[cat.color]}`}>
                          <PlusIcon rotate={isOpen} />
                        </span>
                      </div>
                      {isOpen && (
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-200/50 dark:border-slate-800/50 pt-3 animate-fade-in">
                          {item.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 neo-card p-8 text-center">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Still have questions?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Our team is ready to help you within 24 hours.</p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
          >
            Contact Support
          </a>
        </div>
      </section>
    </PublicLayout>
  );
};

export default FAQPage;
