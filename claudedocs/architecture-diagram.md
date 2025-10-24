# SajuName AI - System Architecture Diagram

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Remix)                        │
│  - User Input Form                                          │
│  - Real-time Progress Display                               │
│  - Name Results Cards                                       │
│  - Detailed Analysis View                                   │
└────────────┬────────────────────────────────────────────────┘
             │ HTTP/WebSocket
             ▼
┌─────────────────────────────────────────────────────────────┐
│                 API LAYER (Remix Routes)                    │
│  POST /api/naming/generate                                  │
│  GET  /api/naming/detail/:id                                │
│  POST /api/saju/calculate                                   │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│              NAMING PIPELINE (Orchestrator)                 │
│                                                             │
│  Input: {name, birthDate, birthTime, gender, ...}          │
│     │                                                       │
│     ├─► Step 1: Calculate Saju                             │
│     ├─► Step 2: Analyze Yongsin (AI)                       │
│     ├─► Step 3: Match Phonetics                            │
│     ├─► Step 4: Select Hanja                               │
│     ├─► Step 5: Generate Combinations                      │
│     ├─► Step 6: Validate (YinYang)                         │
│     ├─► Step 7: Score Names                                │
│     └─► Step 8: Rank & Return Top 5-6                      │
│                                                             │
│  Output: [{name, score, analysis}, ...]                    │
└────┬────────────────────────────────────────┬──────────────┘
     │                                        │
     ▼                                        ▼
┌──────────────────────┐          ┌──────────────────────┐
│   CORE SERVICES      │          │   AI SERVICES        │
│                      │          │                      │
│ • SajuCalculator     │          │ • ClaudeService      │
│ • YongsinAnalyzer    │          │ • YongsinAnalyzer    │
│ • PhoneticMatcher    │          │ • MeaningMatcher     │
│ • HanjaSelector      │          │ • SemanticScorer     │
│ • CombinationGen     │          │                      │
│ • YinYangValidator   │          │ Fallback: GPT-4      │
│ • NumerologyCalc     │          │ Fallback: Rule-based │
│ • ScoringPipeline    │          │                      │
└──────┬───────────────┘          └──────┬───────────────┘
       │                                 │
       │                                 │
       ▼                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATA LAYER (Prisma ORM)                    │
└────┬────────────────────────────────────┬───────────────────┘
     │                                    │
     ▼                                    ▼
