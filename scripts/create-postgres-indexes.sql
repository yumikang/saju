-- Performance Optimization Indexes for PostgreSQL
-- 사주 기반 AI 작명 플랫폼

-- ========================================
-- 1. HanjaReading Composite Index (CRITICAL)
-- 빠른 한자 읽기 검색을 위한 복합 인덱스
-- ========================================
CREATE INDEX IF NOT EXISTS idx_hanja_reading_composite 
ON hanja_reading(reading, is_primary, character);

-- 한자 character로 읽기를 찾는 경우를 위한 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_hanja_reading_character 
ON hanja_reading(character);

-- ========================================
-- 2. HanjaDict JSONB GIN Index
-- evidence_json 필드의 빠른 검색을 위한 GIN 인덱스
-- ========================================
CREATE INDEX IF NOT EXISTS idx_hanja_dict_evidence_json 
ON hanja_dict USING GIN (evidence_json);

-- ========================================
-- 3. HanjaDict Additional Performance Indexes
-- ========================================

-- 한자 읽기로 검색하는 경우를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_hanja_dict_korean_reading 
ON hanja_dict(korean_reading) 
WHERE korean_reading IS NOT NULL;

-- 의미로 검색하는 경우를 위한 인덱스 (Full Text Search)
CREATE INDEX IF NOT EXISTS idx_hanja_dict_meaning_fts 
ON hanja_dict USING GIN(to_tsvector('simple', meaning))
WHERE meaning IS NOT NULL;

-- 자주 사용되는 한자 빠른 검색
CREATE INDEX IF NOT EXISTS idx_hanja_dict_frequency_composite
ON hanja_dict(name_frequency DESC, usage_frequency DESC, character)
WHERE name_frequency > 0 OR usage_frequency > 0;

-- ========================================
-- 4. SajuData Performance Indexes
-- ========================================

-- 사용자별 사주 데이터 검색 최적화
CREATE INDEX IF NOT EXISTS idx_saju_data_user_created 
ON saju_data(user_id, created_at DESC);

-- 생년월일 기반 검색
CREATE INDEX IF NOT EXISTS idx_saju_data_birth_date 
ON saju_data(birth_date);

-- ========================================
-- 5. NamingResult Performance Indexes
-- ========================================

-- 사용자별 작명 결과 검색 (최신순)
CREATE INDEX IF NOT EXISTS idx_naming_result_user_created 
ON naming_results(user_id, created_at DESC);

-- 사주 데이터별 작명 결과 검색
CREATE INDEX IF NOT EXISTS idx_naming_result_saju_created 
ON naming_results(saju_data_id, created_at DESC);

-- 점수 기반 검색 (높은 점수순)
CREATE INDEX IF NOT EXISTS idx_naming_result_score 
ON naming_results(overall_score DESC, created_at DESC);

-- ========================================
-- 6. Favorites Performance Indexes
-- ========================================

-- 사용자별 즐겨찾기 검색 (최신순)
CREATE INDEX IF NOT EXISTS idx_favorites_user_created 
ON favorites(user_id, created_at DESC);

-- 높은 평점 즐겨찾기 검색
CREATE INDEX IF NOT EXISTS idx_favorites_rating 
ON favorites(rating DESC, created_at DESC)
WHERE rating IS NOT NULL;

-- ========================================
-- 7. UserSession Performance Indexes
-- ========================================

-- 토큰 기반 세션 검색 (이미 unique index 있음)
-- 만료된 세션 정리를 위한 인덱스 (이미 있음)

-- ========================================
-- 8. Statistics Update
-- 테이블 통계 업데이트 (쿼리 플래너 최적화)
-- ========================================
ANALYZE users;
ANALYZE saju_data;
ANALYZE naming_results;
ANALYZE favorites;
ANALYZE hanja_dict;
ANALYZE hanja_reading;
ANALYZE user_sessions;

-- ========================================
-- Index Usage Statistics Query
-- ========================================
-- 인덱스 사용 통계를 확인하는 쿼리
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
*/

-- ========================================
-- Table Size Information
-- ========================================
/*
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
*/