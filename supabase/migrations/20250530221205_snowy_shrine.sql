-- Create enum for bookmark types
CREATE TYPE bookmark_type AS ENUM ('article', 'video', 'podcast', 'other');

-- Create tables with proper relationships and constraints
CREATE TABLE main_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    main_tag_id UUID REFERENCES main_tags(id),
    type bookmark_type NOT NULL DEFAULT 'article',
    summarized_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_url CHECK (url ~* '^https?://.*')
);

CREATE TABLE bookmark_tags (
    bookmark_id UUID REFERENCES bookmarks(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (bookmark_id, tag_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_bookmarks_main_tag ON bookmarks(main_tag_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_main_tags_name ON main_tags(name);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bookmarks_updated_at
    BEFORE UPDATE ON bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_main_tags_updated_at
    BEFORE UPDATE ON main_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add some initial main tags
INSERT INTO main_tags (name) VALUES
    ('Product'),
    ('Technology'),
    ('Design'),
    ('Business'),
    ('Miscellaneous');