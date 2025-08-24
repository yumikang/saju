#!/usr/bin/env npx tsx
// SQLite to PostgreSQL Data Migration Script
// Migrates all data from SQLite database to PostgreSQL

import { PrismaClient } from '@prisma/client';
import { join } from 'path';
import { existsSync } from 'fs';
import Database from 'better-sqlite3';

// PostgreSQL client using current schema
const postgresClient = new PrismaClient();

// SQLite direct access using better-sqlite3
const sqliteDbPath = join(process.cwd(), 'prisma', 'dev.db');

interface MigrationStats {
  tableName: string;
  sourceCount: number;
  migratedCount: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
}

const stats: MigrationStats[] = [];

async function logProgress(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warn: '\x1b[33m'     // Yellow
  };
  const reset = '\x1b[0m';
  console.log(`${colors[level]}[${new Date().toISOString()}] ${message}${reset}`);
}

async function migrateUsers(sqliteDb: Database.Database) {
  const tableName = 'users';
  const stat: MigrationStats = {
    tableName,
    sourceCount: 0,
    migratedCount: 0,
    errors: 0,
    startTime: new Date()
  };

  try {
    await logProgress(`Starting migration of ${tableName}...`, 'info');
    
    const users = sqliteDb.prepare('SELECT * FROM users').all() as any[];
    stat.sourceCount = users.length;
    
    for (const user of users) {
      try {
        await postgresClient.user.upsert({
          where: { id: user.id },
          update: {
            email: user.email,
            name: user.name,
            phone: user.phone,
            avatarUrl: user.avatar_url,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at)
          },
          create: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            avatarUrl: user.avatar_url,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at)
          }
        });
        stat.migratedCount++;
      } catch (error) {
        stat.errors++;
        await logProgress(`Error migrating user ${user.id}: ${error}`, 'error');
      }
    }
    
    stat.endTime = new Date();
    stats.push(stat);
    await logProgress(`✅ Migrated ${stat.migratedCount}/${stat.sourceCount} ${tableName}`, 'success');
  } catch (error) {
    await logProgress(`Failed to migrate ${tableName}: ${error}`, 'error');
    throw error;
  }
}

async function migrateSajuData(sqliteDb: Database.Database) {
  const tableName = 'saju_data';
  const stat: MigrationStats = {
    tableName,
    sourceCount: 0,
    migratedCount: 0,
    errors: 0,
    startTime: new Date()
  };

  try {
    await logProgress(`Starting migration of ${tableName}...`, 'info');
    
    const sajuData = sqliteDb.prepare('SELECT * FROM saju_data').all() as any[];
    stat.sourceCount = sajuData.length;
    
    for (const data of sajuData) {
      try {
        await postgresClient.sajuData.upsert({
          where: { id: data.id },
          update: {
            userId: data.user_id,
            name: data.name,
            birthDate: new Date(data.birth_date),
            birthTime: data.birth_time,
            isLunar: Boolean(data.is_lunar),
            gender: data.gender,
            yearGan: data.year_gan,
            yearJi: data.year_ji,
            monthGan: data.month_gan,
            monthJi: data.month_ji,
            dayGan: data.day_gan,
            dayJi: data.day_ji,
            hourGan: data.hour_gan,
            hourJi: data.hour_ji,
            woodCount: data.wood_count,
            fireCount: data.fire_count,
            earthCount: data.earth_count,
            metalCount: data.metal_count,
            waterCount: data.water_count,
            primaryYongsin: data.primary_yongsin,
            secondaryYongsin: data.secondary_yongsin,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          },
          create: {
            id: data.id,
            userId: data.user_id,
            name: data.name,
            birthDate: new Date(data.birth_date),
            birthTime: data.birth_time,
            isLunar: Boolean(data.is_lunar),
            gender: data.gender,
            yearGan: data.year_gan,
            yearJi: data.year_ji,
            monthGan: data.month_gan,
            monthJi: data.month_ji,
            dayGan: data.day_gan,
            dayJi: data.day_ji,
            hourGan: data.hour_gan,
            hourJi: data.hour_ji,
            woodCount: data.wood_count,
            fireCount: data.fire_count,
            earthCount: data.earth_count,
            metalCount: data.metal_count,
            waterCount: data.water_count,
            primaryYongsin: data.primary_yongsin,
            secondaryYongsin: data.secondary_yongsin,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          }
        });
        stat.migratedCount++;
      } catch (error) {
        stat.errors++;
        await logProgress(`Error migrating saju_data ${data.id}: ${error}`, 'error');
      }
    }
    
    stat.endTime = new Date();
    stats.push(stat);
    await logProgress(`✅ Migrated ${stat.migratedCount}/${stat.sourceCount} ${tableName}`, 'success');
  } catch (error) {
    await logProgress(`Failed to migrate ${tableName}: ${error}`, 'error');
    throw error;
  }
}

