/**
 * API 응답 구조 확인 스크립트
 */

async function checkStructure() {
  // 1. Analyze
  const analyzeRes = await fetch('http://localhost:3000/api/naming/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      birthDate: '1990-05-15',
      birthTime: '14:30',
      isLunar: false,
      gender: 'male',
    }),
  });

  const analyzeData = await analyzeRes.json();
  const sajuDataId = analyzeData.data.sajuDataId;

  // 2. Recommend
  const recommendRes = await fetch('http://localhost:3000/api/naming/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sajuDataId,
      lastName: '김',
      preferences: { minScore: 70, maxResults: 5 },
    }),
  });

  const recommendData = await recommendRes.json();

  console.log('=== 응답 구조 ===\n');
  console.log('후보 개수:', recommendData.data.candidates.length);

  if (recommendData.data.candidates.length > 0) {
    const candidate = recommendData.data.candidates[0];
    console.log('\n첫 번째 후보 구조:');
    console.log(JSON.stringify(candidate, null, 2));
  }
}

checkStructure();
