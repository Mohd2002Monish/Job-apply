import React, { useState } from 'react';
import PublicLayout from '../components/PublicLayout';

const BACKEND = 'http://localhost:3000';

const CheckIcon = ({ className = '' }) => (
  <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const XIcon = ({ className = '' }) => (
  <svg className={className} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const tiers = [
  {
    name: 'Free',
    period: 'forever',
    tagline: 'Kick the tires properly',
    features: [
      { label: '5 tracked jobs', included: true },
      { label: '3 AI feature uses/month', included: true },
      { label: 'Resume builder (3 templates)', included: true },
      { label: 'Basic outreach emails', included: true },
      { label: 'AI cover letter generator', included: false },
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
    period: 'per month',
    tagline: 'The whole arsenal, no meters running',
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
  { q: 'How does billing work?', a: 'Pro is billed monthly with regional pricing — ₹999/month in India via Razorpay and $12/month internationally via Stripe. Checkout picks the right gateway for your region automatically, and you can cancel anytime from your account.' },
  { q: 'What payment methods do you accept?', a: 'In India: UPI, credit/debit cards, and netbanking via Razorpay. Internationally: all major credit and debit cards via Stripe. Have a coupon code? Apply it at checkout for a flat or percentage discount.' },
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
      <section className="max-w-6xl mx-auto px-5 py-16 md:py-24">
        {/* Editorial header + currency toggle */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-14 animate-fade-in">
          <div className="max-w-xl">
            <p className="kicker mb-4">Pricing · {currency === 'INR' ? 'Razorpay · UPI, cards, netbanking' : 'Stripe · all major cards'}</p>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-text-main leading-[1.05] mb-5">
              One price. <br className="hidden md:block" />Everything unlocked.
            </h1>
            <p className="text-base md:text-lg text-text-muted leading-relaxed">
              Less than a food delivery order per month. Cancel in two clicks,
              refund within 7 days if it's not for you.
            </p>
          </div>

          {/* Currency toggle */}
          <div className="glass-chip p-1 flex items-center self-start md:self-auto shrink-0">
            {['INR', 'USD'].map((cur) => (
              <button
                key={cur}
                onClick={() => setCurrency(cur)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all btn-tactile ${
                  currency === cur
                    ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/25'
                    : 'text-text-muted hover:text-text-main bg-transparent border-0'
                }`}
              >
                {cur === 'INR' ? '₹ INR' : '$ USD'}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mb-20">
          {tiers.map((tier) => (
            <div key={tier.name} className="relative">
              {/* Glow behind the highlighted card */}
              {tier.highlight && (
                <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-br from-brand-primary/40 via-purple-500/30 to-brand-accent/40 blur-xl opacity-70 pointer-events-none" />
              )}

              <div className={`relative glass-panel p-8 flex flex-col gap-6 h-full ${tier.highlight ? 'border-brand-primary/30' : ''}`}>
                {tier.highlight && (
                  <div className="absolute -top-3.5 left-8">
                    <span className="px-4 py-1 rounded-full text-[11px] font-extrabold text-white bg-brand-primary shadow-lg shadow-brand-primary/30 uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}

                <div>
                  <p className="kicker mb-3">{tier.name}</p>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-5xl font-extrabold tracking-tight text-text-main">
                      {getPriceDisplay(tier.name)}
                    </span>
                    <span className="text-sm text-text-muted mb-2">/{tier.period}</span>
                  </div>
                  <p className="text-sm text-text-muted">{tier.tagline}</p>
                </div>

                <ul className="space-y-2.5 flex-1">
                  {tier.features.map(({ label, included }) => (
                    <li key={label} className="flex items-center gap-3 text-sm">
                      <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        included
                          ? 'bg-brand-primary/12 text-brand-primary'
                          : 'bg-text-muted/8 text-text-muted/40'
                      }`}>
                        {included ? <CheckIcon /> : <XIcon />}
                      </span>
                      <span className={included ? 'text-text-main' : 'text-text-muted/50 line-through decoration-text-muted/30'}>
                        {label}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={tier.ctaHref}
                  className={`w-full py-3.5 rounded-2xl text-sm font-bold text-center btn-tactile ${
                    tier.highlight
                      ? 'bg-brand-primary text-white hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/25'
                      : 'glass-chip text-text-main hover:text-brand-primary'
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ section */}
        <div className="max-w-2xl">
          <p className="kicker mb-3">Before you commit</p>
          <div className="glass-panel px-2 py-1">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-white/40 dark:border-white/8 last:border-b-0">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-left px-4 py-4 group cursor-pointer bg-transparent border-0"
                >
                  <span className={`font-semibold text-sm transition-colors ${openFaq === i ? 'text-brand-primary' : 'text-text-main group-hover:text-brand-primary'}`}>
                    {faq.q}
                  </span>
                  <span className={`text-text-muted group-hover:text-brand-primary transition-all duration-300 flex-shrink-0 ${openFaq === i ? 'rotate-45 text-brand-primary' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </span>
                </button>
                {openFaq === i && (
                  <p className="px-4 pb-5 -mt-1 text-sm text-text-muted leading-relaxed animate-fade-in">
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
