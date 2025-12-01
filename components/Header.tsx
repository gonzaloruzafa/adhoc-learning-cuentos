import React from 'react';
import { AdhocLogo } from './AdhocLogo';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-white border-b border-adhoc-lavender py-6 px-4 md:px-8 shadow-sm">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Adhoc Logo */}
          <a href="https://www.adhoc.inc" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
            <img src="/adhoc-logo.png" alt="Adhoc Learning" className="h-10 w-auto" />
          </a>
        </div>
        <div className="hidden md:block">
           <span className="px-3 py-1 bg-adhoc-lavender/30 text-adhoc-violet rounded-full text-sm font-medium">
             Edición Educativa
           </span>
        </div>
      </div>
    </header>
  );
};