-- =====================================================
-- PostgreSQL Performance Monitoring Queries
-- Using pg_stat_statements for Query Analysis
-- =====================================================

-- Prerequisites: pg_stat_statements extension must be enabled
-- To reset statistics: SELECT pg_stat_statements_reset();

-- =====================================================
-- 1. TOP 10 SLOWEST QUERIES (by total time)
-- =====================================================
SELECT 
    queryid,
    LEFT(query, 80) AS query_preview,
    calls,
    ROUND(total_exec_time::numeric, 2) AS total_time_ms,
    ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
    ROUND(max_exec_time::numeric, 2) AS max_time_ms,
    ROUND(stddev_exec_time::numeric, 2) AS stddev_time_ms,
    rows,
    ROUND(100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0), 2) AS cache_hit_ratio
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'  -- Exclude monitoring queries
ORDER BY total_exec_time DESC
LIMIT 10;

-- =====================================================
-- 2. TOP 10 MOST FREQUENTLY EXECUTED QUERIES
-- =====================================================
SELECT 
    queryid,
    LEFT(query, 80) AS query_preview,
    calls,
    ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
    ROUND(total_exec_time::numeric, 2) AS total_time_ms,
    rows,
    ROUND(rows::numeric / NULLIF(calls, 0), 2) AS rows_per_call
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY calls DESC
LIMIT 10;

-- =====================================================
-- 3. QUERIES WITH POOR CACHE HIT RATIO (<90%)
-- =====================================================
SELECT 
    queryid,
    LEFT(query, 80) AS query_preview,
    calls,
    ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
    shared_blks_hit AS cache_hits,
    shared_blks_read AS disk_reads,
    ROUND(100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0), 2) AS cache_hit_ratio
FROM pg_stat_statements
WHERE shared_blks_hit + shared_blks_read > 0
    AND (100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0)) < 90
    AND query NOT LIKE '%pg_stat_statements%'
ORDER BY shared_blks_read DESC
LIMIT 10;

-- =====================================================
-- 4. DATABASE-WIDE CACHE HIT RATIO
-- =====================================================
SELECT 
    datname,
    numbackends AS active_connections,
    xact_commit AS commits,
    xact_rollback AS rollbacks,
    blks_read AS disk_blocks_read,
    blks_hit AS cache_blocks_hit,
    ROUND(100.0 * blks_hit / NULLIF(blks_hit + blks_read, 0), 2) AS cache_hit_ratio,
    tup_returned AS rows_returned,
    tup_fetched AS rows_fetched,
    tup_inserted AS rows_inserted,
    tup_updated AS rows_updated,
    tup_deleted AS rows_deleted,
    ROUND(blk_read_time::numeric, 2) AS read_time_ms,
    ROUND(blk_write_time::numeric, 2) AS write_time_ms,
    deadlocks,
    temp_files,
    pg_size_pretty(temp_bytes) AS temp_size
FROM pg_stat_database
WHERE datname = current_database();

-- =====================================================
-- 5. INDEX USAGE STATISTICS
-- =====================================================
SELECT 
    schemaname,
    tablename AS table_name,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED INDEX - Consider dropping'
        WHEN idx_scan < 100 THEN 'RARELY USED'
        ELSE 'ACTIVE'
    END AS usage_status
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- =====================================================
-- 6. TABLE I/O STATISTICS
-- =====================================================
SELECT 
    schemaname,
    tablename AS table_name,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes,
    n_tup_hot_upd AS hot_updates,
    n_live_tup AS live_tuples,
    n_dead_tup AS dead_tuples,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_tuple_ratio,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY seq_scan + idx_scan DESC;

-- =====================================================
-- 7. QUERIES USING MOST I/O TIME
-- =====================================================
-- Note: I/O timing columns are only available if track_io_timing is enabled
SELECT 
    queryid,
    LEFT(query, 80) AS query_preview,
    calls,
    ROUND((blk_read_time + blk_write_time)::numeric, 2) AS total_io_time_ms,
    ROUND(blk_read_time::numeric, 2) AS read_time_ms,
    ROUND(blk_write_time::numeric, 2) AS write_time_ms,
    shared_blks_read AS blocks_read,
    shared_blks_written AS blocks_written
FROM pg_stat_statements
WHERE blk_read_time + blk_write_time > 0
ORDER BY blk_read_time + blk_write_time DESC
LIMIT 10;

-- =====================================================
-- 8. LONG RUNNING QUERIES (Currently Active)
-- =====================================================
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    backend_start,
    xact_start,
    query_start,
    state_change,
    wait_event_type,
    wait_event,
    state,
    backend_xid,
    backend_xmin,
    LEFT(query, 100) AS query_preview,
    NOW() - query_start AS query_duration,
    NOW() - xact_start AS transaction_duration
FROM pg_stat_activity
WHERE state != 'idle' 
    AND query NOT LIKE '%pg_stat_activity%'
ORDER BY query_start ASC;

-- =====================================================
-- 9. CONNECTION POOL STATISTICS
-- =====================================================
SELECT 
    datname,
    usename,
    application_name,
    COUNT(*) AS connection_count,
    COUNT(*) FILTER (WHERE state = 'active') AS active_connections,
    COUNT(*) FILTER (WHERE state = 'idle') AS idle_connections,
    COUNT(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_transaction,
    MAX(NOW() - backend_start) AS oldest_connection_age,
    MAX(NOW() - query_start) FILTER (WHERE state = 'active') AS longest_running_query
FROM pg_stat_activity
GROUP BY datname, usename, application_name
ORDER BY connection_count DESC;

-- =====================================================
-- 10. LOCK WAIT ANALYSIS
-- =====================================================
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS blocking_statement,
    blocked_activity.application_name AS blocked_application,
    blocking_activity.application_name AS blocking_application,
    NOW() - blocked_activity.query_start AS blocked_duration,
    NOW() - blocking_activity.query_start AS blocking_duration
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- =====================================================
-- RESET STATISTICS (Use with caution!)
-- =====================================================
-- SELECT pg_stat_statements_reset();  -- Reset query statistics
-- SELECT pg_stat_reset();  -- Reset database statistics
-- SELECT pg_stat_reset_shared('bgwriter');  -- Reset bgwriter statistics

-- =====================================================
-- USEFUL ADMINISTRATIVE QUERIES
-- =====================================================

-- Check if pg_stat_statements is enabled
SELECT * FROM pg_available_extensions WHERE name = 'pg_stat_statements';

-- View pg_stat_statements configuration
SELECT name, setting, unit, short_desc 
FROM pg_settings 
WHERE name LIKE 'pg_stat_statements%';

-- Check auto_explain configuration
SELECT name, setting, unit, short_desc 
FROM pg_settings 
WHERE name LIKE 'auto_explain%';

-- Database size information
SELECT 
    datname AS database_name,
    pg_size_pretty(pg_database_size(datname)) AS size,
    pg_database_size(datname) AS size_bytes
FROM pg_database
WHERE datname NOT IN ('template0', 'template1')
ORDER BY pg_database_size(datname) DESC;

-- Table sizes with toast and indexes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename) - pg_indexes_size(schemaname||'.'||tablename)) AS toast_size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;