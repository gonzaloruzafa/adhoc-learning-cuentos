import React, { useState } from 'react';
import { StoryRequest } from '../types';

interface InputSectionProps {
  onSubmit: (data: StoryRequest) => void;
  isLoading: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onSubmit, isLoading }) => {
  const [concept, setConcept] = useState('');
  const [interest, setInterest] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (concept.trim() && interest.trim()) {
      onSubmit({ concept, interest });
    }
  };

  return (
    <section className="bg-white rounded-2xl shadow-lg border border-adhoc-lavender p-6 md:p-8 mb-8">
      <div className="mb-6">
        <h2 className="font-serif text-2xl md:text-3xl text-adhoc-violet mb-2">
          ¿Qué quieres aprender hoy?
        </h2>
        <p className="font-sans text-gray-600">
          Cuéntanos un tema difícil y algo que te apasione. Nosotros haremos la magia.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="concept" className="block font-sans font-medium text-gray-700 mb-2">
            Concepto a Aprender
          </label>
          <input
            id="concept"
            type="text"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Ej: Cómo llega un cohete a la luna, La fotosíntesis..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-adhoc-violet focus:ring-2 focus:ring-adhoc-lavender outline-none transition-all font-sans text-gray-800 placeholder-gray-400"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="interest" className="block font-sans font-medium text-gray-700 mb-2">
            Tus Intereses / Gustos
          </label>
          <input
            id="interest"
            type="text"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            placeholder="Ej: Los Ninjas, Dragon Ball Z, Minecraft..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-adhoc-coral focus:ring-2 focus:ring-orange-100 outline-none transition-all font-sans text-gray-800 placeholder-gray-400"
            disabled={isLoading}
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading || !concept || !interest}
            className={`w-full md:w-auto px-8 py-3 rounded-full font-sans font-semibold text-white transition-all transform hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2
              ${isLoading || !concept || !interest 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-adhoc-violet hover:bg-[#6858c5] active:bg-[#5a4ba8]'
              }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generando Historia...
              </>
            ) : (
              'Crear Historia Mágica'
            )}
          </button>
        </div>
      </form>
    </section>
  );
};