/**
 * Phase 2 API 통합 테스트
 *
 * 실제 개발 서버에 요청을 보내 API 엔드포인트를 검증합니다.
 *
 * 실행 방법:
 * 1. 터미널 1: npm run dev
 * 2. 터미널 2: npx tsx scripts/test-api-endpoints.ts
 */

const BASE_URL = 'http://localhost:3000';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    calculationTime?: number;
    executionTime?: number;
    totalGenerated?: number;
    totalScored?: number;
    timestamp?: string;
  };
}

// ============================================================
// 테스트 헬퍼 함수
// ============================================================

async function testEndpoint(
  name: string,
  method: string,
  path: string,
  body?: any
): Promise<ApiResponse> {
  console.log(`\n${name}`);
  console.log(`${method} ${path}`);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      console.log(`❌ 실패 (${response.status})`);
      console.log(`   에러: ${data.message || data.error}`);
      if (data.details) console.log(`   상세: ${data.details}`);
      return data;
    }

    console.log(`✅ 성공!`);
    return data;
  } catch (error) {
    console.log(`❌ 네트워크 에러: ${error}`);
    return { success: false, error: String(error) };
  }
}

// ============================================================
// 테스트 시나리오
// ============================================================

async function runTests() {
  console.log('🧪 Phase 2 API 통합 테스트\n');
  console.log('=' .repeat(60));

  // ────────────────────────────────────────────────────────
  // 1️⃣ POST /api/naming/analyze - 사주 분석
  // ────────────────────────────────────────────────────────
  const analyzeResult = await testEndpoint(
    '1️⃣ POST /api/naming/analyze',
    'POST',
    '/api/naming/analyze',
    {
      birthDate: '1990-05-15',
      birthTime: '14:30',
      isLunar: false,
      gender: 'male',
    }
  );

  if (analyzeResult.success && analyzeResult.data) {
    const { sajuDataId, elementCounts, lackingElements, favorableElements } = analyzeResult.data;
    console.log(`   사주 ID: ${sajuDataId}`);
    console.log(`   오행 분포:`);
    Object.entries(elementCounts).forEach(([elem, count]) => {
      console.log(`      ${elem}: ${count}`);
    });
    console.log(`   부족한 오행: [${lackingElements.join(', ')}]`);
    console.log(`   유리한 오행: [${favorableElements.join(', ')}]`);
    if (analyzeResult.metadata?.calculationTime) {
      console.log(`   계산 시간: ${analyzeResult.metadata.calculationTime}ms`);
    }

    // ────────────────────────────────────────────────────────
    // 2️⃣ POST /api/naming/recommend - 이름 추천 (사주 ID 사용)
    // ────────────────────────────────────────────────────────
    console.log('\n' + '─'.repeat(60));

    const recommendResult = await testEndpoint(
      '2️⃣ POST /api/naming/recommend (사주 ID 사용)',
      'POST',
      '/api/naming/recommend',
      {
        sajuDataId,
        lastName: '김',
        preferences: {
          minScore: 70,
          maxResults: 50,
          gender: 'male',
        },
      }
    );

    if (recommendResult.success && recommendResult.data) {
      const { candidates, saju } = recommendResult.data;
      console.log(`   생성된 후보: ${candidates.length}개`);
      console.log(`   사주 부족 오행: [${saju.lackingElements.join(', ')}]`);
      console.log(`   사주 유리 오행: [${saju.favorableElements.join(', ')}]`);

      if (recommendResult.metadata?.executionTime) {
        console.log(`   처리 시간: ${recommendResult.metadata.executionTime}ms`);
      }

      if (candidates.length > 0) {
        console.log(`\n   상위 5개 후보:`);
        candidates.slice(0, 5).forEach((candidate: any, idx: number) => {
          const char1 = candidate.characters[0];
          const char2 = candidate.characters[1];
          console.log(`   ${idx + 1}. ${char1.character}${char2.character} (${candidate.scores.overall.toFixed(1)}점)`);
          console.log(`      ${char1.character}(${char1.koreanReading}) + ${char2.character}(${char2.koreanReading})`);
          console.log(`      의미: ${char1.meaning} + ${char2.meaning}`);
        });
      }

      // ────────────────────────────────────────────────────────
      // 3️⃣ GET /api/naming/character/:id - 한자 조회
      // ────────────────────────────────────────────────────────
      if (candidates.length > 0) {
        console.log('\n' + '─'.repeat(60));

        const firstChar = candidates[0].characters[0].character;
        const charResult = await testEndpoint(
          '3️⃣ GET /api/naming/character/:id (한자로 조회)',
          'GET',
          `/api/naming/character/${firstChar}`
        );

        if (charResult.success && charResult.data) {
          const char = charResult.data;
          console.log(`   한자: ${char.character}`);
          console.log(`   훈음: ${char.koreanReading}`);
          console.log(`   의미: ${char.meaning}`);
          console.log(`   오행: ${char.element}`);
          console.log(`   음양: ${char.yinYang}`);
          console.log(`   획수: ${char.strokes}`);
          console.log(`   작명 적합: ${char.isGoodForNaming ? '✅' : '❌'}`);
        }

        // ────────────────────────────────────────────────────────
        // 4️⃣ GET /api/naming/character/:id?include=readings
        // ────────────────────────────────────────────────────────
        console.log('\n' + '─'.repeat(60));

        const charWithReadingsResult = await testEndpoint(
          '4️⃣ GET /api/naming/character/:id?include=readings',
          'GET',
          `/api/naming/character/${firstChar}?include=readings`
        );

        if (charWithReadingsResult.success && charWithReadingsResult.data) {
          const char = charWithReadingsResult.data;
          if (char.alternativeReadings && char.alternativeReadings.length > 0) {
            console.log(`   추가 음독:`);
            char.alternativeReadings.forEach((reading: any) => {
              console.log(`      ${reading.reading} ${reading.isPrimary ? '(주음)' : ''}`);
              if (reading.soundElement) {
                console.log(`         음오행: ${reading.soundElement}`);
              }
            });
          }
        }
      }
    }

    // ────────────────────────────────────────────────────────
    // 5️⃣ POST /api/naming/recommend - 이름 추천 (생년월일로 직접)
    // ────────────────────────────────────────────────────────
    console.log('\n' + '─'.repeat(60));

    const recommendDirectResult = await testEndpoint(
      '5️⃣ POST /api/naming/recommend (생년월일로 직접)',
      'POST',
      '/api/naming/recommend',
      {
        birthData: {
          birthDate: '1995-08-20',
          birthTime: '10:15',
          isLunar: false,
          gender: 'female',
        },
        lastName: '이',
        preferences: {
          minScore: 65,
          maxResults: 30,
          gender: 'female',
        },
      }
    );

    if (recommendDirectResult.success && recommendDirectResult.data) {
      const { candidates } = recommendDirectResult.data;
      console.log(`   생성된 후보: ${candidates.length}개`);

      if (recommendDirectResult.metadata?.executionTime) {
        console.log(`   처리 시간: ${recommendDirectResult.metadata.executionTime}ms`);
      }

      if (candidates.length > 0) {
        console.log(`\n   상위 3개 후보:`);
        candidates.slice(0, 3).forEach((candidate: any, idx: number) => {
          const char1 = candidate.characters[0];
          const char2 = candidate.characters[1];
          console.log(`   ${idx + 1}. ${char1.character}${char2.character} (${candidate.scores.overall.toFixed(1)}점)`);
        });
      }
    }
  }

  // ────────────────────────────────────────────────────────
  // 6️⃣ 에러 처리 테스트
  // ────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('\n🛡️ 에러 처리 테스트\n');
  console.log('=' .repeat(60));

  // 잘못된 날짜 형식
  await testEndpoint(
    '6️⃣ 잘못된 날짜 형식',
    'POST',
    '/api/naming/analyze',
    {
      birthDate: '90-05-15', // 잘못된 형식
      birthTime: '14:30',
      isLunar: false,
      gender: 'male',
    }
  );

  // 존재하지 않는 사주 ID
  await testEndpoint(
    '7️⃣ 존재하지 않는 사주 ID',
    'POST',
    '/api/naming/recommend',
    {
      sajuDataId: '00000000-0000-0000-0000-000000000000',
      lastName: '김',
      preferences: {
        minScore: 60,
        maxResults: 50,
      },
    }
  );

  // 존재하지 않는 한자
  await testEndpoint(
    '8️⃣ 존재하지 않는 한자',
    'GET',
    '/api/naming/character/囧' // 실제로 없을 가능성이 높은 한자
  );

  // Method not allowed
  await testEndpoint(
    '9️⃣ GET 요청 (POST만 허용)',
    'GET',
    '/api/naming/analyze'
  );

  // ────────────────────────────────────────────────────────
  // 완료
  // ────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('\n🎉 API 테스트 완료!\n');
}

// ============================================================
// 실행
// ============================================================

runTests().catch((error) => {
  console.error('테스트 실행 중 오류:', error);
  process.exit(1);
});