async function migrateNamingResults(sqliteDb: Database.Database) {
  const tableName = 'naming_results';
  const stat: MigrationStats = {
    tableName,
    sourceCount: 0,
    migratedCount: 0,
    errors: 0,
    startTime: new Date()
  };

  try {
    await logProgress(`Starting migration of ${tableName}...`, 'info');
    
    const namingResults = sqliteDb.prepare('SELECT * FROM naming_results').all() as any[];
    stat.sourceCount = namingResults.length;
    
    for (const result of namingResults) {
      try {
        // Handle preferredValues - parse if it's a string
        let preferredValues = result.preferred_values;
        if (typeof preferredValues === 'string' && preferredValues) {
          try {
            preferredValues = JSON.parse(preferredValues);
          } catch {
            preferredValues = null;
          }
        }

        await postgresClient.namingResult.upsert({
          where: { id: result.id },
          update: {
            userId: result.user_id,
            sajuDataId: result.saju_data_id,
            lastName: result.last_name,
            firstName: result.first_name,
            fullName: result.full_name,
            lastNameHanja: result.last_name_hanja,
            firstNameHanja: result.first_name_hanja,
            totalStrokes: result.total_strokes,
            balanceScore: result.balance_score,
            soundScore: result.sound_score,
            meaningScore: result.meaning_score,
            overallScore: result.overall_score,
            generationMethod: result.generation_method,
            aiModel: result.ai_model,
            aiPrompt: result.ai_prompt,
            preferredValues: preferredValues,
            notes: result.notes,
            createdAt: new Date(result.created_at)
          },
          create: {
            id: result.id,
            userId: result.user_id,
            sajuDataId: result.saju_data_id,
            lastName: result.last_name,
            firstName: result.first_name,
            fullName: result.full_name,
            lastNameHanja: result.last_name_hanja,
            firstNameHanja: result.first_name_hanja,
            totalStrokes: result.total_strokes,
            balanceScore: result.balance_score,
            soundScore: result.sound_score,
            meaningScore: result.meaning_score,
            overallScore: result.overall_score,
            generationMethod: result.generation_method,
            aiModel: result.ai_model,
            aiPrompt: result.ai_prompt,
            preferredValues: preferredValues,
            notes: result.notes,
            createdAt: new Date(result.created_at)
          }
        });
        stat.migratedCount++;
      } catch (error) {
        stat.errors++;
        await logProgress(`Error migrating naming_result ${result.id}: ${error}`, 'error');
      }
    }
    
    stat.endTime = new Date();
    stats.push(stat);
    await logProgress(`✅ Migrated ${stat.migratedCount}/${stat.sourceCount} ${tableName}`, 'success');
  } catch (error) {
    await logProgress(`Failed to migrate ${tableName}: ${error}`, 'error');
    throw error;
  }
}

async function migrateFavorites(sqliteDb: Database.Database) {
  const tableName = 'favorites';
  const stat: MigrationStats = {
    tableName,
    sourceCount: 0,
    migratedCount: 0,
    errors: 0,
    startTime: new Date()
  };

  try {
    await logProgress(`Starting migration of ${tableName}...`, 'info');
    
    const favorites = sqliteDb.prepare('SELECT * FROM favorites').all() as any[];
    stat.sourceCount = favorites.length;
    
    for (const favorite of favorites) {
      try {
        await postgresClient.favorite.upsert({
          where: { 
            userId_namingResultId: {
              userId: favorite.user_id,
              namingResultId: favorite.naming_result_id
            }
          },
          update: {
            rating: favorite.rating,
            comment: favorite.comment,
            createdAt: new Date(favorite.created_at)
          },
          create: {
            id: favorite.id,
            userId: favorite.user_id,
            namingResultId: favorite.naming_result_id,
            rating: favorite.rating,
            comment: favorite.comment,
            createdAt: new Date(favorite.created_at)
          }
        });
        stat.migratedCount++;
      } catch (error) {
        stat.errors++;
        await logProgress(`Error migrating favorite ${favorite.id}: ${error}`, 'error');
      }
    }
    
    stat.endTime = new Date();
    stats.push(stat);
    await logProgress(`✅ Migrated ${stat.migratedCount}/${stat.sourceCount} ${tableName}`, 'success');
  } catch (error) {
    await logProgress(`Failed to migrate ${tableName}: ${error}`, 'error');
    throw error;
  }
}

