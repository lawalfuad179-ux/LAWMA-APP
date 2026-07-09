-- Remove duplicate (lga, day_of_week) rows, keeping the most recently created one
DELETE FROM collection_schedules
WHERE id NOT IN (
  SELECT DISTINCT ON (lga, day_of_week) id
  FROM collection_schedules
  ORDER BY lga, day_of_week, created_at DESC
);

-- Add unique constraint to enforce one schedule per LGA per day
ALTER TABLE "collection_schedules"
  ADD CONSTRAINT "collection_schedules_lga_day_of_week_key" UNIQUE ("lga", "day_of_week");