┌──────────────────────┐          ┌──────────────────────┐
│  PostgreSQL Database │          │   Redis Cache        │
│                      │          │                      │
│ • calendar_data      │          │ • saju:{hash}        │
│   96,429 records     │          │ • yongsin:{hash}     │
│   1841-2110          │          │ • hanja:{query}      │
│                      │          │ • naming:{input}     │
│ • hanja_dict         │          │                      │
│   8,787 characters   │          │ TTL: 24h/7d/1h       │
│                      │          │                      │
│ • users              │          └──────────────────────┘
│ • saju_data          │
│ • naming_results     │
│ • naming_payments    │
└──────────────────────┘
```

---

## 🔄 Naming Pipeline Detailed Flow

```
┌──────────────────────────────────────────────────────────────┐
│ INPUT: NamingRequest                                         │
│   - originalName: "John Smith"                               │
│   - birthDate: "1990-05-15"                                  │
│   - birthTime: "14:30"                                       │
│   - gender: "M"                                              │
│   - preferredSurname: "김" (optional)                        │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 1: Calculate Four Pillars (Saju)                       │
│                                                              │
│  CalendarDataService.getSajuByDate("1990-05-15")            │
│         │                                                    │
│         ├─► Query CalendarData table                        │
│         │   WHERE solarYear=1990, solarMonth=5, solarDay=15 │
│         │                                                    │
│         └─► Returns:                                         │
│             yearGanji: "庚午" (경오)                         │
│             monthGanji: "辛巳" (신사)                        │
│             dayGanji: "癸巳" (계사)                          │
│             hourGanji: "己未" (기미) [calculated from time] │
│                                                              │
│  SajuCalculator.calculate(birthDate, birthTime)             │
│         │                                                    │
│         └─► Returns:                                         │
│             pillars: {year, month, day, hour}                │
│             dayMaster: {stem: "癸", element: WATER}          │
│             elementCounts: {                                 │
│               WOOD: 2, FIRE: 3, EARTH: 1,                    │
│               METAL: 1, WATER: 1                             │
│             }                                                │
│             lackingElements: [WATER, METAL]                  │
│                                                              │
│  ⏱️  Time: ~100ms                                            │
│  💾 Cache: saju:1990-05-15-14:30 (24h TTL)                  │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 2: Analyze Yongsin (용신) - AI-Powered                 │
│                                                              │
│  YongsinAnalyzer.analyze5Methods(fourPillars)                │
│         │                                                    │
│         ├─► Prompt to Claude Sonnet 4:                      │
│         │   "당신은 40년 경력의 명리학 전문가입니다..."      │
│         │   "사주: 庚午 辛巳 癸巳 己未"                       │
│         │   "5가지 용신법으로 분석하세요..."                 │
│         │                                                    │
│         ├─► AI analyzes 5 methods:                          │
│         │   1. 조후용신법 (seasonal harmony)                │
│         │   2. 억부용신법 (strength balancing)              │
│         │   3. 병약용신법 (weakness curing)                 │
│         │   4. 전왕용신법 (dominance utilization)           │
│         │   5. 통관용신법 (conflict mediation)              │
│         │                                                    │
│         └─► Returns JSON:                                    │
│             {                                                │
│               method: "조후",                                │
│               yongsin: WATER,   // primary                   │
│               heesin: [METAL],  // supportive                │
│               gisin: [FIRE, EARTH], // harmful               │
│               confidence: 85,                                │
│               reasoning: "여름생이라 水가 필요..."           │
│             }                                                │
│                                                              │
│  ⏱️  Time: ~3 seconds (AI call)                             │
│  💾 Cache: yongsin:{saju_hash} (24h TTL)                    │
│  🔄 Fallback: GPT-4 → Rule-based                            │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 3: Phonetic Matching (발음 매칭)                        │
│                                                              │
│  PhoneticMatcher.matchForeignName("John")                    │
│         │                                                    │
│         ├─► IPA Converter:                                   │
│         │   "John" → /dʒɑn/                                  │
│         │                                                    │
│         ├─► Korean Syllable Mapping:                         │
│         │   /dʒ/ → [ㅈ, ㅊ]                                  │
│         │   /ɑ/  → [ㅏ, ㅗ]                                  │
│         │   /n/  → [ㄴ]                                      │
│         │                                                    │
│         ├─► Generate combinations:                           │
│         │   ㅈ+ㅏ+ㄴ = 잔 (88% similarity)                    │
│         │   ㅈ+ㅗ+ㄴ = 존 (85% similarity)                    │
│         │   ㅊ+ㅏ+ㄴ = 찬 (82% similarity)                    │
│         │   ㅈ+ㅜ+ㄴ = 준 (92% similarity) ⭐               │
│         │                                                    │
│         └─► Returns:                                         │
│             [                                                │
│               {syllable: "준", ipa: /dʒun/, score: 92},     │
│               {syllable: "존", ipa: /dʒon/, score: 85},     │
│               {syllable: "진", ipa: /dʒin/, score: 83}      │
│             ]                                                │
│                                                              │
│  ⏱️  Time: ~200ms                                            │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 4: Hanja Selection (한자 선별)                          │
│                                                              │
│  HanjaSelector.selectByElementAndPronunciation()             │
│         │                                                    │
│         ├─► Query HanjaDict:                                 │
│         │   WHERE korean_reading IN ('준', '존', '진')      │
│         │   AND element IN (WATER, METAL)  // yongsin+heesin│
│         │   AND is_good_for_naming = true                   │
│         │   AND gender IN ('M', 'neutral')                  │
│         │   ORDER BY name_frequency DESC                    │
│         │   LIMIT 20                                        │
│         │                                                    │
│         ├─► Results:                                         │
│         │   俊 (jun) - WATER, strokes: 9, meaning: talented │
│         │   濬 (jun) - WATER, strokes: 17, meaning: deep    │
│         │   峻 (jun) - EARTH, strokes: 10, meaning: steep   │
│         │   ... (17 more)                                   │
│         │                                                    │
│         ├─► AI Semantic Matching (Claude):                   │
│         │   Prompt: "Match Korean hanja to 'John' meaning"  │
│         │   Original: John = "God's grace" (신의 은총)       │
│         │   俊 (talented) → 90% semantic match ⭐           │
│         │   濬 (deep) → 65% semantic match                  │
│         │                                                    │
│         └─► Top Hanja Selected:                              │
│             First char: [俊, 濬, 峻]                         │
│             Second char: [宇, 佑, 雨] (universe, help, rain) │
│                                                              │
│  ⏱️  Time: ~500ms (DB) + ~2s (AI semantic)                  │
│  💾 Cache: hanja:WATER:준 (7 days TTL)                      │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 5: Generate Combinations (조합 생성)                    │
│                                                              │
│  CombinationGenerator.generate()                             │
│         │                                                    │
│         ├─► Get surname candidates:                          │
│         │   - User preferred: 김 (if specified)             │
│         │   - Phonetic match: 전, 조 (J sound)              │
│         │   - Popular: 이, 박                               │
│         │   Total: [김, 전, 조]                              │
│         │                                                    │
│         ├─► Cross-product:                                   │
│         │   Surnames(3) × FirstChar(3) × SecondChar(3)       │
│         │   = 27 combinations                               │
│         │                                                    │
│         ├─► Apply filters:                                   │
│         │   • Remove forbidden characters                   │
│         │   • Check phonetic harmony                        │
│         │   • Verify element compatibility                  │
│         │   Remaining: ~15 combinations                     │
│         │                                                    │
│         └─► Example combinations:                            │
│             김준우 (金俊宇) ⭐                                │
│             김준호 (金俊浩)                                  │
│             전준서 (全俊瑞)                                  │
│             조준영 (趙俊榮)                                  │
│             ... (11 more)                                   │
│                                                              │
│  ⏱️  Time: ~300ms                                            │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 6: YinYang Validation (음양 균형 검증)                  │
│                                                              │
│  YinYangValidator.validateAll(combinations)                  │
│         │                                                    │
│         ├─► For each name:                                   │
│         │   김준우 (金俊宇)                                   │
│         │   │                                                │
│         │   ├─► Get stroke counts:                          │
│         │   │   金: 8획 → Even → Yin (음)                   │
│         │   │   俊: 9획 → Odd  → Yang (양)                  │
│         │   │   宇: 6획 → Even → Yin (음)                   │
│         │   │                                                │
│         │   ├─► Check balance:                              │
│         │   │   Yin: 2, Yang: 1                             │
│         │   │   Ratio: 2:1 ✅ PERFECT BALANCE               │
│         │   │                                                │
│         │   └─► Score:                                       │
│         │       balanceScore: 95/100 ⭐                      │
│         │       pattern: "음-양-음"                          │
│         │       isBalanced: true                            │
│         │                                                    │
│         └─► Filter out poor balance:                         │
│             Keep only score > 60                             │
│             Remaining: ~12 combinations                      │
│                                                              │
│  ⏱️  Time: ~50ms                                             │
│  📄 Reference: 71% accuracy paper                            │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 7: Comprehensive Scoring (종합 점수 계산)                │
│                                                              │
│  ScoringPipeline.scoreAll(combinations)                      │
│         │                                                    │
│         ├─► For each name, calculate:                        │
│         │                                                    │
│         │   1. Element Compatibility (35%) ⭐ MOST IMPORTANT│
│         │      YongsinScorer.score(name.hanja, yongsin)     │
│         │      • 俊 is WATER (matches yongsin) → 34/35      │
│         │      • 宇 is EARTH (neutral) → 30/35              │
│         │      Average: 32/35 = 91%                         │
│         │                                                    │
│         │   2. YinYang Balance (25%)                        │
│         │      From Step 6: 95/100 → 24/25                  │
│         │                                                    │
│         │   3. Phonetic Similarity (20%)                    │
│         │      PhoneticScorer.score("준우", "John")         │
│         │      준 matches 92%, 우 is secondary               │
│         │      Average: 88% → 18/20                         │
│         │                                                    │
│         │   4. Semantic Meaning (10%)                       │
│         │      MeaningScorer.score(hanja, preferences)      │
│         │      俊 (talented) matches "excellence"           │
│         │      Score: 90% → 9/10                            │
│         │                                                    │
│         │   5. 81 Numerology (5%)                           │
│         │      NumerologyScorer.calculate4Grids()           │
│         │      원격: 8획 → 길수                              │
│         │      형격: 17획 → 길수                             │
│         │      이격: 15획 → 길수                             │
│         │      정격: 23획 → 대길수 ⭐                        │
│         │      Average: 85% → 4.25/5                        │
│         │                                                    │
│         │   6. Forbidden Check (5%)                         │
│         │      ForbiddenScorer.check(hanja)                 │
│         │      No forbidden chars → 5/5 ✅                  │
│         │                                                    │
│         └─► Total Score:                                     │
│             (32 + 24 + 18 + 9 + 4.25 + 5) = 92.25/100 ⭐    │
│             Grade: S (90-100)                                │
│             Confidence: 85% (from Yongsin)                   │
│             NeedsExpertReview: false                         │
│                                                              │
│  ⏱️  Time: ~200ms                                            │
└────────┬─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 8: Rank & Return Results (순위 정렬 및 결과 반환)        │
│                                                              │
│  Ranking.sortAndFilter(scoredNames)                          │
│         │                                                    │
│         ├─► Sort by totalScore DESC                          │
│         ├─► Take top 5-6                                     │
│         ├─► Enrich with explanations                         │
│         │                                                    │
│         └─► Final Output:                                    │
│                                                              │
│  [                                                           │
│    {                                                         │
│      rank: 1,                                                │
│      korean: "김준우",                                       │
│      hanja: "金俊宇",                                        │
│      romanization: "Kim Jun-woo",                            │
│      totalScore: 92.25,                                      │
│      grade: "S",                                             │
│      breakdown: {                                            │
│        yongsinCompatibility: 91,                             │
│        yinYangBalance: 95,                                   │
│        phoneticSimilarity: 88,                               │
│        semanticMeaning: 90,                                  │
│        numerology81: 85,                                     │
│        forbiddenCheck: 100                                   │
│      },                                                      │
│      analysis: {                                             │
│        yongsin: "이 이름은 당신의 사주에 필요한 水 기운...",  │
│        yinyang: "음-양-음의 완벽한 조화를 이룹니다",         │
│        meaning: "俊(뛰어남) + 宇(우주) = 우주처럼 넓은...",   │
│        pronunciation: "John과 92% 발음 유사성"               │
│      },                                                      │
│      confidence: 85,                                         │
│      needsExpertReview: false                                │
│    },                                                        │
│    {                                                         │
│      rank: 2,                                                │
│      korean: "김준호",                                       │
│      totalScore: 89.5,                                       │
│      ...                                                     │
│    },                                                        │
│    ... (3-4 more names)                                     │
│  ]                                                           │
│                                                              │
│  ⏱️  Total Pipeline Time: ~7 seconds ✅                     │
│  💾 Save to database: naming_results table                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Service Architecture Breakdown

