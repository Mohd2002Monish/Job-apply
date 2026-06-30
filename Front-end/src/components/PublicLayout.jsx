import React from 'react';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';

const PublicLayout = ({ children, isDark, onToggleTheme }) => (
  <div className="public-page flex flex-col">
    <PublicNavbar isDark={isDark} onToggleTheme={onToggleTheme} />
    <main className="flex-1 pt-[70px]">
      {children}
    </main>
    <PublicFooter />
  </div>
);

export default PublicLayout;
