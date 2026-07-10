import React, { useState } from 'react';
import Select from 'react-select';
import { getReactSelectStyles } from '../utils/reactSelectStyles';
import PublicLayout from '../components/PublicLayout';

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

const channels = [
  { icon: <MailIcon />, label: 'Email', value: 'support@recocareer.ai', sub: 'Anything, anytime' },
  { icon: <TwitterIcon />, label: 'Twitter / X', value: '@recocareer', sub: 'DMs open', href: 'https://twitter.com/recocareer' },
  { icon: <LinkedInIcon />, label: 'LinkedIn', value: 'RecoCareer AI', sub: 'Product updates', href: 'https://linkedin.com/company/recocareer' },
  { icon: <GitHubIcon />, label: 'GitHub', value: 'github.com/recocareer', sub: 'Open source bits', href: 'https://github.com' },
];

const subjectOptions = [
  'General Inquiry',
  'Bug Report',
  'Billing & Subscription',
  'Privacy / Data Request',
  'Feature Request',
  'Partnership',
  'Other',
];

const ContactPage = ({ isDark, onToggleTheme }) => {
  const [form, setForm] = useState({ name: '', email: '', subject: subjectOptions[0], message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    // Simulate send — replace with real API call
    await new Promise(res => setTimeout(res, 1400));
    setLoading(false);
    setSent(true);
  };

  return (
    <PublicLayout isDark={isDark} onToggleTheme={onToggleTheme}>
      <section className="max-w-6xl mx-auto px-5 py-16 md:py-24">
        {/* Editorial header */}
        <div className="max-w-2xl mb-14 animate-fade-in">
          <p className="kicker mb-4">Support · replies in &lt; 24h</p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-text-main leading-[1.05] mb-5">
            Talk to a human.
          </h1>
          <p className="text-base md:text-lg text-text-muted leading-relaxed">
            Bug, billing hiccup, feature idea, or just want to tell us you landed the job —
            we read everything. Pro members jump the queue.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Form — the main event */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            {sent ? (
              <div className="glass-panel p-10 flex flex-col items-center justify-center text-center gap-5 animate-fade-in">
                <div className="w-14 h-14 rounded-full glass-chip flex items-center justify-center animate-float text-brand-primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-main mb-2">On its way.</h3>
                  <p className="text-sm text-text-muted max-w-xs">
                    Thanks, <strong className="text-text-main">{form.name}</strong>. We'll reply to{' '}
                    <strong className="text-text-main">{form.email}</strong> within a day.
                  </p>
                </div>
                <button
                  onClick={() => { setSent(false); setForm({ name: '', email: '', subject: subjectOptions[0], message: '' }); }}
                  className="glass-chip glass-hover px-5 py-2.5 text-sm font-semibold text-text-main"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="glass-panel p-7 md:p-9 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">
                      Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="glass-input w-full px-4 py-3 text-sm placeholder:text-text-muted/60"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">
                      Email <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="glass-input w-full px-4 py-3 text-sm placeholder:text-text-muted/60"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted">Subject</label>
                  <Select
                    value={{ value: form.subject, label: form.subject }}
                    onChange={selected => setForm(f => ({ ...f, subject: selected.value }))}
                    options={subjectOptions.map(opt => ({ value: opt, label: opt }))}
                    styles={getReactSelectStyles()}
                    id="contact-subject-select"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted">
                    Message <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={6}
                    placeholder="What's going on?"
                    className="glass-input w-full px-4 py-3 text-sm placeholder:text-text-muted/60 resize-none"
                  />
                </div>

                {error && (
                  <p className="text-xs text-rose-500 dark:text-rose-400 animate-fade-in">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/25 btn-tactile disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Channel rail */}
          <div className="lg:col-span-2 order-1 lg:order-2 space-y-4">
            <div className="glass-panel p-2">
              {channels.map(({ icon, label, value, sub, href }, i) => {
                const inner = (
                  <>
                    <span className="w-9 h-9 rounded-xl glass-chip flex items-center justify-center text-brand-primary shrink-0">
                      {icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-text-main truncate">{value}</span>
                      <span className="block text-[11px] text-text-muted">{label} — {sub}</span>
                    </span>
                    {href && (
                      <svg className="w-3.5 h-3.5 text-text-muted shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
                      </svg>
                    )}
                  </>
                );
                const rowClass = `flex items-center gap-3.5 px-4 py-3.5 rounded-[18px] transition-colors hover:bg-white/40 dark:hover:bg-white/5 ${
                  i > 0 ? 'border-t border-white/40 dark:border-white/8 rounded-t-none' : ''
                }`;
                return href ? (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={rowClass}>
                    {inner}
                  </a>
                ) : (
                  <div key={label} className={rowClass}>
                    {inner}
                  </div>
                );
              })}
            </div>

            <div className="glass-panel p-5">
              <p className="kicker mb-2">Before you write</p>
              <p className="text-sm text-text-muted leading-relaxed">
                Billing questions? Most are answered on the{' '}
                <a href="/pricing" className="text-brand-primary font-semibold hover:underline">pricing page</a>.
                Data deletion requests go to{' '}
                <span className="font-mono text-xs text-text-main">privacy@recocareer.ai</span> and
                complete within 30 days.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default ContactPage;
