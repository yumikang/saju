import { Socket } from 'socket.io';
import type { 
  NamingStartRequest, 
  NamingProgressEvent, 
  NamingCompleteEvent,
  NamingErrorEvent,
  NamingResult,
  SocketData 
} from '../types';
import { generateAINames } from '../../lib/ai-naming.server';
import { calculateSaju } from '../../lib/saju-calculator';
import { evaluateName } from '../../lib/naming-evaluator';
import { recommendHanjaForSaju, calculateBalance, coreHanjaDatabase } from '../../lib/hanja-unified';
import { prisma } from '../../lib/prisma.server';

// 진행 단계 정의
const NAMING_STEPS = [
  { id: 1, name: '사주 분석', weight: 20 },
  { id: 2, name: '오행 계산', weight: 15 },
  { id: 3, name: '용신 분석', weight: 15 },
  { id: 4, name: 'AI 이름 생성', weight: 25 },
  { id: 5, name: '이름 평가', weight: 15 },
  { id: 6, name: '최종 검증', weight: 10 }
];

// 활성 작명 세션 관리
const activeNamingSessions = new Map<string, {
  requestId: string;
  userId: string;
  startTime: Date;
  cancelled: boolean;
}>();

/**
 * 작명 시작 핸들러
 */
export async function handleNamingStart(
  socket: Socket,
  data: NamingStartRequest
): Promise<void> {
  const sessionKey = `${socket.data.userId}_${data.requestId}`;
  
  try {
    // 중복 요청 체크
    if (activeNamingSessions.has(sessionKey)) {
      socket.emit('naming:error', {
        requestId: data.requestId,
        timestamp: new Date().toISOString(),
        error: '이미 진행 중인 작명이 있습니다.',
        code: 'DUPLICATE_REQUEST'
      } as NamingErrorEvent);
      return;
    }

    // 세션 등록
    activeNamingSessions.set(sessionKey, {
      requestId: data.requestId,
      userId: socket.data.userId,
      startTime: new Date(),
      cancelled: false
    });

    // 시작 확인 전송
    socket.emit('naming:started', {
      requestId: data.requestId,
      timestamp: new Date().toISOString(),
      userId: socket.data.userId
    });

    let currentProgress = 0;
    const startTime = Date.now();

    // Step 1: 사주 분석
    await emitProgress(socket, data.requestId, 1, currentProgress, '사주 팔자를 분석하고 있습니다...');
    
    const sajuData = calculateSaju(
      new Date(data.birthDate + ' ' + data.birthTime),
      data.isLunar,
      data.gender
    );
    
    currentProgress += NAMING_STEPS[0].weight;
    
    // 취소 체크
    if (isSessionCancelled(sessionKey)) {
      cleanupSession(sessionKey);
      return;
    }

    // Step 2: 오행 계산
    await emitProgress(socket, data.requestId, 2, currentProgress, '오행 균형을 분석하고 있습니다...');
    
    const elementCounts = {
      wood: sajuData.woodCount || 0,
      fire: sajuData.fireCount || 0,
      earth: sajuData.earthCount || 0,
      metal: sajuData.metalCount || 0,
      water: sajuData.waterCount || 0
    };
    
    // 부족한 오행 찾기
    const lackingElements = Object.entries(elementCounts)
      .filter(([_, count]) => count < 2)
      .map(([element]) => element === 'wood' ? '목' : 
                         element === 'fire' ? '화' :
                         element === 'earth' ? '토' :
                         element === 'metal' ? '금' : '수');
    
    currentProgress += NAMING_STEPS[1].weight;

    // Step 3: 용신 분석
    await emitProgress(socket, data.requestId, 3, currentProgress, '용신과 기신을 파악하고 있습니다...');
    
    const yongsin = sajuData.primaryYongsin || lackingElements[0] || '목';
    
    // 한자 추천
    const recommendedHanja = recommendHanjaForSaju(
      lackingElements,
      yongsin,
      data.gender,
      data.preferences?.values || []
    );
    
    currentProgress += NAMING_STEPS[2].weight;

    // 취소 체크
    if (isSessionCancelled(sessionKey)) {
      cleanupSession(sessionKey);
      return;
    }

    // Step 4: AI 이름 생성
    await emitProgress(socket, data.requestId, 4, currentProgress, 'AI가 이름을 생성하고 있습니다...');
    
    let generatedNames: NamingResult[] = [];
    
    try {
      // AI 생성 시도
      const aiNames = await generateAINames({
        saju: sajuData,
        preferences: data.preferences,
        lastName: data.lastName,
        recommendedHanja: recommendedHanja.slice(0, 10).map(h => ({
          character: h.character,
          meaning: h.meaning,
          element: h.element
        }))
      });
      
      // AI 결과를 NamingResult 형식으로 변환
      generatedNames = aiNames.map(name => convertToNamingResult(name, data.lastName, elementCounts));
      
    } catch (aiError) {
      console.error('AI 이름 생성 실패, 규칙 기반으로 대체:', aiError);
      
      // 규칙 기반 이름 생성 (폴백)
      generatedNames = generateRuleBasedNames(
        data.lastName,
        recommendedHanja,
        data.gender,
        elementCounts
      );
    }
    
    currentProgress += NAMING_STEPS[3].weight;

    // Step 5: 이름 평가
    await emitProgress(socket, data.requestId, 5, currentProgress, '생성된 이름을 평가하고 있습니다...');
    
    // 각 이름 평가 및 점수 계산
    const evaluatedNames = await Promise.all(
      generatedNames.map(async (name) => {
        const evaluation = await evaluateName(
          name.fullName,
          sajuData,
          name.firstNameHanja || ''
        );
        
        return {
          ...name,
          scores: {
            balance: evaluation.balanceScore,
            sound: evaluation.soundScore,
            meaning: evaluation.meaningScore,
            overall: evaluation.overallScore
          }
        };
      })
    );
    
    // 점수 기준 정렬
    evaluatedNames.sort((a, b) => b.scores.overall - a.scores.overall);
    
    currentProgress += NAMING_STEPS[4].weight;

    // 취소 체크
    if (isSessionCancelled(sessionKey)) {
      cleanupSession(sessionKey);
      return;
    }

    // Step 6: 최종 검증
    await emitProgress(socket, data.requestId, 6, currentProgress, '최종 검증을 진행하고 있습니다...');
    
    // 상위 10개 이름 선택
    const finalNames = evaluatedNames.slice(0, 10);
    
    currentProgress = 100;

    // 처리 시간 계산
    const processingTime = Date.now() - startTime;

    // 완료 이벤트 전송
    socket.emit('naming:complete', {
      requestId: data.requestId,
      timestamp: new Date().toISOString(),
      userId: socket.data.userId,
      result: {
        names: finalNames,
        totalGenerated: evaluatedNames.length,
        processingTime
      }
    } as NamingCompleteEvent);

    // DB 저장 (비동기로 처리)
    saveNamingResults(socket.data.userId, data, sajuData, finalNames).catch(console.error);

    // 세션 정리
    cleanupSession(sessionKey);

  } catch (error) {
    console.error('작명 프로세스 에러:', error);
    
    socket.emit('naming:error', {
      requestId: data.requestId,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : '작명 중 오류가 발생했습니다.',
      code: 'NAMING_ERROR'
    } as NamingErrorEvent);
    
    cleanupSession(sessionKey);
  }
}

