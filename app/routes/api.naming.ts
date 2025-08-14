import { json, type ActionFunctionArgs } from "@remix-run/node";
import { generateAINames, type NamingRequest, type SajuAnalysis } from "~/lib/ai-naming.server";
import { evaluateName } from "~/lib/naming-evaluator";
import { getNamingRepository, getSajuRepository } from "~/lib/db.server";
import { getSession } from "~/lib/supabase.server";
import { coreHanjaDatabase } from "~/lib/hanja-unified";

// API 엔드포인트: POST /api/naming
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // 인증 확인 (선택적)
    const session = await getSession(request);
    const userId = session?.user?.id || "anonymous";

    // 요청 데이터 파싱
    const body = await request.json();
    const { sajuDataId, lastName, gender, preferences } = body;

    if (!sajuDataId || !lastName || !gender) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    // 사주 데이터 조회
    const sajuRepository = getSajuRepository();
    const sajuData = await sajuRepository.findById(sajuDataId);

    if (!sajuData) {
      return json({ error: "Saju data not found" }, { status: 404 });
    }

    // 사주 분석 데이터 준비
    const sajuAnalysis: SajuAnalysis = {
      yearGan: sajuData.yearGan,
      yearJi: sajuData.yearJi,
      monthGan: sajuData.monthGan,
      monthJi: sajuData.monthJi,
      dayGan: sajuData.dayGan,
      dayJi: sajuData.dayJi,
      hourGan: sajuData.hourGan,
      hourJi: sajuData.hourJi,
      elements: {
        wood: sajuData.woodCount,
        fire: sajuData.fireCount,
        earth: sajuData.earthCount,
        metal: sajuData.metalCount,
        water: sajuData.waterCount,
      },
      yongsin: sajuData.primaryYongsin || "토",
      gisin: sajuData.secondaryYongsin || undefined,
      lackingElements: [],
      excessElements: [],
    };

    // 부족/과다 오행 계산
    const elementThreshold = 2;
    Object.entries(sajuAnalysis.elements).forEach(([element, count]) => {
      if (count === 0) {
        sajuAnalysis.lackingElements.push(element === "wood" ? "목" : 
                                          element === "fire" ? "화" :
                                          element === "earth" ? "토" :
                                          element === "metal" ? "금" : "수");
      } else if (count > elementThreshold * 2) {
        sajuAnalysis.excessElements.push(element === "wood" ? "목" : 
                                         element === "fire" ? "화" :
                                         element === "earth" ? "토" :
                                         element === "metal" ? "금" : "수");
      }
    });

    // AI 작명 요청 준비
    const namingRequest: NamingRequest = {
      sajuAnalysis,
      lastName,
      gender: gender as 'M' | 'F',
      parentPreferences: {
        values: preferences?.values || ["지혜", "건강", "성공"],
        avoidCharacters: preferences?.avoidCharacters,
        preferredStyle: preferences?.style || "balanced",
      },
    };

    // AI 작명 생성
    const startTime = Date.now();
    const generatedNames = await generateAINames(namingRequest);
    const generationTime = Date.now() - startTime;

    // 생성 시간 체크 (5초 이내)
    if (generationTime > 5000) {
      console.warn(`Name generation took ${generationTime}ms, exceeding 5s target`);
    }

    // 작명 결과 평가 및 저장
    const namingRepository = getNamingRepository();
    const evaluatedNames = [];

    for (const name of generatedNames.slice(0, 5)) { // 상위 5개만 저장
      // 한자 정보 조회 (실제로는 DB에서)
      const hanjaList = name.firstNameHanja?.split('').map(char => 
        coreHanjaDatabase.find(h => h.character === char)
      ).filter(Boolean) || [];

      // 상세 평가
      const evaluation = evaluateName(
        lastName,
        name.firstName,
        lastName, // 한자 성씨
        name.firstNameHanja || '',
        hanjaList as any,
        sajuAnalysis.lackingElements
      );

      // DB에 저장
      const savedName = await namingRepository.create({
        user: { connect: { id: userId } },
        sajuData: { connect: { id: sajuDataId } },
        lastName: name.lastName,
        firstName: name.firstName,
        fullName: name.fullName,
        lastNameHanja: lastName,
        firstNameHanja: name.firstNameHanja,
        totalStrokes: name.totalStrokes,
        balanceScore: evaluation.elementBalance.balanceScore,
        soundScore: evaluation.soundEvaluation.score,
        meaningScore: evaluation.meaningEvaluation.score,
        overallScore: evaluation.overall.totalScore,
        generationMethod: 'ai_advanced',
        aiModel: 'gpt-4-turbo',
        aiPrompt: JSON.stringify(namingRequest),
        preferredValues: preferences,
        notes: `${evaluation.overall.advice}\n\n${name.notes}`,
      });

      evaluatedNames.push({
        ...savedName,
        evaluation,
      });
    }

    // 응답
    return json({
      success: true,
      names: evaluatedNames,
      generationTime,
      message: `${evaluatedNames.length}개의 이름이 생성되었습니다.`,
    });

  } catch (error) {
    console.error("AI naming error:", error);
    return json(
      { error: "Failed to generate names", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}