### Layer 1: Foundation Services (No Dependencies)
```
CalendarDataService
├─ getSajuByDate(date) → CalendarData
├─ convertLunarToSolar(lunar) → solar Date
└─ getSolarTerm(date) → string

ClaudeAPIService
├─ call(prompt, options) → JSON
├─ retry logic (3 attempts)
└─ error handling

IPAConverter
├─ textToIPA(text, lang) → IPA string
└─ ipaToKorean(ipa) → Syllable[]
```

### Layer 2: Core Calculation Services
```
SajuCalculator (depends: CalendarDataService)
├─ calculate(birthDate, birthTime, isLunar)
├─ getYearPillar() → {stem, branch}
├─ getMonthPillar() → {stem, branch}
├─ getDayPillar() → {stem, branch}
├─ getHourPillar() → {stem, branch}
└─ countElements() → Record<Element, number>

YongsinAnalyzer (depends: ClaudeAPI, SajuCalculator)
├─ analyze5Methods(fourPillars)
├─ Method 1: 조후용신법
├─ Method 2: 억부용신법
├─ Method 3: 병약용신법
├─ Method 4: 전왕용신법
├─ Method 5: 통관용신법
└─ Returns: {yongsin, heesin, gisin, confidence}

PhoneticMatcher (depends: IPAConverter)
├─ matchForeignName(name) → KoreanSyllable[]
└─ scorePhoneticSimilarity(orig, korean) → number
```

