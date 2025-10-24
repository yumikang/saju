-- ============================================================
-- Calendar Data PostgreSQL Index Creation
-- ============================================================
-- Additional indexes for optimal query performance
-- Note: Basic indexes are already created by Prisma migration
-- ============================================================

-- Performance tracking
SELECT 'Creating additional indexes for calendar_data...' as status;

-- 1. Composite indexes for common query patterns
-- Solar to Lunar conversion queries
CREATE INDEX IF NOT EXISTS idx_calendar_solar_to_lunar
ON calendar_data (cd_sy, cd_sm, cd_sd)
INCLUDE (cd_ly, cd_lm, cd_ld, cd_ddi, holiday);

-- Lunar to Solar conversion queries
CREATE INDEX IF NOT EXISTS idx_calendar_lunar_to_solar
ON calendar_data (cd_ly, cd_lm, cd_ld)
INCLUDE (cd_sy, cd_sm, cd_sd, cd_ddi, holiday);

-- 2. Partial indexes for filtering
-- Only holidays (save space by indexing only holidays)
CREATE INDEX IF NOT EXISTS idx_calendar_holidays_only
ON calendar_data (cd_sy, cd_sm, cd_sd, holiday)
WHERE holiday > 0;

-- Only solar terms (24절기)
CREATE INDEX IF NOT EXISTS idx_calendar_solar_terms_only
ON calendar_data (cd_sy, cd_sm, cd_sd, cd_kterms)
WHERE cd_kterms IS NOT NULL;

-- Only leap months
CREATE INDEX IF NOT EXISTS idx_calendar_leap_months_only
ON calendar_data (cd_sy, cd_sm, cd_sd, cd_leap_month)
WHERE cd_leap_month = true;

-- Only special days (includes holidays, solar terms, or special events)
CREATE INDEX IF NOT EXISTS idx_calendar_special_days
ON calendar_data (cd_sy, cd_sm, cd_sd)
WHERE holiday > 0 OR cd_kterms IS NOT NULL OR cd_keventday IS NOT NULL OR cd_dogday IS NOT NULL;

-- 3. Full-text search indexes for holiday names
-- Solar holiday names
CREATE INDEX IF NOT EXISTS idx_calendar_solar_holiday_text
ON calendar_data USING gin(to_tsvector('simple', cd_sol_plan))
WHERE cd_sol_plan IS NOT NULL;

-- Lunar holiday names
CREATE INDEX IF NOT EXISTS idx_calendar_lunar_holiday_text
ON calendar_data USING gin(to_tsvector('simple', cd_lun_plan))
WHERE cd_lun_plan IS NOT NULL;

-- 4. Year-month composite for calendar view queries
CREATE INDEX IF NOT EXISTS idx_calendar_year_month
ON calendar_data (cd_sy, cd_sm);

CREATE INDEX IF NOT EXISTS idx_calendar_lunar_year_month
ON calendar_data (cd_ly, cd_lm);

-- 5. Zodiac animal with year for zodiac year queries
CREATE INDEX IF NOT EXISTS idx_calendar_zodiac_year
ON calendar_data (cd_ddi, cd_sy);

-- 6. Data source for migration tracking
CREATE INDEX IF NOT EXISTS idx_calendar_data_source
ON calendar_data (data_source)
WHERE data_source IS NOT NULL;

-- ============================================================
-- Index Statistics and Recommendations
-- ============================================================

-- View index sizes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND tablename = 'calendar_data'
ORDER BY pg_relation_size(indexrelid) DESC;

-- View table statistics
SELECT
    pg_size_pretty(pg_total_relation_size('calendar_data')) as total_size,
    pg_size_pretty(pg_relation_size('calendar_data')) as table_size,
    pg_size_pretty(pg_indexes_size('calendar_data')) as indexes_size;

-- Analyze table for query planner
ANALYZE calendar_data;

SELECT '✅ Additional indexes created successfully!' as status;

-- ============================================================
-- Query Performance Test Examples
-- ============================================================
-- Uncomment to test query performance

-- Test 1: Solar to Lunar conversion
-- EXPLAIN ANALYZE
-- SELECT cd_ly, cd_lm, cd_ld, cd_ddi
-- FROM calendar_data
-- WHERE cd_sy = 2025 AND cd_sm = 10 AND cd_sd = 24;

-- Test 2: Find all holidays in a year
-- EXPLAIN ANALYZE
-- SELECT cd_sy, cd_sm, cd_sd, cd_sol_plan, cd_lun_plan, holiday
-- FROM calendar_data
-- WHERE cd_sy = 2025 AND holiday > 0;

-- Test 3: Find all solar terms in a year
-- EXPLAIN ANALYZE
-- SELECT cd_sy, cd_sm, cd_sd, cd_kterms
-- FROM calendar_data
-- WHERE cd_sy = 2025 AND cd_kterms IS NOT NULL;

-- Test 4: Find zodiac year range
-- EXPLAIN ANALYZE
-- SELECT MIN(cd_sy) as start_year, MAX(cd_sy) as end_year, COUNT(*) as days
-- FROM calendar_data
-- WHERE cd_ddi = '용'
-- GROUP BY cd_ddi;

-- ============================================================
-- Maintenance Recommendations
-- ============================================================

-- Regular maintenance tasks:
-- 1. Run VACUUM ANALYZE monthly to update statistics
-- 2. Monitor index usage with pg_stat_user_indexes
-- 3. Consider partitioning if data grows beyond 10M rows
-- 4. Monitor query performance with pg_stat_statements

-- Example maintenance command:
-- VACUUM ANALYZE calendar_data;
