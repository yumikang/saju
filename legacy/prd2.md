# React Remix 기반 사주 작명 플랫폼 구현

## 🚀 Remix로 모든 것을 처리하기

### 1. 프로젝트 구조

```
app/
├── routes/
│   ├── _index.tsx              # 랜딩 페이지
│   ├── naming.tsx              # 작명 레이아웃
│   ├── naming._index.tsx       # 작명 시작
│   ├── naming.saju.tsx         # 사주 입력
│   ├── naming.config.tsx       # 이름 설정
│   ├── naming.values.tsx       # 가치 선택
│   ├── naming.results.tsx      # 결과 목록
│   └── naming.analysis.$id.tsx # 상세 분석
├── lib/
│   ├── saju.server.ts          # 사주 계산 (서버)
│   ├── naming.server.ts        # 작명 알고리즘 (서버)
│   ├── db.server.ts            # DB 연결 (서버)
│   └── chinese-chars.ts        # 한자 데이터
├── components/
│   ├── SajuInput.tsx           # 사주 입력 폼
│   ├── NameCard.tsx            # 이름 카드
│   └── ElementChart.tsx        # 오행 차트
└── styles/
    └── app.css                 # Tailwind CSS
```

### 2. 사주 계산 로직 (TypeScript)

```typescript
// app/lib/saju.server.ts
// 서버 사이드에서만 실행되는 로직

interface SajuData {
  year: { gan: string; ji: string };
  month: { gan: string; ji: string };
  day: { gan: string; ji: string };
  hour: { gan: string; ji: string };
  elements: Record<string, number>;
  yongsin: { primary: string; secondary: string };
}

// 천간지지 상수
const CHEONGAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const JIJI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

const ELEMENT_MAP = {
  천간: {
    갑: '목', 을: '목', 병: '화', 정: '화', 무: '토',
    기: '토', 경: '금', 신: '금', 임: '수', 계: '수'
  },
  지지: {
    자: '수', 축: '토', 인: '목', 묘: '목', 진: '토', 사: '화',
    오: '화', 미: '토', 신: '금', 유: '금', 술: '토', 해: '수'
  }
};

export class SajuCalculator {
  // 음력 변환 (외부 API 활용)
  private async convertToLunar(date: Date): Promise<LunarDate> {
    // 옵션 1: 공공 API 활용
    const response = await fetch(
      `https://astro.kasi.re.kr/api/lunar?date=${date.toISOString()}`
    );
    return response.json();
    
    // 옵션 2: 직접 계산 (lunar-js 라이브러리)
    // import { Solar, Lunar } from 'lunar-javascript';
    // const solar = Solar.fromDate(date);
    // return solar.getLunar();
  }

  // 사주 계산
  async calculateSaju(birthDate: Date, gender: 'M' | 'F'): Promise<SajuData> {
    // 1. 음력 변환
    const lunar = await this.convertToLunar(birthDate);
    
    // 2. 년주 계산
    const yearPillar = this.calculateYearPillar(lunar.year, birthDate);
    
    // 3. 월주 계산 (절기 기준)
    const monthPillar = this.calculateMonthPillar(birthDate, yearPillar.gan);
    
    // 4. 일주 계산 (만세력)
    const dayPillar = this.calculateDayPillar(birthDate);
    
    // 5. 시주 계산
    const hourPillar = this.calculateHourPillar(birthDate.getHours(), dayPillar.gan);
    
    // 6. 오행 분석
    const elements = this.analyzeElements([
      yearPillar, monthPillar, dayPillar, hourPillar
    ]);
    
    // 7. 용신 추출
    const yongsin = this.findYongsin(elements, dayPillar.gan);
    
    return {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
      elements,
      yongsin
    };
  }

  // 일주 계산 (핵심 로직)
  private calculateDayPillar(date: Date): { gan: string; ji: string } {
    // 기준일: 1900년 1월 1일 = 갑진일
    const baseDate = new Date(1900, 0, 1);
    const daysDiff = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const ganIndex = daysDiff % 10;
    const jiIndex = (daysDiff + 4) % 12; // 진(辰)이 인덱스 4
    
    return {
      gan: CHEONGAN[ganIndex],
      ji: JIJI[jiIndex]
    };
  }

  // 오행 분석
  private analyzeElements(pillars: Array<{gan: string; ji: string}>): Record<string, number> {
    const elements = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    
    pillars.forEach(pillar => {
      const ganElement = ELEMENT_MAP.천간[pillar.gan];
      const jiElement = ELEMENT_MAP.지지[pillar.ji];
      
      elements[ganElement]++;
      elements[jiElement]++;
    });
    
    // 백분율로 변환
    const total = Object.values(elements).reduce((a, b) => a + b, 0);
    Object.keys(elements).forEach(key => {
      elements[key] = Math.round((elements[key] / total) * 100);
    });
    
    return elements;
  }
}
```

### 3. 한자 DB 관리 (Prisma)

```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model ChineseCharacter {
  id              String   @id @default(cuid())
  character       String   @unique
  unicode         String
  strokeCount     Int
  koreanSound     String
  koreanMeaning   String
  
  // 오행 정보
  primaryElement  String   // 목/화/토/금/수
  elementStrength Int      @default(50)
  
  // 작명 정보
  nameSuitability Int      @default(50)
  genderPreference String  @default("중성")
  
  // 의미 정보
  meaningCategory String?
  positiveMeaning String?
  
  // 통계
  usageCount      Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([primaryElement])
  @@index([nameSuitability])
  @@index([koreanSound])
}

