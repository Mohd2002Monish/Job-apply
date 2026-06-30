import React, { useState } from 'react';
import PublicLayout from '../components/PublicLayout';

const BACKEND = 'http://localhost:3000';

const CheckIcon = ({ className = '' }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const XIcon = ({ className = '' }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const ZapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    tagline: 'Perfect to get started',
    accent: 'slate',
    features: [
      { label: '5 tracked jobs', included: true },
      { label: '3 AI feature uses/month', included: true },
      { label: 'Resume builder (3 templates)', included: true },
      { label: 'Basic outreach emails', included: true },
      { label: 'Cover letter generator', included: false },
      { label: 'Unlimited job tracking', included: false },
      { label: 'Voice interview practice', included: false },
      { label: 'Salary negotiation tool', included: false },
      { label: 'Auto form fill (AI)', included: false },
      { label: 'Priority support', included: false },
    ],
    cta: 'Start for Free',
    ctaHref: `${BACKEND}/auth/google`,
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: 'per month',
    tagline: 'Everything you need to land the job',
    accent: 'indigo',
    features: [
      { label: 'Unlimited job tracking', included: true },
      { label: 'Unlimited AI features', included: true },
      { label: 'All resume templates + builder', included: true },
      { label: 'Smart outreach emails', included: true },
      { label: 'AI cover letter generator', included: true },
      { label: 'Voice interview practice', included: true },
      { label: 'Salary negotiation tool', included: true },
      { label: 'Auto form fill (AI)', included: true },
      { label: 'Job discovery & import', included: true },
      { label: 'Priority support', included: true },
    ],
    cta: 'Upgrade to Pro',
    ctaHref: `${BACKEND}/auth/google`,
    highlight: true,
  },
];

const faqs = [
  { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your Pro subscription at any time from your profile settings. Your access continues until the end of the billing period.' },
  { q: 'Is there a free trial for Pro?', a: 'Our Free tier gives you full access to core features with generous limits. You can upgrade to Pro whenever you need more power.' },
  { q: 'How does billing work?', a: 'Pro is billed monthly via Stripe. You can cancel, pause, or change your plan anytime from your account.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards via Stripe. More payment options coming soon.' },
];

const PricingPage = ({ isDark, onToggleTheme }) => {
  const [openFaq, setOpenFaq] = useState(null);
  const [currency, setCurrency] = useState('INR');

  React.useEffect(() => {
    // Guess by timezone first
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && tz.startsWith('Asia/')) {
        setCurrency('INR');
      } else {
        setCurrency('USD');
      }
    } catch (e) {}

    // Verify with public IP
    fetch('https://ipapi.co/json/')
      .then(res => {
        if (!res.ok) throw new Error('IP API error');
        return res.json();
      })
      .then(data => {
        if (data && data.country_code) {
          if (data.country_code === 'IN') {
            setCurrency('INR');
          } else {
            setCurrency('USD');
          }
        }
      })
      .catch(() => {});
  }, []);

  const getPriceDisplay = (tierName) => {
    if (tierName === 'Free') return currency === 'INR' ? '₹0' : '$0';
    return currency === 'INR' ? '₹999' : '$12';
  };

  return (
    <PublicLayout isDark={isDark} onToggleTheme={onToggleTheme}>
      <section className="max-w-6xl mx-auto px-5 py-20">
        {/* Hero */}
        <div className="text-center mb-16 animate-fade-in">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-indigo-600 dark:text-indigo-400 neo-card-inset mb-5">
            <ZapIcon />
            Simple, Transparent Pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-50 leading-tight mb-4">
            Invest in your <span className="text-gradient">career success</span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Start free. Upgrade when you're ready to go all-in on landing your dream job.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-20">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative p-8 flex flex-col gap-6 transition-all duration-300 ${
                tier.highlight
                  ? 'neo-card animate-pulse-glow border-2 border-indigo-500/30'
                  : 'neo-card'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full text-[11px] font-extrabold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}

              <div>
                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-2">{tier.name}</h2>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-5xl font-extrabold text-slate-900 dark:text-slate-50">
                    {getPriceDisplay(tier.name)}
                  </span>
                  <span className="text-sm text-slate-400 dark:text-slate-500 mb-2">/{tier.period}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{tier.tagline}</p>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 flex-1">
                {tier.features.map(({ label, included }) => (
                  <li key={label} className="flex items-center gap-3 text-sm">
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      included
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'bg-slate-100 dark:bg-slate-800/60 text-slate-300 dark:text-slate-600'
                    }`}>
                      {included ? <CheckIcon /> : <XIcon />}
                    </span>
                    <span className={included ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600 line-through decoration-slate-300'}>
                      {label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={tier.ctaHref}
                className={`w-full py-3.5 rounded-xl text-sm font-bold text-center transition-all duration-200 ${
                  tier.highlight
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5'
                    : 'neo-btn text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        {/* FAQ section */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-8">Pricing Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="neo-card p-5 cursor-pointer" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{faq.q}</span>
                  <span className={`text-indigo-500 transition-transform duration-300 flex-shrink-0 ${openFaq === i ? 'rotate-45' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </span>
                </div>
                {openFaq === i && (
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed animate-fade-in">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default PricingPage;
