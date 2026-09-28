-- Backfills the `tokens.counter_id` column that schema.sql expects but
-- this project's `tokens` table was created without (the table predates
-- the column being added to schema.sql, and was never migrated forward).
-- Written to be safe to run against a database that already has some or
-- all of the rest of schema.sql applied.

alter table tokens
  add column if not exists counter_id uuid references counters (id) on delete set null;