/**
 * 작명 취소 핸들러
 */
export function handleNamingCancel(
  socket: Socket,
  data: { requestId: string }
): void {
  const sessionKey = `${socket.data.userId}_${data.requestId}`;
  const session = activeNamingSessions.get(sessionKey);
  
  if (session) {
    session.cancelled = true;
    socket.emit('naming:cancelled', {
      requestId: data.requestId,
      timestamp: new Date().toISOString(),
      userId: socket.data.userId
    });
    cleanupSession(sessionKey);
  }
}

/**
 * 진행상황 이벤트 전송
 */
async function emitProgress(
  socket: Socket,
  requestId: string,
  step: number,
  progress: number,
  message: string
): Promise<void> {
  const stepInfo = NAMING_STEPS[step - 1];
  
  socket.emit('naming:progress', {
    requestId,
    timestamp: new Date().toISOString(),
    userId: socket.data.userId,
    step,
    totalSteps: NAMING_STEPS.length,
    name: stepInfo.name,
    progress: Math.min(progress + stepInfo.weight, 100),
    message,
    details: {
      currentProcess: stepInfo.name,
      estimatedTimeRemaining: Math.max(0, (NAMING_STEPS.length - step) * 2)
    }
  } as NamingProgressEvent);
  
  // 시뮬레이션을 위한 딜레이 (실제 환경에서는 제거)
  await new Promise(resolve => setTimeout(resolve, 1000));
}

/**
 * 규칙 기반 이름 생성 (AI 실패 시 폴백)
 */
