import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { StoryDisplay } from '../components/StoryDisplay';
import { supabase } from '../services/supabase';
import { StoryResponse } from '../types';

export const SharedStory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<StoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStory = async () => {
      if (!id) {
        setError('ID de cuento no válido');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('story_logs')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          // Parse story_content from JSON string to object
          const storyContent = typeof data.story_content === 'string' 
            ? JSON.parse(data.story_content) 
            : data.story_content;
          setStory(storyContent as StoryResponse);
        } else {
          setError('Cuento no encontrado');
        }
      } catch (err: any) {
        console.error('Error loading story:', err);
        setError('No se pudo cargar el cuento');
      } finally {
        setLoading(false);
      }
    };

    loadStory();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-adhoc-violet via-adhoc-lavender to-adhoc-violet">
        <Header />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
            <p className="font-secondary text-lg">Cargando cuento...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-adhoc-violet via-adhoc-lavender to-adhoc-violet">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl p-8 max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-primary text-gray-800 mb-4">😕 Ups...</h2>
            <p className="font-secondary text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-adhoc-violet text-white rounded-lg font-secondary font-medium hover:bg-adhoc-violet/90 transition-colors"
            >
              Crear un nuevo cuento
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleListenStart = async () => {
    if (!id) return;
    
    try {
      // Update listen status in Supabase
      const { error } = await supabase
        .from('story_logs')
        .update({ listened: true })
        .eq('id', id);
      
      if (error) {
        console.error('Error updating listen status:', error);
      }
    } catch (err) {
      console.error('Error updating listen status:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-adhoc-violet via-adhoc-lavender to-adhoc-violet">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto mb-6">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-secondary text-sm transition-colors border border-white/30"
          >
            ← Crear otro cuento
          </button>
        </div>
        <StoryDisplay 
          story={story} 
          storyLogId={id!}
          onNewStory={() => navigate('/')}
          onListenStart={handleListenStart}
        />
      </div>
    </div>
  );
};
