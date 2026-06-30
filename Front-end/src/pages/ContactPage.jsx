import React, { useState } from 'react';
import PublicLayout from '../components/PublicLayout';

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

const contactMethods = [
  {
    icon: <MailIcon />,
    label: 'Email',
    value: 'support@recocareer.ai',
    sub: 'We respond within 24 hours',
    color: 'indigo',
  },
  {
    icon: <TwitterIcon />,
    label: 'Twitter / X',
    value: '@recocareer',
    sub: 'DMs open for quick questions',
    color: 'sky',
    href: 'https://twitter.com/recocareer',
  },
  {
    icon: <LinkedInIcon />,
    label: 'LinkedIn',
    value: 'RecoCareer AI',
    sub: 'Follow us for updates',
    color: 'blue',
    href: 'https://linkedin.com/company/recocareer',
  },
  {
    icon: <GitHubIcon />,
    label: 'GitHub',
    value: 'github.com/recocareer',
    sub: 'Open source components',
    color: 'violet',
    href: 'https://github.com',
  },
];

const colorMap = {
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
};

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
      <section className="max-w-5xl mx-auto px-5 py-20">
        {/* Header */}
        <div className="text-center mb-14 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl neo-card flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-50 mb-4">
            Get in <span className="text-gradient">Touch</span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Have a question, feedback, or partnership idea? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Contact methods */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-5">Reach us on</h2>
            {contactMethods.map(({ icon, label, value, sub, color, href }) => (
              <div
                key={label}
                className="neo-card p-5 flex items-center gap-4 group cursor-default"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate block"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{value}</p>
                  )}
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}

            {/* Response time note */}
            <div className="neo-card-inset p-4 mt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                <strong className="text-slate-700 dark:text-slate-300">Average response time:</strong> Under 24 hours on business days. Priority support for Pro users.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            {sent ? (
              <div className="neo-card p-10 flex flex-col items-center justify-center text-center gap-5 h-full animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center animate-float">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Message Sent!</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                    Thanks for reaching out, <strong>{form.name}</strong>. We'll get back to you at <strong>{form.email}</strong> within 24 hours.
                  </p>
                </div>
                <button
                  onClick={() => { setSent(false); setForm({ name: '', email: '', subject: subjectOptions[0], message: '' }); }}
                  className="neo-btn px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="neo-card p-8 space-y-5">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Send us a message</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="neo-input w-full px-4 py-3 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Email <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="neo-input w-full px-4 py-3 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Subject</label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className="neo-input w-full px-4 py-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    {subjectOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Message <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Tell us how we can help..."
                    className="neo-input w-full px-4 py-3 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none"
                  />
                </div>

                {error && (
                  <p className="text-xs text-rose-500 dark:text-rose-400 animate-fade-in">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
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
        </div>
      </section>
    </PublicLayout>
  );
};

export default ContactPage;
