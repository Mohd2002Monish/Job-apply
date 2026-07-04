import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Logo = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="9" fill="url(#logoGradNav)" />
    <path d="M8 22l6-8 4 5 3-4 5 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="logoGradNav" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366f1"/>
        <stop offset="1" stopColor="#10b981"/>
      </linearGradient>
    </defs>
  </svg>
);

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const XIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const navLinks = [
  { label: 'Pricing', to: '/pricing' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
  { label: 'Contact', to: '/contact' },
];

const PublicNavbar = ({ isDark, onToggleTheme }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isActive = (to) => location.pathname === to;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-bg-app/80 backdrop-blur-md border-b border-border-card shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0 btn-tactile">
            <div className="transition-transform duration-300 group-hover:scale-105">
              <Logo />
            </div>
            <span className="font-extrabold text-base tracking-tight text-text-main">
              Reco<span className="text-gradient">Career</span>
              <span className="text-text-muted font-medium">.ai</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-xl text-sm font-medium btn-tactile transition-all duration-150 ${
                  isActive(to)
                    ? 'bg-brand-primary/10 text-brand-primary font-bold border border-brand-primary/20'
                    : 'text-text-muted hover:text-text-main hover:bg-bg-card-hover'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl border border-border-card bg-bg-card text-text-muted hover:text-brand-primary hover:bg-bg-card-hover transition-colors btn-tactile"
              aria-label="Toggle theme"
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            <Link
              to="/"
              className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-hover shadow-md shadow-brand-primary/20 transition-all btn-tactile"
            >
              Get Started
            </Link>

            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden p-2.5 rounded-xl border border-border-card bg-bg-card text-text-muted btn-tactile"
              aria-label="Menu"
            >
              {menuOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="fixed inset-x-0 top-[62px] z-40 bg-bg-card/95 backdrop-blur-lg border-b border-border-card shadow-xl animate-fade-in md:hidden">
          <div className="max-w-6xl mx-auto px-5 py-4 flex flex-col gap-1">
            {navLinks.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-3 rounded-xl text-sm font-medium btn-tactile ${
                  isActive(to)
                    ? 'bg-brand-primary/10 text-brand-primary font-bold'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              to="/"
              className="mt-2 px-4 py-3 rounded-xl text-sm font-bold text-white text-center bg-brand-primary shadow-md btn-tactile"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default PublicNavbar;
