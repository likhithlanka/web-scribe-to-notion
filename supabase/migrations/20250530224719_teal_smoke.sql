-- Create learning_insights table
CREATE TABLE learning_insights (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment to explain the table's purpose
COMMENT ON TABLE learning_insights IS 'Stores AI-generated insights about user''s learning journey';
COMMENT ON COLUMN learning_insights.id IS 'Unique identifier for the insight, using "latest" for the most recent';
COMMENT ON COLUMN learning_insights.content IS 'The AI-generated insight text';
COMMENT ON COLUMN learning_insights.generated_at IS 'Timestamp when the insight was generated';

-- Add RLS policies
ALTER TABLE learning_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
    ON learning_insights
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow service role full access"
    ON learning_insights
    TO service_role
    USING (true)
    WITH CHECK (true);