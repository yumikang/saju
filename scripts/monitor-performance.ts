#!/usr/bin/env npx tsx
/**
 * PostgreSQL Performance Monitoring Script
 * 
 * Automatically collects and reports database performance metrics
 * using pg_stat_statements and other system views.
 * 
 * Usage:
 *   npx tsx scripts/monitor-performance.ts [--format json|text|html] [--output file.ext]
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Use direct connection for monitoring (not through PgBouncer)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL
    }
  }
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

interface PerformanceReport {
  timestamp: Date;
  database: string;
  slowestQueries: any[];
  frequentQueries: any[];
  cacheHitRatio: number;
  activeConnections: number;
  indexUsage: any[];
  tableStats: any[];
  recommendations: string[];
}

class PerformanceMonitor {
  private format: 'json' | 'text' | 'html';
  private outputFile?: string;

  constructor(format: 'json' | 'text' | 'html' = 'text', outputFile?: string) {
    this.format = format;
    this.outputFile = outputFile;
  }

  async collectMetrics(): Promise<PerformanceReport> {
    const report: PerformanceReport = {
      timestamp: new Date(),
      database: 'saju_naming',
      slowestQueries: [],
      frequentQueries: [],
      cacheHitRatio: 0,
      activeConnections: 0,
      indexUsage: [],
      tableStats: [],
      recommendations: []
    };

    try {
      // 1. Collect slowest queries
      report.slowestQueries = await prisma.$queryRaw`
        SELECT 
          queryid,
          LEFT(query, 100) AS query,
          calls,
          ROUND(total_exec_time::numeric, 2) AS total_ms,
          ROUND(mean_exec_time::numeric, 2) AS mean_ms,
          ROUND(max_exec_time::numeric, 2) AS max_ms,
          rows,
          ROUND(100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0), 2) AS cache_hit_ratio
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY total_exec_time DESC
        LIMIT 10
      `;

      // 2. Collect most frequent queries
      report.frequentQueries = await prisma.$queryRaw`
        SELECT 
          queryid,
          LEFT(query, 100) AS query,
          calls,
          ROUND(mean_exec_time::numeric, 2) AS mean_ms,
          ROUND(total_exec_time::numeric, 2) AS total_ms,
          rows
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY calls DESC
        LIMIT 10
      `;

      // 3. Database-wide cache hit ratio
      const dbStats: any = await prisma.$queryRaw`
        SELECT 
          numbackends AS active_connections,
          xact_commit AS commits,
          xact_rollback AS rollbacks,
          blks_read AS disk_blocks,
          blks_hit AS cache_blocks,
          ROUND(100.0 * blks_hit / NULLIF(blks_hit + blks_read, 0), 2) AS cache_hit_ratio,
          deadlocks,
          temp_files,
          pg_size_pretty(temp_bytes) AS temp_size
        FROM pg_stat_database
        WHERE datname = current_database()
      `;
      
      if (dbStats && dbStats[0]) {
        report.cacheHitRatio = Number(dbStats[0].cache_hit_ratio) || 0;
        report.activeConnections = Number(dbStats[0].active_connections) || 0;
      }

      // 4. Index usage statistics
      report.indexUsage = await prisma.$queryRaw`
        SELECT 
          schemaname,
          relname AS table_name,
          indexrelname AS indexname,
          idx_scan AS scans,
          idx_tup_read AS tuples_read,
          pg_size_pretty(pg_relation_size(indexrelid)) AS size,
          CASE 
            WHEN idx_scan = 0 THEN 'UNUSED'
            WHEN idx_scan < 100 THEN 'RARELY_USED'
            ELSE 'ACTIVE'
          END AS status
        FROM pg_stat_user_indexes
        ORDER BY idx_scan ASC
        LIMIT 20
      `;

      // 5. Table statistics
      report.tableStats = await prisma.$queryRaw`
        SELECT 
          schemaname,
          relname AS table_name,
          n_live_tup AS live_rows,
          n_dead_tup AS dead_rows,
          ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS bloat_ratio,
          last_vacuum,
          last_autovacuum,
          last_analyze
        FROM pg_stat_user_tables
        WHERE n_live_tup > 0
        ORDER BY n_dead_tup DESC
        LIMIT 10
      `;

      // Generate recommendations
      report.recommendations = this.generateRecommendations(report);

    } catch (error) {
      console.error(`${colors.red}Error collecting metrics:${colors.reset}`, error);
      throw error;
    }

    return report;
  }

  private generateRecommendations(report: PerformanceReport): string[] {
    const recommendations: string[] = [];

    // Cache hit ratio recommendations
    if (report.cacheHitRatio < 90) {
      recommendations.push(
        `⚠️ Cache hit ratio is ${report.cacheHitRatio}% (below 90%). Consider increasing shared_buffers.`
      );
    }

    // Slow query recommendations
    const verySlowQueries = report.slowestQueries.filter((q: any) => 
      Number(q.mean_ms) > 1000
    );
    if (verySlowQueries.length > 0) {
      recommendations.push(
        `⚠️ Found ${verySlowQueries.length} queries with mean time > 1000ms. Review query plans and consider optimization.`
      );
    }

    // Unused index recommendations
    const unusedIndexes = report.indexUsage.filter((idx: any) => 
      idx.status === 'UNUSED'
    );
    if (unusedIndexes.length > 0) {
      recommendations.push(
        `💡 Found ${unusedIndexes.length} unused indexes. Consider dropping to reduce storage and maintenance overhead.`
      );
    }

    // Table bloat recommendations
    const bloatedTables = report.tableStats.filter((t: any) => 
      Number(t.bloat_ratio) > 20
    );
    if (bloatedTables.length > 0) {
      recommendations.push(
        `⚠️ Found ${bloatedTables.length} tables with >20% bloat. Consider running VACUUM ANALYZE.`
      );
    }

    // Connection pool recommendations
    if (report.activeConnections > 50) {
      recommendations.push(
        `⚠️ High number of active connections (${report.activeConnections}). Review connection pooling settings.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ No performance issues detected. Database is running optimally.');
    }

    return recommendations;
  }

  formatReport(report: PerformanceReport): string {
    switch (this.format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      
      case 'html':
        return this.formatAsHTML(report);
      
      case 'text':
      default:
        return this.formatAsText(report);
    }
  }

  private formatAsText(report: PerformanceReport): string {
    let output = '';
    
    output += `${colors.bold}${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}\n`;
    output += `${colors.bold}${colors.blue}   PostgreSQL Performance Report${colors.reset}\n`;
    output += `${colors.bold}${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}\n\n`;
    
    output += `${colors.gray}Generated: ${report.timestamp.toLocaleString()}${colors.reset}\n`;
    output += `${colors.gray}Database: ${report.database}${colors.reset}\n`;
    output += `${colors.gray}Active Connections: ${report.activeConnections}${colors.reset}\n`;
    output += `${colors.gray}Cache Hit Ratio: ${report.cacheHitRatio}%${colors.reset}\n\n`;

    // Recommendations
    output += `${colors.bold}${colors.yellow}📊 Recommendations${colors.reset}\n`;
    output += `${colors.gray}${'─'.repeat(60)}${colors.reset}\n`;
    report.recommendations.forEach(rec => {
      output += `${rec}\n`;
    });
    output += '\n';

    // Slowest Queries
    output += `${colors.bold}${colors.red}🐌 Top 5 Slowest Queries${colors.reset}\n`;
    output += `${colors.gray}${'─'.repeat(60)}${colors.reset}\n`;
    report.slowestQueries.slice(0, 5).forEach((q: any, i: number) => {
      output += `${colors.bold}${i + 1}.${colors.reset} ${q.query}\n`;
      output += `   ${colors.gray}Calls: ${q.calls} | Mean: ${q.mean_ms}ms | Total: ${q.total_ms}ms | Cache Hit: ${q.cache_hit_ratio}%${colors.reset}\n\n`;
    });

    // Most Frequent Queries
    output += `${colors.bold}${colors.yellow}🔄 Top 5 Most Frequent Queries${colors.reset}\n`;
    output += `${colors.gray}${'─'.repeat(60)}${colors.reset}\n`;
    report.frequentQueries.slice(0, 5).forEach((q: any, i: number) => {
      output += `${colors.bold}${i + 1}.${colors.reset} ${q.query}\n`;
      output += `   ${colors.gray}Calls: ${q.calls} | Mean: ${q.mean_ms}ms | Total: ${q.total_ms}ms${colors.reset}\n\n`;
    });

    // Unused Indexes
    const unusedIndexes = report.indexUsage.filter((idx: any) => idx.status === 'UNUSED');
    if (unusedIndexes.length > 0) {
      output += `${colors.bold}${colors.red}🗑️ Unused Indexes${colors.reset}\n`;
      output += `${colors.gray}${'─'.repeat(60)}${colors.reset}\n`;
      unusedIndexes.forEach((idx: any) => {
        output += `• ${idx.schemaname}.${idx.table_name}.${idx.indexname} (${idx.size})\n`;
      });
      output += '\n';
    }

    // Bloated Tables
    const bloatedTables = report.tableStats.filter((t: any) => Number(t.bloat_ratio) > 10);
    if (bloatedTables.length > 0) {
      output += `${colors.bold}${colors.yellow}💨 Tables with Bloat${colors.reset}\n`;
      output += `${colors.gray}${'─'.repeat(60)}${colors.reset}\n`;
      bloatedTables.forEach((t: any) => {
        output += `• ${t.schemaname}.${t.table_name}: ${t.bloat_ratio}% bloat (${t.dead_rows} dead rows)\n`;
        if (t.last_vacuum) {
          output += `  ${colors.gray}Last vacuum: ${new Date(t.last_vacuum).toLocaleDateString()}${colors.reset}\n`;
        }
      });
      output += '\n';
    }

    return output;
  }

  private formatAsHTML(report: PerformanceReport): string {
    return `<!DOCTYPE html>
<html>
<head>
    <title>PostgreSQL Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
        h2 { color: #666; margin-top: 30px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f9f9f9; padding: 15px; border-radius: 5px; }
        .metric-label { font-size: 12px; color: #666; }
        .metric-value { font-size: 24px; font-weight: bold; color: #333; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 10px 0; }
        .success { background: #d4edda; border-left: 4px solid #28a745; padding: 10px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #4CAF50; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        tr:hover { background: #f5f5f5; }
        .query { font-family: monospace; font-size: 12px; }
        .timestamp { color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>PostgreSQL Performance Report</h1>
        <p class="timestamp">Generated: ${report.timestamp.toLocaleString()} | Database: ${report.database}</p>
        
        <div class="metrics">
            <div class="metric">
                <div class="metric-label">Cache Hit Ratio</div>
                <div class="metric-value">${report.cacheHitRatio}%</div>
            </div>
            <div class="metric">
                <div class="metric-label">Active Connections</div>
                <div class="metric-value">${report.activeConnections}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Slow Queries</div>
                <div class="metric-value">${report.slowestQueries.filter((q: any) => Number(q.mean_ms) > 1000).length}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Unused Indexes</div>
                <div class="metric-value">${report.indexUsage.filter((idx: any) => idx.status === 'UNUSED').length}</div>
            </div>
        </div>

        <h2>Recommendations</h2>
        ${report.recommendations.map(rec => 
          rec.includes('✅') ? `<div class="success">${rec}</div>` : `<div class="warning">${rec}</div>`
        ).join('')}

        <h2>Slowest Queries</h2>
        <table>
            <thead>
                <tr>
                    <th>Query</th>
                    <th>Calls</th>
                    <th>Mean (ms)</th>
                    <th>Total (ms)</th>
                    <th>Cache Hit %</th>
                </tr>
            </thead>
            <tbody>
                ${report.slowestQueries.slice(0, 10).map((q: any) => `
                    <tr>
                        <td class="query">${q.query}</td>
                        <td>${q.calls}</td>
                        <td>${q.mean_ms}</td>
                        <td>${q.total_ms}</td>
                        <td>${q.cache_hit_ratio}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <h2>Most Frequent Queries</h2>
        <table>
            <thead>
                <tr>
                    <th>Query</th>
                    <th>Calls</th>
                    <th>Mean (ms)</th>
                    <th>Total (ms)</th>
                </tr>
            </thead>
            <tbody>
                ${report.frequentQueries.slice(0, 10).map((q: any) => `
                    <tr>
                        <td class="query">${q.query}</td>
                        <td>${q.calls}</td>
                        <td>${q.mean_ms}</td>
                        <td>${q.total_ms}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;
  }

  async saveReport(content: string): Promise<void> {
    if (this.outputFile) {
      const outputPath = path.resolve(this.outputFile);
      await fs.promises.writeFile(outputPath, content);
      console.log(`${colors.green}✅ Report saved to: ${outputPath}${colors.reset}`);
    } else {
      console.log(content);
    }
  }

  async generateReport(): Promise<void> {
    try {
      console.log(`${colors.blue}📊 Collecting performance metrics...${colors.reset}`);
      const report = await this.collectMetrics();
      
      console.log(`${colors.blue}📝 Generating report...${colors.reset}`);
      const formattedReport = this.formatReport(report);
      
      await this.saveReport(formattedReport);
      
      console.log(`${colors.green}✅ Performance report generated successfully!${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}❌ Failed to generate report:${colors.reset}`, error);
      process.exit(1);
    }
  }

  async scheduleReports(intervalMinutes: number = 60): Promise<void> {
    console.log(`${colors.blue}🔄 Starting scheduled monitoring (every ${intervalMinutes} minutes)${colors.reset}`);
    
    // Generate initial report
    await this.generateReport();
    
    // Schedule periodic reports
    setInterval(async () => {
      console.log(`\n${colors.gray}[${new Date().toLocaleTimeString()}] Running scheduled report...${colors.reset}`);
      await this.generateReport();
    }, intervalMinutes * 60 * 1000);
    
    console.log(`${colors.gray}Press Ctrl+C to stop monitoring${colors.reset}`);
  }
}

// Command-line argument parsing
async function main() {
  const args = process.argv.slice(2);
  let format: 'json' | 'text' | 'html' = 'text';
  let outputFile: string | undefined;
  let schedule: number | undefined;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--format':
      case '-f':
        format = args[++i] as 'json' | 'text' | 'html';
        break;
      case '--output':
      case '-o':
        outputFile = args[++i];
        break;
      case '--schedule':
      case '-s':
        schedule = parseInt(args[++i]);
        break;
      case '--help':
      case '-h':
        help = true;
        break;
    }
  }

  if (help) {
    console.log(`
${colors.bold}PostgreSQL Performance Monitor${colors.reset}

Usage: npx tsx scripts/monitor-performance.ts [options]

Options:
  -f, --format <type>    Output format: json, text, or html (default: text)
  -o, --output <file>    Save report to file instead of stdout
  -s, --schedule <min>   Run reports every N minutes (continuous monitoring)
  -h, --help            Show this help message

Examples:
  # Generate a text report to console
  npx tsx scripts/monitor-performance.ts
  
  # Save HTML report to file
  npx tsx scripts/monitor-performance.ts -f html -o report.html
  
  # Run continuous monitoring every 30 minutes
  npx tsx scripts/monitor-performance.ts -s 30 -o performance.log
  
  # Generate JSON report for programmatic use
  npx tsx scripts/monitor-performance.ts -f json -o metrics.json
`);
    process.exit(0);
  }

  const monitor = new PerformanceMonitor(format, outputFile);
  
  try {
    if (schedule) {
      await monitor.scheduleReports(schedule);
    } else {
      await monitor.generateReport();
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log(`\n${colors.yellow}Shutting down monitoring...${colors.reset}`);
  await prisma.$disconnect();
  process.exit(0);
});

// Run the monitor
main().catch(console.error);