import React, { useState } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { StoryDisplay } from './components/StoryDisplay';
import { StoryRequest, StoryResponse, LoadingState } from './types';
import { generateEducationalStory } from './services/gemini';
import { logStoryGeneration, updateListenStatus } from './services/supabase';

const App: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [story, setStory] = useState<StoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storyLogId, setStoryLogId] = useState<string | null>(null);
  const [storyRequest, setStoryRequest] = useState<StoryRequest | null>(null);

  const handleStoryGeneration = async (data: StoryRequest) => {
    setLoadingState(LoadingState.LOADING);
    setLoadingProgress(0);
    setError(null);
    setStory(null);
    setStoryRequest(data);

    // Simulate progress while generating (takes ~20-40 seconds)
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 3;
      });
    }, 800);

    try {
      setLoadingProgress(10);
      const generatedStory = await generateEducationalStory(data);
      clearInterval(progressInterval);
      setLoadingProgress(100);

      // Log to Supabase FIRST to get the ID
      const logResult = await logStoryGeneration({
        concept: data.concept,
        interests: data.interest,
        story_content: JSON.stringify(generatedStory),
        listened: false
      });

      // Set ID before showing the story
      if (logResult?.id) {
        setStoryLogId(logResult.id);
      }
      
      // Now show the story with the ID already set
      setStory(generatedStory);
      setLoadingState(LoadingState.SUCCESS);
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error(err);
      // Show specific error message if it's a safety block
      const errorMessage = err?.message?.includes('seguridad') 
        ? err.message 
        : "Lo sentimos, hubo un problema al crear tu historia. Por favor revisá tu conexión o intentá nuevamente.";
      setError(errorMessage);
      setLoadingState(LoadingState.ERROR);
      setLoadingProgress(0);
    }
  };

  const handleListenStart = () => {
    if (storyLogId) {
      updateListenStatus(storyLogId, true);
    }
  };

  const handleReset = () => {
    setStory(null);
    setLoadingState(LoadingState.IDLE);
    setLoadingProgress(0);
    setError(null);
    setStoryLogId(null);
    setStoryRequest(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] relative">
      <Header />

      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 md:py-12 relative">
        {/* Watermark - only visible on landing */}
        {!story && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-5 overflow-hidden">
            <img 
              src="/smiley-watermark.png" 
              alt="" 
              className="w-80 h-80 object-contain"
            />
          </div>
        )}
        
        {/* Hero / Intro Text - Only show when no story is displayed */}
        {!story && (
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="font-display text-4xl text-gray-900 mb-4 font-normal">
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
            loadingProgress={loadingProgress}
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
          <StoryDisplay 
            story={story} 
            onReset={handleReset} 
            onListenStart={handleListenStart}
            storyLogId={storyLogId || undefined}
            concept={storyRequest?.concept}
            interest={storyRequest?.interest}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-2">
          <p className="font-sans text-sm text-gray-500">
            <a 
              href="https://www.adhoc.inc" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-adhoc-violet hover:text-adhoc-coral transition-colors font-medium"
            >
              Conocé más sobre la tecnología de Adhoc →
            </a>
          </p>
          <p className="font-sans text-sm text-gray-400">
            © {new Date().getFullYear()} Adhoc S.A. - Soluciones Tecnológicas. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
