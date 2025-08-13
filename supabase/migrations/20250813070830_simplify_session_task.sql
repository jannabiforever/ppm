-- Remove updated_at column and rename created_at to added_at in session_tasks table
-- Since session_tasks is a simple relationship table, updated_at is unnecessary

-- Remove the trigger first (since updated_at column will be removed)
DROP TRIGGER IF EXISTS trg_session_tasks_updated ON public.session_tasks;

-- Remove updated_at column
ALTER TABLE public.session_tasks DROP COLUMN IF EXISTS updated_at;

-- Rename created_at to added_at for better semantic meaning
ALTER TABLE public.session_tasks RENAME COLUMN created_at TO added_at;
