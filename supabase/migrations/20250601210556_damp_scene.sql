-- Create DJC history table to track changes
CREATE TABLE IF NOT EXISTS djc_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  djc_id uuid REFERENCES djc(id) ON DELETE CASCADE,
  action text NOT NULL,
  changed_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE djc_history ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "enable_auth_select_djc_history"
ON djc_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM djc
    WHERE djc.id = djc_history.djc_id
    AND djc.created_by = auth.uid()
  )
);

CREATE POLICY "enable_auth_insert_djc_history"
ON djc_history
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM djc
    WHERE djc.id = djc_history.djc_id
    AND djc.created_by = auth.uid()
  )
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS djc_history_djc_id_idx ON djc_history(djc_id);
CREATE INDEX IF NOT EXISTS djc_history_created_by_idx ON djc_history(created_by);
CREATE INDEX IF NOT EXISTS djc_history_created_at_idx ON djc_history(created_at);