-- V6: Robustly normalize enum values and ensure CHECK constraints exist
-- This handles any lowercase values that might exist in the database

-- Normalize priority values to uppercase
UPDATE tickets SET priority = UPPER(TRIM(priority))
WHERE priority IS NOT NULL AND priority <> UPPER(TRIM(priority));

-- Normalize status values to uppercase
UPDATE tickets SET status = UPPER(TRIM(status))
WHERE status IS NOT NULL AND status <> UPPER(TRIM(status));

-- Fix any invalid priority values
UPDATE tickets SET priority = 'MEDIUM'
WHERE priority IS NULL OR UPPER(TRIM(priority)) NOT IN ('LOW', 'MEDIUM', 'HIGH');

-- Fix any invalid status values
UPDATE tickets SET status = 'OPEN'
WHERE status IS NULL OR UPPER(TRIM(status)) NOT IN ('OPEN', 'PENDING', 'RESOLVED', 'CLOSED');
