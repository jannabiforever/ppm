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
DEFINE FIELD priority ON project TYPE string; -- e.g., "high", "medium", "low"
DEFINE FIELD weekly_goal_minutes ON project TYPE int;
DEFINE FIELD daily_max_minutes ON project TYPE int;
DEFINE FIELD location ON project TYPE string;
DEFINE FIELD preferred_slots ON project TYPE array;
DEFINE FIELD created_at ON project TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON project TYPE datetime DEFAULT time::now();

-- Time logs table
DEFINE TABLE time_log SCHEMAFULL;
DEFINE FIELD project_id ON time_log TYPE record(project) ASSERT $value != NONE;
DEFINE FIELD date ON time_log TYPE datetime DEFAULT time::now();
DEFINE FIELD duration ON time_log TYPE int ASSERT $value > 0;
DEFINE FIELD note ON time_log TYPE string;
DEFINE FIELD created_at ON time_log TYPE datetime DEFAULT time::now();

-- Project notes table
DEFINE TABLE project_note SCHEMAFULL;
DEFINE FIELD project_id ON project_note TYPE record(project) ASSERT $value != NONE;
DEFINE FIELD content ON project_note TYPE string;
DEFINE FIELD updated_at ON project_note TYPE datetime DEFAULT time::now();

-- Weekly plans table
DEFINE TABLE weekly_plan SCHEMAFULL;
DEFINE FIELD week_start ON weekly_plan TYPE datetime ASSERT $value != NONE;
DEFINE FIELD week_end ON weekly_plan TYPE datetime ASSERT $value != NONE;
DEFINE FIELD slots ON weekly_plan TYPE array;
DEFINE FIELD created_at ON weekly_plan TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON weekly_plan TYPE datetime DEFAULT time::now();

-- Plan slots table (for detailed time slot allocations)
DEFINE TABLE plan_slot SCHEMAFULL;
DEFINE FIELD weekly_plan_id ON plan_slot TYPE record(weekly_plan) ASSERT $value != NONE;
DEFINE FIELD project_id ON plan_slot TYPE record(project) ASSERT $value != NONE;
DEFINE FIELD day_of_week ON plan_slot TYPE int ASSERT $value >= 0 && $value <= 6;
DEFINE FIELD start_time ON plan_slot TYPE string; -- format: "HH:MM"
DEFINE FIELD end_time ON plan_slot TYPE string; -- format: "HH:MM"
DEFINE FIELD duration_minutes ON plan_slot TYPE int ASSERT $value > 0;
DEFINE FIELD created_at ON plan_slot TYPE datetime DEFAULT time::now();

-- Daily reflections table
DEFINE TABLE daily_reflection SCHEMAFULL;
DEFINE FIELD date ON daily_reflection TYPE datetime ASSERT $value != NONE;
DEFINE FIELD content ON daily_reflection TYPE string;
DEFINE FIELD created_at ON daily_reflection TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON daily_reflection TYPE datetime DEFAULT time::now();

-- File attachments table
DEFINE TABLE file_attachment SCHEMAFULL;
DEFINE FIELD project_id ON file_attachment TYPE record(project) ASSERT $value != NONE;
DEFINE FIELD name ON file_attachment TYPE string ASSERT $value != NONE;
DEFINE FIELD type ON file_attachment TYPE string ASSERT $value != NONE; -- e.g., "png", "pdf", "txt", "md"
DEFINE FIELD content ON file_attachment TYPE string; -- Base64 encoded content or file path
DEFINE FIELD created_at ON file_attachment TYPE datetime DEFAULT time::now();

-- Define indexes
DEFINE INDEX project_name_idx ON TABLE project COLUMNS name UNIQUE;
DEFINE INDEX time_log_date_idx ON TABLE time_log COLUMNS date;
DEFINE INDEX time_log_project_idx ON TABLE time_log COLUMNS project_id;
DEFINE INDEX plan_slot_weekly_plan_idx ON TABLE plan_slot COLUMNS weekly_plan_id;

-- Create sample project for testing
CREATE project CONTENT {
    name: "Sample Project",
    priority: "medium",
    weekly_goal_minutes: 600,
    daily_max_minutes: 120,
    location: "Home Office",
    preferred_slots: ["08:00-10:00", "13:00-15:00"]
};