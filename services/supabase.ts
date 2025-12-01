import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

console.log('Supabase Config:', { 
  url: supabaseUrl, 
  keyExists: !!supabaseKey 
});

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface StoryLog {
  id?: string;
  created_at?: string;
  concept: string;
  interests: string;
  story_content: string;
  listened: boolean;
  audio_data?: string | null;
}

export const logStoryGeneration = async (data: Omit<StoryLog, 'id' | 'created_at'>) => {
  try {
    console.log('Attempting to log story:', data);
    console.log('Supabase client status:', supabase ? 'initialized' : 'not initialized');
    console.log('Full supabase URL being used:', supabaseUrl);
    
    // Test if we can even reach Supabase
    try {
      const testFetch = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      console.log('Direct fetch test status:', testFetch.status, testFetch.statusText);
    } catch (fetchErr) {
      console.error('Direct fetch test failed:', fetchErr);
    }
    
    const { data: result, error } = await supabase
      .from('story_logs')
      .insert([data])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }
    
    console.log('Story logged successfully:', result);
    return result;
  } catch (err) {
    console.error('Exception logging story:', err);
    return null;
  }
};

export const updateListenStatus = async (id: string, listened: boolean) => {
  try {
    const { error } = await supabase
      .from('story_logs')
      .update({ listened })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating listen status:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error updating listen status:', err);
    return false;
  }
};

export const updateStoryAudio = async (id: string, audioData: string) => {
  try {
    const { error } = await supabase
      .from('story_logs')
      .update({ audio_data: audioData })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating audio data:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error updating audio data:', err);
    return false;
  }
};
