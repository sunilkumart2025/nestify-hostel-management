import React, { useEffect } from 'react';

const AccessibilityHelper = () => {
  useEffect(() => {
    // Add keyboard navigation support
    const handleKeyDown = (e) => {
      // Skip to main content with Alt+M
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        const main = document.querySelector('main');
        if (main) {
          main.focus();
          main.scrollIntoView();
        }
      }
      
      // Skip to navigation with Alt+N
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        const nav = document.querySelector('nav');
        if (nav) {
          const firstLink = nav.querySelector('a');
          if (firstLink) firstLink.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="sr-only">
      <a href="#main-content" className="skip-link">
        Skip to main content (Alt+M)
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation (Alt+N)
      </a>
    </div>
  );
};

export default AccessibilityHelper;