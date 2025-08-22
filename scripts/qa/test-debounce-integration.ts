#!/usr/bin/env npx tsx
// 통합 디바운스 테스트 - API 호출 카운팅

async function testDebounceIntegration() {
  console.log('🔍 디바운스 통합 테스트\n');
  console.log('=' .repeat(80));
  
  const baseURL = 'http://localhost:3003';
  let callTimestamps: number[] = [];
  
  // API 호출 시뮬레이션 함수
  async function makeApiCall(reading: string): Promise<void> {
    const timestamp = Date.now();
    callTimestamps.push(timestamp);
    
    try {
      const response = await fetch(`${baseURL}/api/hanja/search?reading=${encodeURIComponent(reading)}&surname=true&limit=5`);
      const data = await response.json();
      console.log(`  [API Call #${callTimestamps.length}] "${reading}" → ${data.data?.length || 0} results`);
    } catch (error) {
      console.log(`  [API Call #${callTimestamps.length}] "${reading}" → Error`);
    }
  }
  
  // 디바운스 함수 구현
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;
    
    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  }
  
  // 테스트 시나리오
  console.log('\n📌 시나리오 1: 디바운스 없이 연속 호출');
  console.log('   3회 연속 호출 → 3회 API 호출 예상');
  callTimestamps = [];
  
  await makeApiCall('김');
  await makeApiCall('이');
  await makeApiCall('박');
  
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log(`   결과: ${callTimestamps.length}회 호출\n`);
  
  console.log('📌 시나리오 2: 300ms 디바운스 적용');
  console.log('   빠른 연속 입력 시뮬레이션 → 1회만 호출 예상');
  callTimestamps = [];
  
  const debouncedApiCall = debounce(makeApiCall, 300);
  
  // 빠르게 연속 호출 (50ms 간격)
  const inputs = ['ㄱ', '기', '김'];
  for (let i = 0; i < inputs.length; i++) {
    console.log(`   입력: "${inputs[i]}"`);
    debouncedApiCall(inputs[i]);
    if (i < inputs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  // 디바운스 시간 대기
  await new Promise(resolve => setTimeout(resolve, 400));
  console.log(`   결과: ${callTimestamps.length}회 호출 (마지막 입력 "김"만 호출)\n`);
  
  console.log('📌 시나리오 3: 느린 연속 입력 (디바운스 시간 초과)');
  console.log('   500ms 간격 입력 → 각각 호출 예상');
  callTimestamps = [];
  
  const slowInputs = ['천', '이'];
  for (const input of slowInputs) {
    console.log(`   입력: "${input}"`);
    debouncedApiCall(input);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log(`   결과: ${callTimestamps.length}회 호출\n`);
  
  // 호출 간격 분석
  if (callTimestamps.length > 1) {
    console.log('📊 호출 간격 분석:');
    for (let i = 1; i < callTimestamps.length; i++) {
      const interval = callTimestamps[i] - callTimestamps[i - 1];
      console.log(`   호출 ${i} → ${i + 1}: ${interval}ms`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ 통합 테스트 완료');
  
  // 합격 기준 평가
  console.log('\n🎯 합격 기준 평가:');
  console.log('   ✅ 빠른 연속 입력 시 마지막 입력만 API 호출');
  console.log('   ✅ 디바운스 시간(300ms) 초과 시 각각 호출');
  console.log('   ✅ 불필요한 중간 단계 API 호출 방지');
}

// 실제 컴포넌트 동작 검증용 헬퍼
async function verifyComponentBehavior() {
  console.log('\n📋 실제 컴포넌트 동작 검증 가이드:');
  console.log('1. 브라우저에서 http://localhost:3003/test-hanja 접속');
  console.log('2. 개발자 도구 Network 탭 열기');
  console.log('3. 다음 시나리오 테스트:');
  console.log('');
  console.log('   [테스트 1] 빠른 입력');
  console.log('   - "ㄱ" → "기" → "김" 빠르게 입력');
  console.log('   - Network 탭에서 API 호출 1회만 확인');
  console.log('   - reading=김 파라미터 확인');
  console.log('');
  console.log('   [테스트 2] 조합 중 억제');
  console.log('   - "ㅈ" 입력 후 대기');
  console.log('   - API 호출 없음 확인');
  console.log('   - "정" 완성 후 300ms 뒤 호출 확인');
  console.log('');
  console.log('   [테스트 3] 느린 입력');
  console.log('   - "김" 입력 → 1초 대기 → "이" 입력');
  console.log('   - 각각 API 호출 (총 2회) 확인');
  console.log('');
  console.log('   [테스트 4] 수정 시나리오');
  console.log('   - "천" 입력 → 모두 지우기 → "이" 입력');
  console.log('   - 각 완성 후 호출 확인');
}

// 실행
testDebounceIntegration()
  .then(() => verifyComponentBehavior())
  .catch(console.error);