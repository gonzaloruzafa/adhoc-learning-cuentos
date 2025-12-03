import React, { useState, useRef, useEffect } from 'react';
import { StoryResponse } from '../types';
import { generateStoryAudio, generateShareMessage } from '../services/gemini';
import { supabase, updateStoryAudio } from '../services/supabase';

interface StoryDisplayProps {
  story: StoryResponse;
  onReset?: () => void;
  onListenStart?: () => void;
  storyLogId?: string;
  onNewStory?: () => void;
  concept?: string;
  interest?: string;
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

export const StoryDisplay: React.FC<StoryDisplayProps> = ({ story, onReset, onListenStart, storyLogId, onNewStory, concept, interest }) => {
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const hasCalledListenStart = useRef(false);

  const handleShareStory = async () => {
    if (!storyLogId) return;
    
    const shareUrl = `${window.location.origin}/cuento/${storyLogId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 3000);
    } catch (err) {
      alert('No se pudo copiar el link. Intentá de nuevo.');
    }
  };

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

    // Call onListenStart only once
    if (!hasCalledListenStart.current && onListenStart) {
      onListenStart();
      hasCalledListenStart.current = true;
    }

    try {
      setIsAudioLoading(true);
      setLoadingProgress(0);

      // Initialize AudioContext if needed (iOS requires this after user interaction)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      // iOS requires resuming the context
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Fetch audio if we haven't already
      if (!audioBufferRef.current) {
        let base64Audio: string | null = null;
        let progressInterval: NodeJS.Timeout | null = null;
        
        // Try to load from database first
        if (storyLogId) {
          setLoadingProgress(10);
          
          // Start progress animation
          progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
              if (prev >= 80) return prev;
              return prev + 10;
            });
          }, 200);
          
          const { data } = await supabase
            .from('story_logs')
            .select('audio_data')
            .eq('id', storyLogId)
            .single();
          
          if (data?.audio_data) {
            base64Audio = data.audio_data;
            if (progressInterval) clearInterval(progressInterval);
            setLoadingProgress(85);
          } else if (progressInterval) {
            clearInterval(progressInterval);
          }
        }
        
        // If not in database, generate it
        if (!base64Audio) {
          setLoadingProgress(20);
          
          // Simulate progress while generating (takes ~5-15 seconds)
          const progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
              if (prev >= 85) return prev;
              return prev + 5;
            });
          }, 500);

          try {
            base64Audio = await generateStoryAudio(story.content);
            clearInterval(progressInterval);
            
            if (!base64Audio) {
              throw new Error("Failed to generate audio");
            }

            // Save to database for future use
            if (storyLogId) {
              console.log('Guardando audio en DB para story:', storyLogId);
              const saved = await updateStoryAudio(storyLogId, base64Audio);
              console.log('Audio guardado:', saved);
            } else {
              console.log('No hay storyLogId, no se guarda el audio');
            }
          } catch (error) {
            clearInterval(progressInterval);
            throw error;
          }
        }

        if (!base64Audio) {
          throw new Error("No audio available");
        }

        setLoadingProgress(95);
        
        const audioData = decodeBase64(base64Audio);
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
        setLoadingProgress(100);
      }

      // Ensure context is running before playing
      if (audioContextRef.current.state !== 'running') {
        await audioContextRef.current.resume();
      }

      // Play
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlaying(false);
      
      // Start with a slight delay to ensure iOS is ready
      const startTime = audioContextRef.current.currentTime + 0.01;
      source.start(startTime);
      
      audioSourceRef.current = source;
      setIsPlaying(true);

    } catch (error) {
      console.error("Error playing audio:", error);
      alert("No se pudo reproducir el audio. Por favor intentá de nuevo.");
      setLoadingProgress(0);
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
            <h2 className="font-display text-3xl md:text-4xl text-adhoc-violet font-bold mb-3 leading-tight">
              {story.title}
            </h2>
            <div className="flex items-center gap-2">
              <span className="h-1 w-12 bg-adhoc-mustard rounded-full"></span>
              <span className="font-sans text-sm text-gray-500 uppercase tracking-wider">Tu Cuento Personalizado</span>
            </div>
          </div>
          
          {/* Audio Button */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button 
              onClick={handlePlayAudio}
              disabled={isAudioLoading}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-sans font-medium text-sm transition-all shadow-sm
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
                  <span>Generando {loadingProgress}%</span>
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
          
          {/* Progress Bar */}
          {isAudioLoading && loadingProgress > 0 && (
            <div className="w-full md:w-48 bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
              <div 
                className="bg-adhoc-violet h-full transition-all duration-200 ease-out rounded-full"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
          )}
        </div>
        </div>

        <div className="p-6 md:p-10 space-y-8">
          
          {/* Images Gallery */}
          {story.images && story.images.length > 0 && (
            <div className={`grid grid-cols-1 ${story.images.length > 1 ? 'md:grid-cols-3' : 'md:grid-cols-1 max-w-2xl mx-auto'} gap-6`}>
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
              <h3 className="font-display text-lg font-bold text-adhoc-mustard mb-1">Lo que aprendimos hoy</h3>
              <p className="font-sans text-gray-800 italic">
                {story.moralOrFact}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center flex-wrap">
        {/* WhatsApp Share */}
        {storyLogId ? (
          <button
            onClick={async () => {
              const shareUrl = `${window.location.origin}/cuento/${storyLogId}`;
              let text = `¡Mirá este cuento que creé con Adhoc Learning! 📚✨\n\n`;
              
              if (concept && interest) {
                try {
                  const aiMessage = await generateShareMessage(concept, interest, story.title);
                  text += `${aiMessage}\n\n`;
                } catch (error) {
                  text += `Aprendé sobre ${concept} con la temática de ${interest}\n\n`;
                }
              }
              
              text += `"${story.title}"\n\nLeelo acá:`;
              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
              window.open(whatsappUrl, '_blank');
            }}
            className="px-6 py-3 rounded-lg bg-[#25D366] text-white font-sans font-medium hover:bg-[#20BA5A] transition-colors flex items-center gap-2 shadow-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            <span>Compartir por WhatsApp</span>
          </button>
        ) : (
          <div className="px-6 py-3 rounded-lg bg-gray-200 text-gray-500 font-sans font-medium flex items-center gap-2 opacity-60 cursor-not-allowed">
            <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Guardando cuento...</span>
          </div>
        )}

        {/* Copy Link */}
        {storyLogId && (
          <button
            onClick={handleShareStory}
            className="px-6 py-3 rounded-lg bg-white border-2 border-adhoc-violet text-adhoc-violet font-sans font-medium hover:bg-adhoc-violet hover:text-white transition-colors flex items-center gap-2"
          >
            {showCopied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>¡Link copiado!</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                  <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                </svg>
                <span>Copiar link</span>
              </>
            )}
          </button>
        )}
        
        <button
          onClick={onReset || onNewStory}
          className="px-6 py-3 rounded-lg bg-white border-2 border-adhoc-violet text-adhoc-violet font-sans font-medium hover:bg-adhoc-violet hover:text-white transition-colors shadow-sm"
        >
          Crear otro cuento
        </button>
      </div>
    </div>
  );
};