### Layer 3: Business Logic Services
```
HanjaSelector (depends: YongsinAnalyzer, ClaudeAPI)
├─ selectByElement(element, count)
├─ selectByMeaning(keywords, originalMeaning)
├─ selectByPronunciation(syllable)
├─ filterByGender(list, gender)
└─ rankByPopularity(list)

YinYangValidator
├─ getStrokeCount(hanja) → number
├─ checkYinYang(stroke) → 'yin'|'yang'
└─ validateBalance(name) → {score, isBalanced}

Numerology81Calculator
├─ calculate4Grids(name) → {원격,형격,이격,정격}
├─ checkFortune(strokes) → '길'|'흉'|'평'
└─ score(grids) → average
```

### Layer 4: Orchestration Services
```
CombinationGenerator (depends: HanjaSelector, PhoneticMatcher)
├─ generateCombinations(input)
├─ getSurnameCandidates()
├─ getGivenNameCandidates()
└─ applyFilters()

ScoringPipeline (depends: All scorers)
├─ scoreAll(combinations)
├─ ElementScorer (35%)
├─ YinYangScorer (25%)
├─ PhoneticScorer (20%)
├─ MeaningScorer (10%)
├─ NumerologyScorer (5%)
└─ ForbiddenScorer (5%)

NamingPipeline (depends: All above)
├─ execute(input) → NamingResult[]
├─ Error handling per step
├─ Caching strategy
└─ Performance monitoring
```

