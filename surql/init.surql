-- PPM (Project Protocol Manager) Database Initialization
-- This script initializes the database schema for the PPM application

-- Define namespaces and databases
DEFINE NAMESPACE ppm;
USE NAMESPACE ppm;
DEFINE DATABASE default;
USE DATABASE default;

-- Projects table
DEFINE TABLE project SCHEMAFULL;
DEFINE FIELD name ON project TYPE string ASSERT $value != NONE;
DEFINE FIELD description ON project TYPE string;
DEFINE FIELD priority ON project TYPE string; -- e.g., "high", "medium", "low"
DEFINE FIELD status ON project TYPE string DEFAULT 'active'; -- e.g., "active", "completed", "paused"
DEFINE FIELD weekly_goal_minutes ON project TYPE int;
DEFINE FIELD daily_max_minutes ON project TYPE int;
DEFINE FIELD location ON project TYPE string;
DEFINE FIELD preferred_slots ON project TYPE array;
DEFINE FIELD tags ON project TYPE array;
DEFINE FIELD created_at ON project TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON project TYPE datetime DEFAULT time::now();

-- Time logs table
DEFINE TABLE time_log SCHEMAFULL;
DEFINE FIELD project_id ON time_log TYPE record ASSERT $value != NONE;
DEFINE FIELD date ON time_log TYPE datetime DEFAULT time::now();
DEFINE FIELD duration ON time_log TYPE int ASSERT $value > 0;
DEFINE FIELD note ON time_log TYPE string;
DEFINE FIELD mood ON time_log TYPE string; -- e.g., "productive", "distracted", "tired"
DEFINE FIELD created_at ON time_log TYPE datetime DEFAULT time::now();

-- Project notes table
DEFINE TABLE project_note SCHEMAFULL;
DEFINE FIELD project_id ON project_note TYPE record ASSERT $value != NONE;
DEFINE FIELD title ON project_note TYPE string;
DEFINE FIELD content ON project_note TYPE string;
DEFINE FIELD tags ON project_note TYPE array;
DEFINE FIELD created_at ON project_note TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON project_note TYPE datetime DEFAULT time::now();

-- Weekly plans table
DEFINE TABLE weekly_plan SCHEMAFULL;
DEFINE FIELD week_start ON weekly_plan TYPE datetime ASSERT $value != NONE;
DEFINE FIELD week_end ON weekly_plan TYPE datetime ASSERT $value != NONE;
DEFINE FIELD slots ON weekly_plan TYPE array;
DEFINE FIELD goals ON weekly_plan TYPE object;
DEFINE FIELD reflection ON weekly_plan TYPE string;
DEFINE FIELD created_at ON weekly_plan TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON weekly_plan TYPE datetime DEFAULT time::now();

-- Plan slots table (for detailed time slot allocations)
DEFINE TABLE plan_slot SCHEMAFULL;
DEFINE FIELD weekly_plan_id ON plan_slot TYPE record ASSERT $value != NONE;
DEFINE FIELD project_id ON plan_slot TYPE record ASSERT $value != NONE;
DEFINE FIELD day_of_week ON plan_slot TYPE int ASSERT $value >= 0 && $value <= 6;
DEFINE FIELD start_time ON plan_slot TYPE string; -- format: "HH:MM"
DEFINE FIELD end_time ON plan_slot TYPE string; -- format: "HH:MM"
DEFINE FIELD duration_minutes ON plan_slot TYPE int ASSERT $value > 0;
DEFINE FIELD status ON plan_slot TYPE string DEFAULT 'planned'; -- e.g., "planned", "completed", "missed"
DEFINE FIELD created_at ON plan_slot TYPE datetime DEFAULT time::now();

-- Daily reflections table
DEFINE TABLE daily_reflection SCHEMAFULL;
DEFINE FIELD date ON daily_reflection TYPE datetime ASSERT $value != NONE;
DEFINE FIELD content ON daily_reflection TYPE string;
DEFINE FIELD mood ON daily_reflection TYPE string;
DEFINE FIELD productivity_score ON daily_reflection TYPE int;
DEFINE FIELD created_at ON daily_reflection TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON daily_reflection TYPE datetime DEFAULT time::now();

-- File attachments table
DEFINE TABLE file_attachment SCHEMAFULL;
DEFINE FIELD project_id ON file_attachment TYPE record ASSERT $value != NONE;
DEFINE FIELD name ON file_attachment TYPE string ASSERT $value != NONE;
DEFINE FIELD type ON file_attachment TYPE string ASSERT $value != NONE; -- e.g., "png", "pdf", "txt", "md"
DEFINE FIELD content ON file_attachment TYPE string; -- Base64 encoded content or file path
DEFINE FIELD description ON file_attachment TYPE string;
DEFINE FIELD created_at ON file_attachment TYPE datetime DEFAULT time::now();

-- Tags table for better organization
DEFINE TABLE tag SCHEMAFULL;
DEFINE FIELD name ON tag TYPE string ASSERT $value != NONE;
DEFINE FIELD color ON tag TYPE string;
DEFINE FIELD created_at ON tag TYPE datetime DEFAULT time::now();

-- Define indexes for performance
DEFINE INDEX project_name_idx ON TABLE project COLUMNS name UNIQUE;
DEFINE INDEX time_log_date_idx ON TABLE time_log COLUMNS date;
DEFINE INDEX time_log_project_idx ON TABLE time_log COLUMNS project_id;
DEFINE INDEX plan_slot_weekly_plan_idx ON TABLE plan_slot COLUMNS weekly_plan_id;
DEFINE INDEX plan_slot_project_idx ON TABLE plan_slot COLUMNS project_id;
DEFINE INDEX tag_name_idx ON TABLE tag COLUMNS name UNIQUE;

-- Define relations for graph capabilities
DEFINE TABLE project_tag SCHEMAFULL;
DEFINE FIELD project ON project_tag TYPE record;
DEFINE FIELD tag ON project_tag TYPE record;
DEFINE FIELD created_at ON project_tag TYPE datetime DEFAULT time::now();

-- Define full-text search indexes for notes and reflections
DEFINE ANALYZER standard TOKENIZERS blank,class FILTERS lowercase;
DEFINE INDEX project_note_content_search ON TABLE project_note COLUMNS content SEARCH ANALYZER standard BM25;
DEFINE INDEX daily_reflection_content_search ON TABLE daily_reflection COLUMNS content SEARCH ANALYZER standard BM25;