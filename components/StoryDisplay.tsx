import React, { useState, useRef, useEffect } from 'react';
import { StoryResponse } from '../types';
import { generateStoryAudio } from '../services/gemini';

interface StoryDisplayProps {
  story: StoryResponse;
  onReset: () => void;
}

// Helper to decode base64 to Uint8Array
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const StoryDisplay: React.FC<StoryDisplayProps> = ({ story, onReset }) => {
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handlePlayAudio = async () => {
    // If playing, stop it
    if (isPlaying) {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    // Initialize AudioContext if needed
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    try {
      setIsAudioLoading(true);

      // Fetch audio if we haven't already
      if (!audioBufferRef.current) {
        const base64Audio = await generateStoryAudio(story.content);
        
        if (!base64Audio) {
          throw new Error("Failed to generate audio");
        }

        const audioData = decodeBase64(base64Audio);
        // Decode the PCM data
        // Note: The API returns raw PCM. We need to decode it. 
        // We use the helper logic adapted for the browser's decodeAudioData which expects a full file structure or 
        // we can construct the buffer manually if we know the format (PCM 16-bit 24kHz usually).
        // However, the example uses decodeAudioData on the raw bytes if they are formatted, OR creates a buffer manually.
        // The system prompt example manually creates the buffer from Int16Array. Let's do that for safety.
        
        const dataInt16 = new Int16Array(audioData.buffer);
        const numChannels = 1;
        const sampleRate = 24000;
        const frameCount = dataInt16.length / numChannels;
        
        const buffer = audioContextRef.current.createBuffer(numChannels, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
          channelData[i] = dataInt16[i] / 32768.0;
        }
        
        audioBufferRef.current = buffer;
      }

      // Play
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
      
      audioSourceRef.current = source;
      setIsPlaying(true);

    } catch (error) {
      console.error("Error playing audio:", error);
      alert("No se pudo reproducir el audio. Por favor intenta de nuevo.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-xl border-t-4 border-adhoc-coral overflow-hidden">
        {/* Story Header */}
        <div className="bg-adhoc-lavender/20 p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <h2 className="font-serif text-3xl md:text-4xl text-adhoc-violet font-bold mb-3 leading-tight">
              {story.title}
            </h2>
            <div className="flex items-center gap-2">
              <span className="h-1 w-12 bg-adhoc-mustard rounded-full"></span>
              <span className="font-sans text-sm text-gray-500 uppercase tracking-wider">Tu Cuento Personalizado</span>
            </div>
          </div>
          
          {/* Audio Button */}
          <button 
            onClick={handlePlayAudio}
            disabled={isAudioLoading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-sans font-medium text-sm transition-all shadow-sm flex-shrink-0
              ${isPlaying 
                ? 'bg-red-100 text-red-600 border border-red-200 hover:bg-red-200' 
                : 'bg-white text-adhoc-violet border border-adhoc-violet hover:bg-adhoc-violet hover:text-white'
              } ${isAudioLoading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {isAudioLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generando Audio...</span>
              </>
            ) : isPlaying ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
                <span>Detener Audio</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Escuchar (Arg)</span>
              </>
            )}
          </button>
        </div>

        <div className="p-6 md:p-10 space-y-8">
          
          {/* Images Gallery */}
          {story.images && story.images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {story.images.map((img, index) => (
                <div key={index} className="group relative aspect-square rounded-xl overflow-hidden shadow-md border-2 border-adhoc-lavender bg-gray-100">
                   <img 
                    src={img} 
                    alt={`Ilustración del cuento ${index + 1}`} 
                    className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-adhoc-violet/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              ))}
            </div>
          )}

          {/* Story Content */}
          <div className="prose prose-lg max-w-none text-gray-700 font-sans leading-relaxed whitespace-pre-line">
            {story.content}
          </div>
        </div>

        {/* Moral / Takeaway */}
        <div className="bg-adhoc-mustard/10 p-6 md:px-10 border-t border-adhoc-mustard/20">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 bg-adhoc-mustard text-white rounded-full p-2 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-adhoc-mustard mb-1">Lo que aprendimos hoy</h3>
              <p className="font-sans text-gray-800 italic">
                {story.moralOrFact}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={onReset}
          className="px-6 py-2 rounded-lg border-2 border-adhoc-violet text-adhoc-violet font-sans font-medium hover:bg-adhoc-violet hover:text-white transition-colors"
        >
          Crear otro cuento
        </button>
      </div>
    </div>
  );
};