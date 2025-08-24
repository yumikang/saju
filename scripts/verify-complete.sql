-- PostgreSQL Setup Complete Verification
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
-- 2. All Indexes
-- ========================================
SELECT '
All Indexes' as section;
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ========================================
-- 3. Critical Index Check
-- ========================================
SELECT '
Critical Index Status' as section;
SELECT indexname, 
       CASE 
           WHEN indexname = 'idx_hanja_reading_composite' THEN '✅ Critical: HanjaReading composite'
           WHEN indexname = 'idx_hanja_dict_evidence_json' THEN '✅ Critical: JSONB GIN index'
           WHEN indexname LIKE 'idx_%' THEN '✅ Performance index'
           ELSE '📌 System index'
       END as status
FROM pg_indexes
WHERE schemaname = 'public' 
  AND (tablename = 'hanja_reading' OR tablename = 'hanja_dict')
ORDER BY tablename, indexname;

-- ========================================
-- 4. Sample Query Performance
-- ========================================
SELECT '
Query Performance Tests' as section;

-- Test 1: HanjaReading lookup
SELECT 'Test: HanjaReading by reading' as test;
SELECT COUNT(*) as matching_records
FROM hanja_reading 
WHERE reading = '가' AND is_primary = true;

-- Test 2: HanjaDict by element  
SELECT 'Test: HanjaDict by element' as test;
SELECT COUNT(*) as matching_records
FROM hanja_dict 
WHERE element = '木';

-- Test 3: HanjaDict by frequency
SELECT 'Test: High frequency hanja' as test;
SELECT COUNT(*) as high_frequency_hanja
FROM hanja_dict
WHERE name_frequency > 100 OR usage_frequency > 100;

-- ========================================
-- 5. Database Summary
-- ========================================
SELECT '
Database Summary' as section;
SELECT 
    current_database() as database,
    current_user as user,
    pg_size_pretty(pg_database_size(current_database())) as total_size,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as total_indexes,
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as total_tables;