---

## 📦 File Structure

```
/app
├── /lib
│   ├── /calendar
│   │   └── calendar-data.service.ts  ⬜ TO BUILD (Day 5)
│   │
│   ├── /saju
│   │   ├── calculator.ts  ✅ EXISTS (needs enhancement)
│   │   └── yongsin-analyzer.ts  ⬜ TO BUILD (Day 5)
│   │
│   ├── /ai
│   │   ├── claude-client.ts  ⬜ TO BUILD (Day 5)
│   │   └── openai-client.ts  ✅ EXISTS
│   │
│   ├── /phonetics
│   │   ├── ipa-converter.ts  ⬜ TO BUILD (Day 6)
│   │   └── phonetic-matcher.ts  ⬜ TO BUILD (Day 6)
│   │
│   ├── /naming
│   │   ├── naming-pipeline.ts  ⬜ TO BUILD (Day 7)
│   │   ├── hanja-selector.ts  ⬜ TO BUILD (Week 2)
│   │   ├── combination-generator.ts  ⬜ TO BUILD (Week 2)
│   │   │
│   │   ├── /validators
│   │   │   ├── yinyang-validator.ts  ⬜ TO BUILD (Day 6)
│   │   │   └── forbidden-validator.ts  ✅ EXISTS
│   │   │
│   │   ├── /scorers
│   │   │   ├── element-scorer.ts  ✅ EXISTS
│   │   │   ├── yinyang-scorer.ts  ✅ EXISTS
│   │   │   ├── phonetic-scorer.ts  ⬜ TO BUILD (Day 6)
│   │   │   ├── meaning-scorer.ts  ✅ EXISTS
│   │   │   ├── numerology-scorer.ts  ⬜ TO BUILD (Day 6)
│   │   │   └── scoring-pipeline.ts  ✅ EXISTS (enhance)
│   │   │
│   │   └── /utils
│   │       ├── element-relations.ts  ✅ EXISTS
│   │       └── numerology-81.ts  ⬜ TO BUILD (Day 6)
│   │
│   └── /cache
│       └── naming-cache.ts  ⬜ TO BUILD (Day 5)
│
└── /routes
    └── /api
        ├── naming.generate.ts  ⬜ TO BUILD (Week 2)
        ├── naming.detail.$id.ts  ⬜ TO BUILD (Week 2)
        └── saju.calculate.ts  ⬜ TO BUILD (Week 2)
```