model NameCombination {
  id            String   @id @default(cuid())
  surname       String
  firstName     String
  secondName    String?
  
  totalScore    Int
  elementHarmony Int
  soundHarmony  Int
  meaningScore  Int
  
  analysis      Json
  
  createdAt     DateTime @default(now())
  
  @@unique([surname, firstName, secondName])
}
```

### 4. 작명 Route 구현

```typescript
// app/routes/naming.results.tsx
import { json, LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/db.server";
import { SajuCalculator } from "~/lib/saju.server";
import { NameGenerator } from "~/lib/naming.server";

export async function loader({ request }: LoaderArgs) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  // 세션에서 사주 정보 가져오기
  const session = await getSession(request.headers.get("Cookie"));
  const sajuData = session.get("sajuData");
  
  if (!sajuData) {
    return redirect("/naming/saju");
  }
  
  // 작명 생성
  const generator = new NameGenerator();
  const recommendations = await generator.generateNames({
    saju: sajuData,
    surname: searchParams.get("surname") || "김",
    nameLength: Number(searchParams.get("length")) || 2,
    fixedChars: JSON.parse(searchParams.get("fixed") || "{}"),
    values: JSON.parse(searchParams.get("values") || "[]")
  });
  
  return json({ recommendations, sajuData });
}

export default function NamingResults() {
  const { recommendations, sajuData } = useLoaderData<typeof loader>();
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 사주 분석 요약 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">사주 분석 결과</h2>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(sajuData.elements).map(([element, percentage]) => (
            <div key={element} className="text-center">
              <div className="text-3xl mb-2">{getElementEmoji(element)}</div>
              <div className="font-medium">{element}</div>
              <div className="text-sm text-gray-600">{percentage}%</div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <p className="text-sm">
            <strong>보완 필요:</strong> {sajuData.yongsin.primary}, {sajuData.yongsin.secondary}
          </p>
        </div>
      </div>
      
      {/* 추천 이름 목록 */}
      <div className="space-y-4">
        {recommendations.map((name, index) => (
          <NameCard key={index} name={name} rank={index + 1} />
        ))}
      </div>
    </div>
  );
}
```

### 5. 작명 알고리즘 (서버 사이드)

```typescript
// app/lib/naming.server.ts
import { prisma } from "./db.server";

interface NameGenerationOptions {
  saju: SajuData;
  surname: string;
  nameLength: number;
  fixedChars: Record<number, string>;
  values: string[];
}

