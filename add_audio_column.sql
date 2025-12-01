-- Add audio_data column to story_logs table
ALTER TABLE story_logs ADD COLUMN IF NOT EXISTS audio_data TEXT;

-- Add comment
COMMENT ON COLUMN story_logs.audio_data IS 'Base64 encoded audio data for story narration (generated once, reused by all)';
