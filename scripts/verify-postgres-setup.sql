-- PostgreSQL Setup Verification Script
-- 사주 기반 AI 작명 플랫폼

-- ========================================
-- 1. Table Row Counts
-- ========================================
SELECT 'Table Row Counts' as section;
SELECT 
    'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'saju_data', COUNT(*) FROM saju_data
UNION ALL
SELECT 'naming_results', COUNT(*) FROM naming_results
UNION ALL
SELECT 'favorites', COUNT(*) FROM favorites
UNION ALL
SELECT 'hanja_dict', COUNT(*) FROM hanja_dict
UNION ALL
SELECT 'hanja_reading', COUNT(*) FROM hanja_reading
UNION ALL
SELECT 'user_sessions', COUNT(*) FROM user_sessions
ORDER BY table_name;

-- ========================================
-- 2. Index Information
-- ========================================
SELECT '
Index Information' as section;
SELECT 
    i.tablename,
    i.indexname,
    pg_size_pretty(pg_relation_size(s.indexrelid)) as index_size
FROM pg_indexes i
JOIN pg_stat_user_indexes s ON (i.schemaname = s.schemaname AND i.tablename = s.tablename AND i.indexname = s.indexname)
WHERE i.schemaname = 'public'
ORDER BY i.tablename, i.indexname;

-- ========================================
-- 3. Table Sizes
-- ========================================
SELECT '
Table Sizes' as section;
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ========================================
-- 4. Critical Index Verification
-- ========================================
SELECT '
Critical Indexes Check' as section;
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ HanjaReading composite index exists'
        ELSE '❌ HanjaReading composite index missing'
    END as status
FROM pg_indexes
WHERE tablename = 'hanja_reading' 
  AND indexname = 'idx_hanja_reading_composite';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ HanjaDict JSONB GIN index exists'
        ELSE '❌ HanjaDict JSONB GIN index missing'
    END as status
FROM pg_indexes
WHERE tablename = 'hanja_dict' 
  AND indexname = 'idx_hanja_dict_evidence_json';

-- ========================================
-- 5. Sample Performance Test Queries
-- ========================================
SELECT '
Performance Test: HanjaReading lookup' as section;
EXPLAIN ANALYZE
SELECT * FROM hanja_reading 
WHERE reading = '가' AND is_primary = true
LIMIT 10;

SELECT '
Performance Test: HanjaDict by element' as section;
EXPLAIN ANALYZE
SELECT character, meaning, strokes, element 
FROM hanja_dict 
WHERE element = '木'::\"Element\"
LIMIT 10;

-- ========================================
-- 6. Connection Information
-- ========================================
SELECT '
Database Connection Info' as section;
SELECT 
    current_database() as database,
    current_user as user,
    version() as postgres_version,
    pg_database_size(current_database()) as database_size_bytes,
    pg_size_pretty(pg_database_size(current_database())) as database_size;