export class NameGenerator {
  async generateNames(options: NameGenerationOptions) {
    const { saju, surname, nameLength, fixedChars, values } = options;
    
    // 1. 용신에 맞는 한자 검색
    const candidates = await this.findCharactersByElement(
      saju.yongsin.primary,
      saju.yongsin.secondary
    );
    
    // 2. 조합 생성
    const combinations = this.createCombinations(
      candidates,
      nameLength,
      fixedChars
    );
    
    // 3. 평가 및 정렬
    const evaluated = await Promise.all(
      combinations.map(combo => this.evaluateName(combo, saju, values))
    );
    
    // 4. 상위 10개 반환
    return evaluated
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10);
  }
  
  private async findCharactersByElement(primary: string, secondary: string) {
    return prisma.chineseCharacter.findMany({
      where: {
        OR: [
          { primaryElement: primary },
          { primaryElement: secondary }
        ],
        nameSuitability: { gte: 70 }
      },
      orderBy: [
        { nameSuitability: 'desc' },
        { usageCount: 'desc' }
      ],
      take: 100
    });
  }
  
  private createCombinations(
    characters: ChineseCharacter[],
    length: number,
    fixed: Record<number, string>
  ) {
    // 조합 생성 로직
    const combinations: string[][] = [];
    
    if (length === 2) {
      // 2글자 이름
      for (const char1 of characters) {
        if (fixed[0] && fixed[0] !== char1.character) continue;
        
        for (const char2 of characters) {
          if (fixed[1] && fixed[1] !== char2.character) continue;
          if (char1.character === char2.character) continue;
          
          combinations.push([char1.character, char2.character]);
        }
      }
    }
    
    return combinations.slice(0, 100); // 최대 100개 조합
  }
  
  private async evaluateName(
    chars: string[],
    saju: SajuData,
    values: string[]
  ) {
    // 평가 로직
    const scores = {
      element: this.calculateElementScore(chars, saju),
      sound: this.calculateSoundScore(chars),
      meaning: await this.calculateMeaningScore(chars),
      numerology: this.calculateNumerologyScore(chars),
      value: this.calculateValueScore(chars, values)
    };
    
    const totalScore = 
      scores.element * 0.3 +
      scores.sound * 0.2 +
      scores.meaning * 0.2 +
      scores.numerology * 0.2 +
      scores.value * 0.1;
    
    return {
      name: chars.join(''),
      characters: chars,
      scores,
      totalScore: Math.round(totalScore)
    };
  }
}
```

### 6. 클라이언트 컴포넌트

```typescript
// app/components/SajuInput.tsx
import { Form } from "@remix-run/react";

export function SajuInput() {
  return (
    <Form method="post" className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          생년월일
        </label>
        <input
          type="date"
          name="birthDate"
          required
          className="w-full px-4 py-2 border rounded-lg"
          min="1900-01-01"
          max={new Date().toISOString().split('T')[0]}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          출생 시간
        </label>
        <select
          name="birthHour"
          className="w-full px-4 py-2 border rounded-lg"
        >
          <option value="">모름</option>
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>
              {i.toString().padStart(2, '0')}시
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          성별
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input type="radio" name="gender" value="M" required />
            <span className="ml-2">남성</span>
          </label>
          <label className="flex items-center">
            <input type="radio" name="gender" value="F" required />
            <span className="ml-2">여성</span>
          </label>
        </div>
      </div>
      
      <button
        type="submit"
        className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium"
      >
        사주 분석하기
      </button>
    </Form>
  );
}
```

### 7. 초기 한자 데이터 설정

```typescript
// scripts/seed-characters.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const INITIAL_CHARACTERS = [
  // 수(水) 오행
  { character: '潤', unicode: 'U+6F64', strokeCount: 15, koreanSound: '윤', 
    koreanMeaning: '윤택하다', primaryElement: '수', nameSuitability: 85 },
  { character: '澈', unicode: 'U+6F88', strokeCount: 15, koreanSound: '철',
    koreanMeaning: '맑다', primaryElement: '수', nameSuitability: 80 },
  
  // 목(木) 오행  
  { character: '榮', unicode: 'U+69AE', strokeCount: 14, koreanSound: '영',
    koreanMeaning: '영화롭다', primaryElement: '목', nameSuitability: 90 },
  
  // ... 더 많은 한자 데이터
];

async function seed() {
  for (const char of INITIAL_CHARACTERS) {
    await prisma.chineseCharacter.upsert({
      where: { character: char.character },
      update: char,
      create: char,
    });
  }
  
  console.log(`Seeded ${INITIAL_CHARACTERS.length} characters`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 8. 배포 설정

```javascript
// remix.config.js
module.exports = {
  serverBuildTarget: "vercel",
  server: process.env.NODE_ENV === "development" ? undefined : "./server.js",
  ignoredRouteFiles: ["**/.*"],
  serverDependenciesToBundle: [
    // 필요한 서버 사이드 라이브러리
  ],
};
```

## 🎯 핵심 포인트

1. **Remix의 서버 사이드 기능 활용**
   - `loader`와 `action`으로 모든 백엔드 로직 처리
   - Python 없이 TypeScript로 사주 계산

2. **데이터베이스**
   - Prisma ORM으로 타입 안정성 확보
   - PostgreSQL or Supabase 사용

3. **성능 최적화**
   - 서버 사이드 렌더링
   - 캐싱 전략 적용
   - 점진적 향상

4. **배포**
   - Vercel에 쉽게 배포
   - Edge Functions 활용 가능

