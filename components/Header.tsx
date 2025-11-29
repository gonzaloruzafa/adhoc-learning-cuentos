import React from 'react';
import { AdhocLogo } from './AdhocLogo';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-white border-b border-adhoc-lavender py-6 px-4 md:px-8 shadow-sm">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo oficial de Adhoc */}
          <AdhocLogo size={48} />
          <div>
            <h1 className="font-display text-2xl text-gray-900 font-bold tracking-tight">Adhoc <span className="text-adhoc-violet">Learning</span></h1>
            <p className="font-sans text-xs text-gray-500 tracking-wide uppercase">Soluciones Tecnológicas</p>
          </div>
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