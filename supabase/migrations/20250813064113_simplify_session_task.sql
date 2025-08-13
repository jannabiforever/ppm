-- Remove order_index and seconds_spent columns from session_tasks table
-- These columns are no longer needed for business requirements

-- Remove constraints first (order matters)
ALTER TABLE public.session_tasks DROP CONSTRAINT IF EXISTS uq_session_tasks_order;
ALTER TABLE public.session_tasks DROP CONSTRAINT IF EXISTS session_tasks_seconds_spent_check;

-- Remove columns
ALTER TABLE public.session_tasks DROP COLUMN IF EXISTS order_index;
ALTER TABLE public.session_tasks DROP COLUMN IF EXISTS seconds_spent;