async function migrateHanjaDict(sqliteDb: Database.Database) {
  const tableName = 'hanja_dict';
  const stat: MigrationStats = {
    tableName,
    sourceCount: 0,
    migratedCount: 0,
    errors: 0,
    startTime: new Date()
  };

  try {
    await logProgress(`Starting migration of ${tableName}...`, 'info');
    
    const hanjaDict = sqliteDb.prepare('SELECT * FROM hanja_dict').all() as any[];
    stat.sourceCount = hanjaDict.length;
    
    // Process in batches for better performance
    const batchSize = 100;
    for (let i = 0; i < hanjaDict.length; i += batchSize) {
      const batch = hanjaDict.slice(i, i + batchSize);
      
      for (const hanja of batch) {
        try {
          // Handle evidenceJSON - parse if it's a string
          let evidenceJSON = hanja.evidence_json;
          if (typeof evidenceJSON === 'string' && evidenceJSON) {
            try {
              evidenceJSON = JSON.parse(evidenceJSON);
            } catch {
              evidenceJSON = null;
            }
          }

          // Map enum values for PostgreSQL
          const elementMap: { [key: string]: any } = {
            '金': 'METAL',
            '木': 'WOOD', 
            '水': 'WATER',
            '火': 'FIRE',
            '土': 'EARTH'
          };

          const yinYangMap: { [key: string]: any } = {
            '음': 'YIN',
            '양': 'YANG'
          };

          await postgresClient.hanjaDict.upsert({
            where: { character: hanja.character },
            update: {
              meaning: hanja.meaning,
              strokes: hanja.strokes,
              element: hanja.element ? elementMap[hanja.element] || hanja.element : null,
              yinYang: hanja.yin_yang ? yinYangMap[hanja.yin_yang] || hanja.yin_yang : null,
              review: hanja.review === 'needs_review' ? 'needsReview' : hanja.review || 'ok',
              evidenceJSON: evidenceJSON,
              decidedBy: hanja.decided_by,
              ruleset: hanja.ruleset,
              codepoint: hanja.codepoint,
              koreanReading: hanja.korean_reading,
              chineseReading: hanja.chinese_reading,
              radical: hanja.radical,
              usageFrequency: hanja.usage_frequency || 0,
              nameFrequency: hanja.name_frequency || 0,
              category: hanja.category,
              gender: hanja.gender,
              createdAt: new Date(hanja.created_at),
              updatedAt: new Date(hanja.updated_at)
            },
            create: {
              id: hanja.id,
              character: hanja.character,
              meaning: hanja.meaning,
              strokes: hanja.strokes,
              element: hanja.element ? elementMap[hanja.element] || hanja.element : null,
              yinYang: hanja.yin_yang ? yinYangMap[hanja.yin_yang] || hanja.yin_yang : null,
              review: hanja.review === 'needs_review' ? 'needsReview' : hanja.review || 'ok',
              evidenceJSON: evidenceJSON,
              decidedBy: hanja.decided_by,
              ruleset: hanja.ruleset,
              codepoint: hanja.codepoint,
              koreanReading: hanja.korean_reading,
              chineseReading: hanja.chinese_reading,
              radical: hanja.radical,
              usageFrequency: hanja.usage_frequency || 0,
              nameFrequency: hanja.name_frequency || 0,
              category: hanja.category,
              gender: hanja.gender,
              createdAt: new Date(hanja.created_at),
              updatedAt: new Date(hanja.updated_at)
            }
          });
          stat.migratedCount++;
        } catch (error) {
          stat.errors++;
          await logProgress(`Error migrating hanja ${hanja.character}: ${error}`, 'error');
        }
      }
      
      await logProgress(`Progress: ${Math.min(i + batchSize, hanjaDict.length)}/${hanjaDict.length} records`, 'info');
    }
    
    stat.endTime = new Date();
    stats.push(stat);
    await logProgress(`✅ Migrated ${stat.migratedCount}/${stat.sourceCount} ${tableName}`, 'success');
  } catch (error) {
    await logProgress(`Failed to migrate ${tableName}: ${error}`, 'error');
    throw error;
  }
}

