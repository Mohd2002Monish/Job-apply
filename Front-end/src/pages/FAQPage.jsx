import React, { useState, useMemo, useEffect } from 'react';
import PublicLayout from '../components/PublicLayout';

const ChevronIcon = ({ open }) => (
  <svg
    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.3s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const categories = [
  {
    title: 'General',
    items: [
      {
        q: 'What is RecoCareer.ai?',
        a: 'RecoCareer.ai is an AI-powered job application suite. It parses your resume, scores it against job descriptions (ATS match), builds and exports polished resumes, writes tailored cover letters and outreach emails you send from your own Gmail or Outlook, tracks when recruiters open them, and helps you practice interviews — all in one dashboard.',
      },
      {
        q: 'Do I need to create an account?',
        a: 'Yes. You sign in with your Google or Microsoft account in one click via OAuth 2.0 — no password is ever created or stored. Your session is kept in a secure HTTP-only cookie.',
      },
      {
        q: 'Why does RecoCareer.ai ask for email sending permission?',
        a: 'We request the gmail.send (Google) or Mail.Send (Microsoft) scope so outreach emails and follow-ups are sent from your own inbox — recruiters see your real address, which dramatically improves deliverability and reply rates. We cannot read your mailbox, and we never send anything without your explicit action.',
      },
      {
        q: 'Is my data safe?',
        a: 'Yes. All traffic is encrypted with HTTPS/TLS, sensitive credentials are encrypted at rest with AES-256-GCM, and we never sell your data to third parties. See our Privacy Policy for the full details.',
      },
      {
        q: 'What browsers are supported?',
        a: 'RecoCareer.ai works best on Google Chrome, Apple Safari, Microsoft Edge, and Firefox. The voice interview practice feature requires Chrome or Edge for the Web Speech API, and the job import extension is Chrome-only (Manifest V3).',
      },
    ],
  },
  {
    title: 'Pricing & Billing',
    items: [
      {
        q: 'How much does Pro cost?',
        a: 'Pro is ₹999/month in India and $12/month internationally. Checkout automatically routes to the right payment gateway for your region — Razorpay for Indian cards and UPI, Stripe for international cards.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'In India (via Razorpay): UPI, credit/debit cards, and netbanking. Internationally (via Stripe): all major credit and debit cards. We never see or store your card details — payments are handled entirely by the gateway.',
      },
      {
        q: 'Do you support discount coupons?',
        a: 'Yes. If you have a coupon code (flat amount or percentage discount), apply it at checkout. Coupons can have expiry dates and usage limits, so redeem them while they are valid.',
      },
      {
        q: 'How does the referral program work?',
        a: 'Every account gets a unique referral link in Profile Settings. Share it and track link clicks and conversions in real time — you earn rewards when people you refer upgrade to Pro.',
      },
      {
        q: 'Can I cancel my subscription anytime?',
        a: 'Yes. You can cancel from Profile Settings at any time. Your Pro access continues until the end of the current billing period — no partial refunds for the remaining days.',
      },
      {
        q: 'Do you offer refunds?',
        a: 'We offer refunds within 7 days of your first Pro purchase if you are not satisfied. Contact us at support@recocareer.ai to request one.',
      },
    ],
  },
  {
    title: 'Features',
    items: [
      {
        q: 'How does the AI outreach email work?',
        a: 'When you add a job, the AI combines the job description with your primary resume to craft a personalized outreach email. You control tone (professional, confident, passionate) and word count with sliders, then send it directly from your connected Gmail or Outlook with your resume PDF attached.',
      },
      {
        q: 'How do I know if a recruiter opened my email?',
        a: 'Outreach emails include an invisible tracking pixel and wrapped portfolio links. The moment the recruiter opens the email or clicks a link, your dashboard status updates to "Opened" or "Clicked" in real time. If there is no reply, the system can auto-send a polite follow-up.',
      },
      {
        q: 'What is the voice interview practice feature?',
        a: 'The AI generates 8 interview questions tailored to the specific job description (technical, behavioral, and situational). Answer them out loud — your speech is analyzed for pacing, filler words, and sentiment — or in writing, and you get a 1–10 grade plus a model answer.',
      },
      {
        q: 'How does the Chrome extension work?',
        a: 'While browsing LinkedIn, Indeed, or other job boards, one click scrapes the active posting — title, company, recruiter contact, and full description — and imports it straight into your dashboard.',
      },
      {
        q: 'Can I use multiple resumes?',
        a: 'Yes. Upload or build multiple resume versions for different industries, and pick a "primary" resume that powers ATS scoring, cover letters, and outreach attachments. You can switch the active resume anytime from the sidebar.',
      },
      {
        q: 'What export formats does the resume builder support?',
        a: 'Pixel-perfect PDF (rendered through a headless browser so print matches screen exactly) and fully editable DOCX. Three templates are included — Classic, Modern, and Minimal — and you can switch between them without losing data.',
      },
    ],
  },
  {
    title: 'Privacy',
    items: [
      {
        q: 'What data do you collect?',
        a: 'We collect your name, email, and profile picture from your OAuth provider, plus the resume data, job records, and outreach history you create in the app. AI request counts and token usage are logged for billing and abuse prevention.',
      },
      {
        q: 'Do you share my data with employers?',
        a: 'Never. Your job tracker, resume content, and application notes are completely private. Only the emails you explicitly choose to send ever reach a recruiter.',
      },
      {
        q: 'Is my resume used to train AI models?',
        a: 'No. Your resume and job data are sent to the AI provider (Google Gemini) only to generate outputs for you — cover letters, scores, and replies. We do not use your data to train models.',
      },
      {
        q: 'Can I delete my account and data?',
        a: 'Yes. Request full account deletion from the Contact page or by emailing privacy@recocareer.ai. All your personal data is permanently deleted within 30 days.',
      },
    ],
  },
];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const FAQPage = ({ isDark, onToggleTheme }) => {
  const [openItems, setOpenItems] = useState({});
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState('');

  const toggle = (key) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map(cat => ({
        ...cat,
        items: cat.items.filter(it => it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)),
      }))
      .filter(cat => cat.items.length > 0);
  }, [query]);

  useEffect(() => {
    const handleScroll = () => {
      const elements = categories.map(c => document.getElementById(slugify(c.title))).filter(Boolean);
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

  const totalCount = categories.reduce((n, c) => n + c.items.length, 0);

  return (
    <PublicLayout isDark={isDark} onToggleTheme={onToggleTheme}>
      <section className="max-w-6xl mx-auto px-5 py-16 md:py-24">
        {/* Editorial header */}
        <div className="max-w-2xl mb-12 animate-fade-in">
          <p className="kicker mb-4">{totalCount} questions · 4 topics</p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-text-main leading-[1.05] mb-5">
            Questions, answered.
          </h1>
          <p className="text-base md:text-lg text-text-muted leading-relaxed">
            The stuff people actually ask us — pricing, permissions, tracking, and what
            happens to your data. Missing something?{' '}
            <a href="/contact" className="text-brand-primary font-semibold hover:underline">Ask us directly</a>.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Sticky rail: search + topic anchors */}
          <aside className="lg:sticky lg:top-20 space-y-4">
            <div className="glass-panel p-1.5">
              <div className="relative">
                <svg className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search answers…"
                  className="w-full bg-transparent pl-10 pr-4 py-2.5 text-sm text-text-main placeholder:text-text-muted/60 outline-none"
                />
              </div>
            </div>

            <nav className="glass-panel p-2 hidden lg:block rounded-3xl space-y-1">
              {categories.map(({ title, items }) => {
                const id = slugify(title);
                const isActive = activeId === id;
                return (
                  <a
                    key={title}
                    href={`#${id}`}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-primary/10 text-brand-primary font-bold border border-brand-primary/20 shadow-xs'
                        : 'text-text-muted hover:text-text-main hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <span>{title}</span>
                    <span className={`text-[10px] font-mono ${isActive ? 'text-brand-primary font-bold' : 'text-text-muted/70'}`}>{items.length}</span>
                  </a>
                );
              })}
            </nav>
          </aside>

          {/* Answer panels */}
          <div className="lg:col-span-3 space-y-8">
            {filtered.length === 0 && (
              <div className="glass-panel p-10 text-center">
                <p className="text-sm text-text-muted">
                  Nothing matches “{query}”. Try different words, or{' '}
                  <a href="/contact" className="text-brand-primary font-semibold hover:underline">ask us</a>.
                </p>
              </div>
            )}

            {filtered.map((cat) => (
              <div key={cat.title} id={slugify(cat.title)} className="scroll-mt-24">
                <p className="kicker mb-3 pl-1">{cat.title}</p>
                <div className="glass-panel px-2 py-1">
                  {cat.items.map((item) => {
                    const key = `${cat.title}-${item.q}`;
                    const isOpen = !!openItems[key];
                    return (
                      <div
                        key={item.q}
                        className="border-b border-white/40 dark:border-white/8 last:border-b-0"
                      >
                        <button
                          onClick={() => toggle(key)}
                          className="w-full flex items-center justify-between gap-4 text-left px-4 py-4 group cursor-pointer bg-transparent border-0"
                        >
                          <span className={`font-semibold text-sm leading-snug transition-colors ${isOpen ? 'text-brand-primary' : 'text-text-main group-hover:text-brand-primary'}`}>
                            {item.q}
                          </span>
                          <span className="shrink-0 text-text-muted group-hover:text-brand-primary transition-colors">
                            <ChevronIcon open={isOpen} />
                          </span>
                        </button>
                        {isOpen && (
                          <p className="px-4 pb-5 -mt-1 text-sm text-text-muted leading-relaxed animate-fade-in">
                            {item.a}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Bottom CTA */}
            <div className="glass-panel p-7 flex flex-col sm:flex-row items-center justify-between gap-5">
              <div>
                <h3 className="text-base font-bold text-text-main mb-1">Still stuck?</h3>
                <p className="text-sm text-text-muted">Real replies from real people, within 24 hours.</p>
              </div>
              <a
                href="/contact"
                className="shrink-0 px-6 py-3 rounded-2xl text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/25 btn-tactile"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default FAQPage;
