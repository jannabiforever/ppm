-- Add active column to projects table
-- This column indicates whether a project is active (true) or archived/inactive (false)
-- Default value is true for all new projects
ALTER TABLE projects
ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN projects.active IS 'Indicates whether the project is active (true) or archived/inactive (false). Defaults to true for new projects.';

-- Create index for performance when filtering by active status
CREATE INDEX idx_projects_active ON projects(active);

-- Update existing projects to be active by default
-- (This is redundant due to DEFAULT true, but explicit for clarity)
UPDATE projects SET active = true WHERE active IS NULL;