async function migrateHanjaReading(sqliteDb: Database.Database) {
  const tableName = 'hanja_reading';
  const stat: MigrationStats = {
    tableName,
    sourceCount: 0,
    migratedCount: 0,
    errors: 0,
    startTime: new Date()
  };

  try {
    await logProgress(`Starting migration of ${tableName}...`, 'info');
    
    const hanjaReadings = sqliteDb.prepare('SELECT * FROM hanja_reading').all() as any[];
    stat.sourceCount = hanjaReadings.length;
    
    for (const reading of hanjaReadings) {
      try {
        // Map enum values for soundElem
        const elementMap: { [key: string]: any } = {
          '金': 'METAL',
          '木': 'WOOD', 
          '水': 'WATER',
          '火': 'FIRE',
          '土': 'EARTH'
        };

        await postgresClient.hanjaReading.upsert({
          where: { 
            character_reading: {
              character: reading.character,
              reading: reading.reading
            }
          },
          update: {
            soundElem: reading.sound_elem ? elementMap[reading.sound_elem] || reading.sound_elem : null,
            isPrimary: Boolean(reading.is_primary)
          },
          create: {
            id: reading.id,
            character: reading.character,
            reading: reading.reading,
            soundElem: reading.sound_elem ? elementMap[reading.sound_elem] || reading.sound_elem : null,
            isPrimary: Boolean(reading.is_primary)
          }
        });
        stat.migratedCount++;
      } catch (error) {
        stat.errors++;
        await logProgress(`Error migrating hanja_reading ${reading.id}: ${error}`, 'error');
      }
    }
    
    stat.endTime = new Date();
    stats.push(stat);
    await logProgress(`✅ Migrated ${stat.migratedCount}/${stat.sourceCount} ${tableName}`, 'success');
  } catch (error) {
    await logProgress(`Failed to migrate ${tableName}: ${error}`, 'error');
    throw error;
  }
}

async function migrateUserSessions(sqliteDb: Database.Database) {
  const tableName = 'user_sessions';
  const stat: MigrationStats = {
    tableName,
    sourceCount: 0,
    migratedCount: 0,
    errors: 0,
    startTime: new Date()
  };

  try {
    await logProgress(`Starting migration of ${tableName}...`, 'info');
    
    const sessions = sqliteDb.prepare('SELECT * FROM user_sessions').all() as any[];
    stat.sourceCount = sessions.length;
    
    for (const session of sessions) {
      try {
        await postgresClient.userSession.upsert({
          where: { id: session.id },
          update: {
            userId: session.user_id,
            token: session.token,
            expiresAt: new Date(session.expires_at),
            createdAt: new Date(session.created_at)
          },
          create: {
            id: session.id,
            userId: session.user_id,
            token: session.token,
            expiresAt: new Date(session.expires_at),
            createdAt: new Date(session.created_at)
          }
        });
        stat.migratedCount++;
      } catch (error) {
        stat.errors++;
        await logProgress(`Error migrating session ${session.id}: ${error}`, 'error');
      }
    }
    
    stat.endTime = new Date();
    stats.push(stat);
    await logProgress(`✅ Migrated ${stat.migratedCount}/${stat.sourceCount} ${tableName}`, 'success');
  } catch (error) {
    await logProgress(`Failed to migrate ${tableName}: ${error}`, 'error');
    throw error;
  }
}

