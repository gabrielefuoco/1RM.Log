-- Add rounding_increment and one_rm_update_policy columns to progression_settings
ALTER TABLE progression_settings 
ADD COLUMN IF NOT EXISTS rounding_increment numeric DEFAULT 2.5,
ADD COLUMN IF NOT EXISTS one_rm_update_policy text DEFAULT 'confirm' CHECK (one_rm_update_policy IN ('manual', 'confirm', 'auto'));

-- Update existing records to default values if null (though default should handle it for new ones)
UPDATE progression_settings 
SET rounding_increment = 2.5 
WHERE rounding_increment IS NULL;

UPDATE progression_settings 
SET one_rm_update_policy = 'confirm' 
WHERE one_rm_update_policy IS NULL;
