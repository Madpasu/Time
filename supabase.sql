-- Add remaining_duration and first_opened_at columns
ALTER TABLE time_capsules
ADD COLUMN remaining_duration INTEGER,
ADD COLUMN first_opened_at TIMESTAMP WITH TIME ZONE;

-- Set default remaining_duration to match view_duration for existing records
UPDATE time_capsules
SET remaining_duration = view_duration
WHERE remaining_duration IS NULL;