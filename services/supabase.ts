import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface StoryLog {
  id?: string;
  created_at?: string;
  concept: string;
  interests: string;
  story_content: string;
  listened: boolean;
}

export const logStoryGeneration = async (data: Omit<StoryLog, 'id' | 'created_at'>) => {
  try {
    const { data: result, error } = await supabase
      .from('story_logs')
      .insert([data])
      .select()
      .single();
    
    if (error) {
      console.error('Error logging story:', error);
      return null;
    }
    
    return result;
  } catch (err) {
    console.error('Error logging story:', err);
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
