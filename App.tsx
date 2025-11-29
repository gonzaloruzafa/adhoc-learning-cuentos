import React, { useState } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { StoryDisplay } from './components/StoryDisplay';
import { StoryRequest, StoryResponse, LoadingState } from './types';
import { generateEducationalStory } from './services/gemini';

const App: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [story, setStory] = useState<StoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStoryGeneration = async (data: StoryRequest) => {
    setLoadingState(LoadingState.LOADING);
    setError(null);
    setStory(null);

    try {
      const generatedStory = await generateEducationalStory(data);
      setStory(generatedStory);
      setLoadingState(LoadingState.SUCCESS);
    } catch (err) {
      console.error(err);
      setError("Lo sentimos, hubo un problema al crear tu historia. Por favor revisa tu conexión o intenta nuevamente.");
      setLoadingState(LoadingState.ERROR);
    }
  };

  const handleReset = () => {
    setStory(null);
    setLoadingState(LoadingState.IDLE);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Header />

      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
        
        {/* Hero / Intro Text - Only show when no story is displayed */}
        {!story && (
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="font-serif text-4xl text-gray-900 mb-4 font-medium">
              Aprender es una <span className="text-adhoc-coral">aventura</span>
            </h2>
            <p className="font-sans text-lg text-gray-500">
              Transformamos conceptos complejos en historias épicas basadas en lo que más te gusta.
            </p>
          </div>
        )}

        {/* Input Form */}
        {!story && (
          <InputSection 
            onSubmit={handleStoryGeneration} 
            isLoading={loadingState === LoadingState.LOADING} 
          />
        )}

        {/* Error State */}
        {loadingState === LoadingState.ERROR && (
          <div className="bg-red-50 border-l-4 border-adhoc-coral p-4 mb-8 rounded-r-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-sans">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success / Story Display */}
        {story && (
          <StoryDisplay story={story} onReset={handleReset} />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="font-sans text-sm text-gray-400">
            © {new Date().getFullYear()} Adhoc S.A. - Soluciones Tecnológicas. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;