function generateRuleBasedNames(
  lastName: string,
  recommendedHanja: any[],
  gender: 'M' | 'F',
  elementCounts: Record<string, number>
): NamingResult[] {
  const names: NamingResult[] = [];
  const maxNames = Math.min(10, recommendedHanja.length * 2);
  
  for (let i = 0; i < maxNames && recommendedHanja.length >= 2; i++) {
    const char1 = recommendedHanja[i % recommendedHanja.length];
    const char2 = recommendedHanja[(i + 1) % recommendedHanja.length];
    
    const firstName = char1.character + char2.character;
    const fullName = lastName + firstName;
    
    names.push({
      fullName,
      lastName,
      firstName,
      lastNameHanja: lastName,
      firstNameHanja: firstName,
      totalStrokes: char1.strokes + char2.strokes,
      scores: {
        balance: 70 + Math.random() * 20,
        sound: 70 + Math.random() * 20,
        meaning: 70 + Math.random() * 20,
        overall: 70 + Math.random() * 20
      },
      elements: elementCounts,
      explanation: `${char1.meaning}(${char1.element})과 ${char2.meaning}(${char2.element})의 조합으로 균형잡힌 이름입니다.`
    });
  }
  
  return names;
}

/**
 * AI 결과를 NamingResult 형식으로 변환
 */
function convertToNamingResult(
  aiName: any,
  lastName: string,
  elementCounts: Record<string, number>
): NamingResult {
  return {
    fullName: aiName.fullName || lastName + aiName.firstName,
    lastName,
    firstName: aiName.firstName,
    lastNameHanja: lastName,
    firstNameHanja: aiName.firstNameHanja || aiName.firstName,
    totalStrokes: aiName.totalStrokes || 0,
    scores: {
      balance: aiName.scores?.balance || 75,
      sound: aiName.scores?.sound || 75,
      meaning: aiName.scores?.meaning || 75,
      overall: aiName.scores?.overall || 75
    },
    elements: elementCounts,
    explanation: aiName.explanation
  };
}

/**
 * 세션 취소 여부 확인
 */
function isSessionCancelled(sessionKey: string): boolean {
  const session = activeNamingSessions.get(sessionKey);
  return session?.cancelled || false;
}

/**
 * 세션 정리
 */
function cleanupSession(sessionKey: string): void {
  activeNamingSessions.delete(sessionKey);
}

/**
 * 작명 결과 DB 저장
 */
async function saveNamingResults(
  userId: string,
  request: NamingStartRequest,
  sajuData: any,
  results: NamingResult[]
): Promise<void> {
  try {
    // 사용자 확인 또는 생성
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: `${userId}@temp.com`, // 임시 이메일
          name: '게스트'
        }
      });
    }
    
    // 사주 데이터 저장
    const savedSaju = await prisma.sajuData.create({
      data: {
        userId: user.id,
        name: request.lastName,
        birthDate: new Date(request.birthDate),
        birthTime: request.birthTime,
        isLunar: request.isLunar,
        gender: request.gender,
        yearGan: sajuData.yearGan || '',
        yearJi: sajuData.yearJi || '',
        monthGan: sajuData.monthGan || '',
        monthJi: sajuData.monthJi || '',
        dayGan: sajuData.dayGan || '',
        dayJi: sajuData.dayJi || '',
        hourGan: sajuData.hourGan || '',
        hourJi: sajuData.hourJi || '',
        woodCount: sajuData.woodCount || 0,
        fireCount: sajuData.fireCount || 0,
        earthCount: sajuData.earthCount || 0,
        metalCount: sajuData.metalCount || 0,
        waterCount: sajuData.waterCount || 0,
        primaryYongsin: sajuData.primaryYongsin,
        secondaryYongsin: sajuData.secondaryYongsin
      }
    });
    
    // 상위 3개 이름 결과 저장
    for (const result of results.slice(0, 3)) {
      await prisma.namingResult.create({
        data: {
          userId: user.id,
          sajuDataId: savedSaju.id,
          lastName: result.lastName,
          firstName: result.firstName,
          fullName: result.fullName,
          lastNameHanja: result.lastNameHanja,
          firstNameHanja: result.firstNameHanja,
          totalStrokes: result.totalStrokes,
          balanceScore: result.scores.balance,
          soundScore: result.scores.sound,
          meaningScore: result.scores.meaning,
          overallScore: result.scores.overall,
          generationMethod: 'ai_advanced',
          aiModel: 'gpt-4',
          preferredValues: request.preferences ? JSON.stringify(request.preferences.values) : null,
          notes: result.explanation
        }
      });
    }
    
  } catch (error) {
    console.error('DB 저장 실패:', error);
  }
}