---

## 💾 Database Schema (Existing - No Changes Needed)

```sql
-- ✅ CalendarData (96,429 records READY)
calendar_data
├── solarYear, solarMonth, solarDay
├── lunarYear, lunarMonth, lunarDay
├── yearGanjiHanja, yearGanjiKorean  -- 년주
├── monthGanjiHanja, monthGanjiKorean  -- 월주
├── dayGanjiHanja, dayGanjiKorean  -- 일주
├── solarTermHanja, solarTermKorean  -- 24절기
└── zodiacAnimal  -- 12띠

-- ✅ HanjaDict (8,787 records READY)
hanja_dict
├── character  -- 한자
├── meaning  -- 의미
├── korean_reading  -- 한글 발음
├── strokes  -- 획수
├── element  -- 오행 (金木水火土)
├── yin_yang  -- 음양
├── usage_frequency  -- 사용 빈도
├── name_frequency  -- 작명 빈도
├── gender  -- 성별 선호도
└── is_good_for_naming  -- 작명 적합성

-- ✅ Users, SajuData, NamingResult, Payments
-- All existing models work as-is
```

---

## 🔄 Caching Strategy

```yaml
Redis Cache Layers:

Layer 1 - Saju Calculation (24h TTL):
  Key: saju:{birthdate}:{birthtime}
  Value: {pillars, elementCounts, dayMaster}
  Hit Rate Target: 70%

Layer 2 - Yongsin Analysis (24h TTL):
  Key: yongsin:{saju_hash}
  Value: {yongsin, heesin, gisin, confidence, method}
  Hit Rate Target: 80%

Layer 3 - Hanja Queries (7 days TTL):
  Key: hanja:{element}:{pronunciation}
  Value: Hanja[]
  Hit Rate Target: 90%

Layer 4 - Complete Naming (1h TTL):
  Key: naming:{input_hash}
  Value: NamingResult[]
  Hit Rate Target: 30% (personalized)

Cache Invalidation:
  - Manual on HanjaDict updates
  - Automatic TTL expiry
  - LRU eviction on memory pressure
```

---

## 📊 Performance Budget

```yaml
Target: Total < 10 seconds

Breakdown:
  Step 1 (Saju Calculation):     0.1s  (DB query)
  Step 2 (Yongsin AI):           3.0s  (Claude API)
  Step 3 (Phonetic):             0.2s  (IPA conversion)
  Step 4 (Hanja Selection):      2.5s  (DB + AI semantic)
  Step 5 (Combinations):         0.3s  (generation)
  Step 6 (YinYang Validation):   0.05s (calculation)
  Step 7 (Scoring):              0.2s  (all scorers)
  Step 8 (Ranking):              0.05s (sort)
  ───────────────────────────────────
  TOTAL:                         ~6.4s ✅

With Cache Hits:
  Saju (cached):                 0.01s
  Yongsin (cached):              0.01s
  Hanja (cached):                0.1s
  ───────────────────────────────────
  TOTAL:                         ~2.5s ⚡

Optimization Targets:
  - Database queries: < 50ms each
  - AI calls: < 5s (with retry)
  - Cache hit rate: > 60%
```

---

**Architecture Overview Complete** ✅

**Next Action**: Implement CalendarDataService (Day 5, Task 1)

*Diagram generated from sequential-thinking analysis*
*Last updated: 2025-10-24*