async function verifyMigration(sqliteDb: Database.Database) {
  await logProgress('\n📊 Verifying migration...', 'info');
  
  const verification = [
    { 
      table: 'users', 
      sqlite: (sqliteDb.prepare('SELECT COUNT(*) as count FROM users').get() as any).count,
      postgres: await postgresClient.user.count() 
    },
    { 
      table: 'saju_data', 
      sqlite: (sqliteDb.prepare('SELECT COUNT(*) as count FROM saju_data').get() as any).count,
      postgres: await postgresClient.sajuData.count() 
    },
    { 
      table: 'naming_results', 
      sqlite: (sqliteDb.prepare('SELECT COUNT(*) as count FROM naming_results').get() as any).count,
      postgres: await postgresClient.namingResult.count() 
    },
    { 
      table: 'favorites', 
      sqlite: (sqliteDb.prepare('SELECT COUNT(*) as count FROM favorites').get() as any).count,
      postgres: await postgresClient.favorite.count() 
    },
    { 
      table: 'hanja_dict', 
      sqlite: (sqliteDb.prepare('SELECT COUNT(*) as count FROM hanja_dict').get() as any).count,
      postgres: await postgresClient.hanjaDict.count() 
    },
    { 
      table: 'hanja_reading', 
      sqlite: (sqliteDb.prepare('SELECT COUNT(*) as count FROM hanja_reading').get() as any).count,
      postgres: await postgresClient.hanjaReading.count() 
    },
    { 
      table: 'user_sessions', 
      sqlite: (sqliteDb.prepare('SELECT COUNT(*) as count FROM user_sessions').get() as any).count,
      postgres: await postgresClient.userSession.count() 
    },
  ];

  console.log('\n┌─────────────────────┬──────────┬────────────┬─────────┐');
  console.log('│ Table               │ SQLite   │ PostgreSQL │ Status  │');
  console.log('├─────────────────────┼──────────┼────────────┼─────────┤');
  
  let allMatch = true;
  for (const v of verification) {
    const match = v.sqlite === v.postgres;
    allMatch = allMatch && match;
    const status = match ? '✅' : '❌';
    console.log(`│ ${v.table.padEnd(19)} │ ${v.sqlite.toString().padEnd(8)} │ ${v.postgres.toString().padEnd(10)} │ ${status}       │`);
  }
  console.log('└─────────────────────┴──────────┴────────────┴─────────┘');

  return allMatch;
}

async function printSummary() {
  console.log('\n📈 Migration Summary:');
  console.log('┌─────────────────────┬──────────┬───────────┬────────┬──────────┐');
  console.log('│ Table               │ Source   │ Migrated  │ Errors │ Duration │');
  console.log('├─────────────────────┼──────────┼───────────┼────────┼──────────┤');
  
  for (const stat of stats) {
    const duration = stat.endTime ? 
      `${((stat.endTime.getTime() - stat.startTime.getTime()) / 1000).toFixed(2)}s` : 
      'N/A';
    console.log(`│ ${stat.tableName.padEnd(19)} │ ${stat.sourceCount.toString().padEnd(8)} │ ${stat.migratedCount.toString().padEnd(9)} │ ${stat.errors.toString().padEnd(6)} │ ${duration.padEnd(8)} │`);
  }
  console.log('└─────────────────────┴──────────┴───────────┴────────┴──────────┘');
}

async function main() {
  const startTime = new Date();
  let sqliteDb: Database.Database | null = null;
  
  try {
    await logProgress('🚀 Starting SQLite to PostgreSQL migration...', 'info');
    await logProgress(`SQLite DB: ${sqliteDbPath}`, 'info');
    await logProgress(`PostgreSQL: ${process.env.DATABASE_URL?.split('@')[1] || 'Unknown'}`, 'info');
    
    // Check if SQLite database exists
    if (!existsSync(sqliteDbPath)) {
      throw new Error(`SQLite database not found at ${sqliteDbPath}`);
    }

    // Connect to databases
    await logProgress('Connecting to databases...', 'info');
    sqliteDb = new Database(sqliteDbPath, { readonly: true });
    await postgresClient.$connect();
    
    // Migrate tables in dependency order
    await migrateUsers(sqliteDb);
    await migrateSajuData(sqliteDb);
    await migrateNamingResults(sqliteDb);
    await migrateFavorites(sqliteDb);
    await migrateHanjaDict(sqliteDb);
    await migrateHanjaReading(sqliteDb);
    await migrateUserSessions(sqliteDb);
    
    // Verify migration
    const verified = await verifyMigration(sqliteDb);
    
    // Print summary
    await printSummary();
    
    const totalTime = ((new Date().getTime() - startTime.getTime()) / 1000).toFixed(2);
    
    if (verified) {
      await logProgress(`\n✅ Migration completed successfully in ${totalTime}s!`, 'success');
    } else {
      await logProgress(`\n⚠️ Migration completed with mismatches in ${totalTime}s. Please review the verification table.`, 'warn');
    }
    
  } catch (error) {
    await logProgress(`\n❌ Migration failed: ${error}`, 'error');
    process.exit(1);
  } finally {
    if (sqliteDb) {
      sqliteDb.close();
    }
    await postgresClient.$disconnect();
  }
}

// Run the migration
main()
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });