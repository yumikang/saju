#!/usr/bin/env npx tsx
// IME 디바운스 테스트
// 한글 조합 중 API 호출 억제 및 디바운스 동작 검증

// Puppeteer는 설치된 경우에만 import
let puppeteer: any;
try {
  puppeteer = require('puppeteer');
} catch {
  // Puppeteer 없이 계속 진행
}

interface TestScenario {
  name: string;
  inputSequence: string[];
  delays: number[];  // 각 입력 사이의 지연 시간 (ms)
  expectedCalls: number;  // 예상 API 호출 횟수
  description: string;
}

// 테스트 시나리오 정의
const TEST_SCENARIOS: TestScenario[] = [
  {
    name: '단일 문자 입력',
    inputSequence: ['김'],
    delays: [],
    expectedCalls: 1,
    description: '단일 완성 문자 입력 후 300ms → 1회 호출'
  },
  {
    name: '빠른 연속 입력 (디바운스)',
    inputSequence: ['ㄱ', '기', '김'],
    delays: [50, 50],  // 50ms 간격으로 빠르게 입력
    expectedCalls: 1,
    description: '조합 과정 포함 빠른 입력 → 마지막 입력 후 300ms에 1회만 호출'
  },
  {
    name: '느린 연속 입력',
    inputSequence: ['김', '이'],
    delays: [500],  // 500ms 간격 (디바운스 시간보다 길게)
    expectedCalls: 2,
    description: '디바운스 시간보다 긴 간격 → 각각 호출 (2회)'
  },
  {
    name: '조합 중 입력',
    inputSequence: ['ㅇ', '이'],
    delays: [100],
    expectedCalls: 1,
    description: '조합 시작(ㅇ) → 완성(이) → 완성 후에만 1회 호출'
  },
  {
    name: '복잡한 조합 시나리오',
    inputSequence: ['ㅈ', '저', '정', '', 'ㅊ', '처', '천'],
    delays: [50, 50, 200, 50, 50, 50],
    expectedCalls: 2,
    description: '정 입력 → 지우기 → 천 입력 → 2회 호출 예상'
  }
];

async function simulateTyping(
  page: any,
  selector: string,
  sequence: string[],
  delays: number[]
): Promise<void> {
  // 입력 필드 포커스
  await page.focus(selector);
  
  // 기존 텍스트 모두 선택 후 삭제
  await page.evaluate((sel) => {
    const input = document.querySelector(sel) as HTMLInputElement;
    if (input) {
      input.select();
    }
  }, selector);
  await page.keyboard.press('Backspace');
  
  // 시퀀스 입력
  for (let i = 0; i < sequence.length; i++) {
    const text = sequence[i];
    
    if (text === '') {
      // 모두 지우기
      await page.evaluate((sel) => {
        const input = document.querySelector(sel) as HTMLInputElement;
        if (input) {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, selector);
    } else {
      // 텍스트 입력 (한글 조합 시뮬레이션)
      await page.type(selector, text, { delay: 10 });
    }
    
    // 다음 입력까지 대기
    if (i < delays.length) {
      await page.waitForTimeout(delays[i]);
    }
  }
}

async function runDebounceTest() {
  console.log('🔍 IME 디바운스 테스트\n');
  console.log('=' .repeat(80));
  
  const browser = await puppeteer.launch({
    headless: false,  // 테스트 과정을 볼 수 있도록
    devtools: true    // 네트워크 탭 확인 가능
  });
  
  try {
    const page = await browser.newPage();
    
    // API 호출 인터셉트 설정
    let apiCallCount = 0;
    const apiCalls: { timestamp: number; url: string }[] = [];
    
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/hanja/search')) {
        apiCallCount++;
        apiCalls.push({
          timestamp: Date.now(),
          url
        });
        console.log(`  [API Call #${apiCallCount}] ${new URL(url).searchParams.get('reading')}`);
      }
      request.continue();
    });
    
    // 테스트 페이지로 이동
    await page.goto('http://localhost:3003/test-hanja', {
      waitUntil: 'networkidle2'
    });
    
    // 각 시나리오 실행
    for (const scenario of TEST_SCENARIOS) {
      console.log(`\n📌 ${scenario.name}`);
      console.log(`   ${scenario.description}`);
      
      // API 호출 카운터 리셋
      apiCallCount = 0;
      apiCalls.length = 0;
      
      // 전역 카운터 설정 (선택적)
      await page.evaluate(() => {
        (window as any).__hanjaApiCallCount = 0;
      });
      
      // 입력 시뮬레이션
      const inputSelector = 'input[type="text"]';
      await simulateTyping(page, inputSelector, scenario.inputSequence, scenario.delays);
      
      // 디바운스 대기 (마지막 입력 후 400ms 대기)
      await page.waitForTimeout(400);
      
      // 결과 확인
      const passed = apiCallCount === scenario.expectedCalls;
      const icon = passed ? '✅' : '❌';
      
      console.log(`   ${icon} API 호출: ${apiCallCount}회 (예상: ${scenario.expectedCalls}회)`);
      
      if (!passed && apiCalls.length > 0) {
        // 호출 타이밍 분석
        console.log('   호출 타이밍:');
        const firstCall = apiCalls[0].timestamp;
        apiCalls.forEach((call, i) => {
          const relativeTime = call.timestamp - firstCall;
          const reading = new URL(call.url).searchParams.get('reading');
          console.log(`     ${i + 1}. +${relativeTime}ms: "${reading}"`);
        });
      }
      
      // 다음 테스트 전 대기
      await page.waitForTimeout(500);
    }
    
    // 추가 수동 테스트 안내
    console.log('\n📋 수동 테스트 안내:');
    console.log('1. 브라우저에서 직접 한글 입력 테스트');
    console.log('2. 개발자 도구 Network 탭에서 API 호출 확인');
    console.log('3. 다음 시나리오 테스트:');
    console.log('   - "ㄱ" → "기" → "김" 빠르게 입력 → 1회만 호출되어야 함');
    console.log('   - "김" 입력 → 500ms 대기 → "이" 입력 → 2회 호출되어야 함');
    console.log('   - 조합 중(ㅇ, ㅈ 등)에는 호출되지 않아야 함');
    
    console.log('\n브라우저를 닫으려면 Enter 키를 누르세요...');
    await new Promise(resolve => process.stdin.once('data', resolve));
    
  } catch (error) {
    console.error('테스트 중 오류:', error);
  } finally {
    await browser.close();
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ 디바운스 테스트 완료');
}

// Puppeteer 없이 간단한 시뮬레이션 테스트
async function runSimpleDebounceTest() {
  console.log('🔍 IME 디바운스 시뮬레이션 테스트\n');
  console.log('=' .repeat(80));
  
  // 디바운스 함수 시뮬레이션
  class DebounceSimulator {
    private timeoutId: NodeJS.Timeout | null = null;
    private callCount = 0;
    
    constructor(private delay: number) {}
    
    call(value: string): void {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      
      this.timeoutId = setTimeout(() => {
        this.callCount++;
        console.log(`  [API Call #${this.callCount}] reading="${value}"`);
      }, this.delay);
    }
    
    getCallCount(): number {
      return this.callCount;
    }
    
    reset(): void {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      this.callCount = 0;
    }
    
    async wait(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }
  
  const debouncer = new DebounceSimulator(300);
  
  // 시나리오 1: 빠른 연속 입력
  console.log('\n📌 시나리오 1: 빠른 연속 입력');
  debouncer.reset();
  debouncer.call('ㄱ');
  await debouncer.wait(50);
  debouncer.call('기');
  await debouncer.wait(50);
  debouncer.call('김');
  await debouncer.wait(400);  // 디바운스 시간 대기
  console.log(`  결과: ${debouncer.getCallCount()}회 호출 (예상: 1회)`);
  
  // 시나리오 2: 느린 연속 입력
  console.log('\n📌 시나리오 2: 느린 연속 입력');
  debouncer.reset();
  debouncer.call('김');
  await debouncer.wait(400);  // 디바운스 시간보다 길게
  debouncer.call('이');
  await debouncer.wait(400);
  console.log(`  결과: ${debouncer.getCallCount()}회 호출 (예상: 2회)`);
  
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ 시뮬레이션 테스트 완료');
}

// 실행
if (process.argv.includes('--simple')) {
  runSimpleDebounceTest().catch(console.error);
} else {
  // Puppeteer 체크
  try {
    require.resolve('puppeteer');
    runDebounceTest().catch(console.error);
  } catch {
    console.log('⚠️  Puppeteer가 설치되지 않았습니다.');
    console.log('   npm install --save-dev puppeteer 실행 후 다시 시도하거나');
    console.log('   npx tsx scripts/qa/test-debounce.ts --simple 로 간단한 테스트 실행\n');
    runSimpleDebounceTest().catch(console.error);
  }
}