#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase configuration is missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initDatabase() {
  console.log('🚀 Starting database initialization...');

  try {
    // Test Supabase connection
    console.log('📡 Testing Supabase connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
      console.error('❌ Supabase connection failed:', error);
      process.exit(1);
    }
    console.log('✅ Supabase connection successful');

    // Run Prisma migrations
    console.log('🔄 Running Prisma migrations...');
    // Note: In production, you'd run: npx prisma migrate deploy
    // For development: npx prisma migrate dev

    // Seed initial Hanja data
    console.log('📚 Seeding Hanja dictionary...');
    const hanjaData = [
      // 긍정적 의미의 한자들
      { character: '智', meaning: '지혜', koreanReading: '지', strokes: 12, element: '수', category: ['virtue', 'positive'] },
      { character: '慧', meaning: '슬기', koreanReading: '혜', strokes: 15, element: '화', category: ['virtue', 'positive'] },
      { character: '仁', meaning: '어질다', koreanReading: '인', strokes: 4, element: '목', category: ['virtue', 'positive'] },
      { character: '勇', meaning: '용감', koreanReading: '용', strokes: 9, element: '금', category: ['virtue', 'positive'] },
      { character: '誠', meaning: '정성', koreanReading: '성', strokes: 13, element: '토', category: ['virtue', 'positive'] },
      { character: '愛', meaning: '사랑', koreanReading: '애', strokes: 13, element: '화', category: ['emotion', 'positive'] },
      { character: '希', meaning: '희망', koreanReading: '희', strokes: 7, element: '화', category: ['emotion', 'positive'] },
      { character: '光', meaning: '빛', koreanReading: '광', strokes: 6, element: '화', category: ['nature', 'positive'] },
      { character: '星', meaning: '별', koreanReading: '성', strokes: 9, element: '화', category: ['nature', 'positive'] },
      { character: '月', meaning: '달', koreanReading: '월', strokes: 4, element: '수', category: ['nature', 'positive'] },
      { character: '春', meaning: '봄', koreanReading: '춘', strokes: 9, element: '목', category: ['nature', 'season'] },
      { character: '夏', meaning: '여름', koreanReading: '하', strokes: 10, element: '화', category: ['nature', 'season'] },
      { character: '秋', meaning: '가을', koreanReading: '추', strokes: 9, element: '금', category: ['nature', 'season'] },
      { character: '冬', meaning: '겨울', koreanReading: '동', strokes: 5, element: '수', category: ['nature', 'season'] },
      { character: '山', meaning: '산', koreanReading: '산', strokes: 3, element: '토', category: ['nature'] },
      { character: '水', meaning: '물', koreanReading: '수', strokes: 4, element: '수', category: ['nature'] },
      { character: '木', meaning: '나무', koreanReading: '목', strokes: 4, element: '목', category: ['nature'] },
      { character: '火', meaning: '불', koreanReading: '화', strokes: 4, element: '화', category: ['nature'] },
      { character: '土', meaning: '흙', koreanReading: '토', strokes: 3, element: '토', category: ['nature'] },
      { character: '金', meaning: '금', koreanReading: '금', strokes: 8, element: '금', category: ['nature', 'wealth'] },
    ];

    for (const hanja of hanjaData) {
      await prisma.hanjaDict.upsert({
        where: { character: hanja.character },
        create: hanja,
        update: hanja,
      });
    }
    console.log(`✅ Seeded ${hanjaData.length} Hanja characters`);

    // Create test user (optional)
    console.log('👤 Creating test user...');
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      create: {
        email: 'test@example.com',
        name: 'Test User',
      },
      update: {},
    });
    console.log('✅ Test user created:', testUser.email);

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Copy .env.example to .env.local and fill in your Supabase credentials');
    console.log('2. Run: npx prisma migrate dev --name init');
    console.log('3. Run: npm run dev to start the development server');

  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});