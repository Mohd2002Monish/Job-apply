import React from 'react';
import { Link } from 'react-router-dom';

const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 1 12.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

const Logo = () => (
  <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="9" fill="url(#footerLogoGrad)" />
    <path d="M8 22l6-8 4 5 3-4 5 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="footerLogoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366f1"/><stop offset="1" stopColor="#10b981"/>
      </linearGradient>
    </defs>
  </svg>
);

const socialLinks = [
  { icon: <TwitterIcon />, href: 'https://twitter.com', label: 'Twitter/X' },
  { icon: <LinkedInIcon />, href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: <GitHubIcon />, href: 'https://github.com/Mohd2002Monish/Job-apply', label: 'GitHub' },
];

const footerCols = [
  {
    title: 'Product',
    links: [
      { label: 'Features', to: '/' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'How it Works', to: '/' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'FAQ', to: '/faq' },
      { label: 'Contact Us', to: '/contact' },
    ],
  },
];

const PublicFooter = () => (
  <footer className="bg-bg-card border-t border-border-card mt-16">
    <div className="max-w-6xl mx-auto px-5 py-14">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-8">
        {/* Brand column */}
        <div className="md:col-span-2 space-y-4">
          <Link to="/" className="flex items-center gap-2.5 group w-fit btn-tactile">
            <Logo />
            <span className="font-extrabold text-base tracking-tight text-text-main">
              Reco<span className="text-gradient">Career</span>
              <span className="text-text-muted font-medium">.ai</span>
            </span>
          </Link>
          <p className="text-sm text-text-muted leading-relaxed max-w-xs">
            The AI-powered job application platform that helps you track, apply, and land your dream job faster.
          </p>
          {/* Social icons */}
          <div className="flex items-center gap-3 pt-1">
            {socialLinks.map(({ icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-9 h-9 rounded-xl border border-border-card bg-bg-app flex items-center justify-center text-text-muted hover:text-brand-primary hover:border-brand-primary/30 transition-all btn-tactile"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {footerCols.map(({ title, links }) => (
          <div key={title} className="space-y-3">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest">{title}</h4>
            <ul className="space-y-2.5">
              {links.map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-sm text-text-muted hover:text-text-main transition-colors btn-tactile inline-block"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 pt-6 border-t border-border-card flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
        <p>© {new Date().getFullYear()} RecoCareer.ai · All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-brand-primary transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-brand-primary transition-colors">Terms</Link>
          <Link to="/contact" className="hover:text-brand-primary transition-colors">Contact</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default PublicFooter;
