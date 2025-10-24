# SajuName AI - Next Steps Quick Reference
**Date**: October 24, 2025

---

## 📊 CURRENT STATE SNAPSHOT

### ✅ What We Have (60% Complete)
```
✓ PostgreSQL + Prisma fully configured
✓ CalendarData: 96,429 records (1841-2110) - PRODUCTION READY
✓ HanjaDict: 8,787 characters with full metadata - PRODUCTION READY
✓ Basic SajuCalculator (needs integration)
✓ OpenAI GPT-4 integration working
✓ Partial naming services (matching, scoring)
✓ User authentication & payment system
```

### ❌ What's Missing (40% - Next 3 Days)
```
✗ CalendarData NOT integrated with SajuCalculator
✗ Claude API not set up
✗ No 5-method Yongsin analyzer
✗ Phonetic matching incomplete
✗ YinYang validator missing
✗ 81 Numerology needs 4-grid system
✗ No end-to-end naming pipeline
```

---

## 🎯 WEEK 1 REMAINING (Days 5-7) - 24 Hours Total

### DAY 5: Database Integration + AI (8h) ⚡ **START HERE**

#### Morning (4h)
**Priority**: P0 - Critical Path

**Task 1.1: CalendarDataService (2h)**
```typescript
File: /app/lib/calendar/calendar-data.service.ts

Create:
  - getSajuByDate(solarDate: Date) → CalendarData
  - convertLunarToSolar(lunarDate: Date) → Date
  - getSolarTerm(date: Date) → string

Test: 10 sample dates
```

**Task 1.2: Integrate SajuCalculator (2h)**
```typescript
File: /app/lib/saju/calculator.ts

Changes:
  - Replace hardcoded pillar calculations with CalendarData queries
  - Use real 24절기 for month boundaries
  - Add lunar calendar support

Test: 20 birth dates end-to-end
```

#### Afternoon (4h)
**Priority**: P0 - Critical Path

**Task 1.3: Claude API Setup (1h)**
```bash
npm install @anthropic-ai/sdk

File: /app/lib/ai/claude-client.ts

Setup:
  - Add ANTHROPIC_API_KEY to .env
  - Create ClaudeService wrapper
  - Test API connection
```

**Task 1.4: YongsinAnalyzer (3h)**
```typescript
File: /app/lib/saju/yongsin-analyzer.ts

Implement:
  - analyze5Methods(fourPillars) → YongsinResult
  - Prompt templates for:
    * 조후용신법 (seasonal harmony)
    * 억부용신법 (strength balancing)
    * 병약용신법 (weakness curing)
    * 전왕용신법 (dominance)
    * 통관용신법 (mediation)
  - JSON response parsing
  - Confidence scoring

Fallback: Simple rule-based method
```

**END OF DAY 5 CHECK**:
- [ ] CalendarData queries working
- [ ] Saju calculation uses DB
- [ ] Claude API returns Yongsin analysis
- [ ] Confidence score > 70%

---

### DAY 6: Phonetic + Validation (8h)

#### Morning (4h)
**Priority**: P1 - Required for MVP

**Task 2.1: IPA Conversion (2h)**
```typescript
File: /app/lib/phonetics/ipa-converter.ts

Install: ipa-phonetics library

Implement:
  - textToIPA(text, lang) → IPA string
  - ipaToKorean(ipa) → KoreanSyllable[]
  - calculateSimilarity(ipa1, ipa2) → number

Test: 30 foreign names
Example: John → /dʒɑn/ → [준, 존, 전, 진]
```

**Task 2.2: PhoneticMatcher (2h)**
```typescript
File: /app/lib/naming/phonetic-matcher.ts

Implement:
  - matchForeignName(name) → KoreanSyllable[]
  - scorePhoneticSimilarity(original, korean) → number

Integration: Connect to hanja selector
```

#### Afternoon (4h)
**Priority**: P1 - Required for MVP

**Task 2.3: YinYang Validator (2h)**
```typescript
File: /app/lib/naming/validators/yinyang-validator.ts

Logic:
  - getStrokeCount(hanja) → number
  - checkYinYang(stroke) → 'yin' | 'yang'
  - validateBalance(name) → {isBalanced, score, pattern}

Scoring:
  - 2:1 or 1:2 balance = 95점 ✅
  - 3:0 all same = 60점 ⚠️

Reference: 71% accuracy paper
```

**Task 2.4: 81 Numerology Advanced (2h)**
```typescript
File: /app/lib/naming/numerology-81-advanced.ts

Implement 4 Grids:
  - 원격 (initial): surname strokes
  - 형격 (middle): surname + first char
  - 이격 (later): both given name chars
  - 정격 (total): all strokes

Fortune Table:
  - 길수: [1, 3, 5, 6, 7, 8, 11, 13, ...]
  - 반길반흉: [9, 12, 14, 19, ...]
  - 흉수: [2, 4, 10, 20, ...]

Output: {원격, 형격, 이격, 정격, average}
```

**END OF DAY 6 CHECK**:
- [ ] Foreign names → Korean syllables working
- [ ] YinYang balance scoring accurate
- [ ] 81 Numerology returns 4-grid scores

---

### DAY 7: Pipeline + Testing (8h) 🎯 **CRITICAL**

#### Morning (4h)
**Priority**: P0 - Integration

**Task 3.1: NamingPipeline Orchestrator (4h)**
```typescript
File: /app/lib/naming/naming-pipeline.ts

interface NamingPipelineInput {
  originalName: string
  birthDate: Date
  birthTime: string
  isLunar: boolean
  gender: 'M' | 'F'
  preferredSurname?: string
  language: string
}

Pipeline Flow:
  1. Calculate Saju (CalendarData + SajuCalculator)
  2. Analyze Yongsin (Claude API - 5 methods)
  3. Match Phonetics (IPA → Korean syllables)
  4. Select Hanja (DB + AI meaning match)
  5. Generate Combinations (surnames × given names)
  6. Validate YinYang (2:1 balance check)
  7. Score Names:
     - Element compatibility: 35%
     - YinYang balance: 25%
     - Phonetic similarity: 20%
     - Semantic meaning: 10%
     - 81 Numerology: 5%
     - Forbidden check: 5%
  8. Rank & Return Top 5-6

Error Handling:
  - Try-catch per step
  - Fallback to simpler methods
  - Log all failures

Caching:
  - Redis: Saju results (24h TTL)
  - Redis: Yongsin analysis (24h TTL)
```

#### Afternoon (4h)
**Priority**: P0 - Validation

**Task 3.2: End-to-End Testing (4h)**
```typescript
File: /app/tests/naming-e2e.test.ts

Test Cases:
  1. John Smith, 1990-05-15 14:30
     Expected: 김준우 (score > 85)

  2. Sophia Lee, 1995-03-22 09:00
     Expected: 이지혜 (score > 85)

  3. Michael Kim, 2000-11-11 22:00
     Expected: 김민준 (score > 85)

  ... 7 more test cases

Verification:
  - Saju calculation accuracy (vs manual)
  - Yongsin determination correctness
  - Name quality (score > 80)
  - Performance (< 10 seconds)
  - Error handling (no crashes)

Bug Fixes:
  - Fix issues discovered (2h budget)

Performance Optimization:
  - Profile slow queries
  - Add caching where needed
  - Optimize DB queries
```

**END OF DAY 7 CHECK** ✅:
- [ ] Complete naming pipeline works
- [ ] 10/10 test cases pass
- [ ] Performance < 10 seconds
- [ ] No critical errors
- [ ] Names are culturally appropriate
- [ ] Average score > 85

---

## 🎯 WEEK 2 PREVIEW (Days 1-7)

### Day 1-2: Advanced Hanja Intelligence (16h)
```
- AI semantic matching (original meaning → hanja)
- Gender preference filtering
- Popularity-based ranking
- Wuxing compatibility engine
```

### Day 3-4: Combination Optimization (16h)
```
- Smart combination generation (limit 1,200 → 30)
- Advanced filtering (phonetic harmony)
- Scoring pipeline v2
- Explanation generator
```

### Day 5: Performance & Caching (8h)
```
- Redis caching layer
- Query optimization
- Async processing
- Load testing
```

### Day 6-7: API & Frontend (16h)
```
- REST API endpoints
- Socket.io real-time updates
- Frontend integration
- PDF export setup
```

---

## 📊 DEPENDENCY GRAPH (Critical Path)

```
Day 5 Morning:
  CalendarDataService (2h)
    ↓
  SajuCalculator Integration (2h)

Day 5 Afternoon:
  Claude API Setup (1h)
    ↓
  YongsinAnalyzer (3h)

Day 6 Morning:
  IPA Conversion (2h) [PARALLEL]
    ↓
  PhoneticMatcher (2h)

Day 6 Afternoon:
  YinYang Validator (2h) [PARALLEL]
  81 Numerology (2h) [PARALLEL]

Day 7 Morning:
  NamingPipeline (4h) ← REQUIRES ALL ABOVE

Day 7 Afternoon:
  E2E Testing (4h) ← REQUIRES PIPELINE
```

**PARALLEL OPPORTUNITIES**:
- Day 6 afternoon: YinYang + Numerology can be done simultaneously
- Day 6 morning: Phonetic work can be split to second developer

---

## ⚠️ CRITICAL RISKS & MITIGATION

### Risk 1: Yongsin Complexity Too High
**Impact**: High (core algorithm)
**Probability**: Medium
**Mitigation**:
- Start with 2 methods only (조후 + 억부)
- Add remaining 3 methods in Week 2
- Fallback to simple rule-based method

### Risk 2: Claude API Quality Issues
**Impact**: High
**Probability**: Medium
**Mitigation**:
- 3-tier fallback: Claude → GPT-4 → Rule-based
- Cache successful responses (24h TTL)
- Manual review flag for low confidence (<70%)

### Risk 3: Performance > 10 seconds
**Impact**: Medium
**Probability**: Medium
**Mitigation**:
- Redis caching from Day 5
- Async processing for non-critical steps
- Database query optimization
- Consider background job for heavy analysis

### Risk 4: Phonetic Matching Inaccurate
**Impact**: Medium
**Probability**: Medium
**Mitigation**:
- Manual tuning with 100 test names
- User feedback loop
- Allow manual syllable selection

---

## 🎯 SUCCESS CRITERIA (Week 1)

### Functional Requirements
- [ ] Can calculate Saju from any date (1841-2110)
- [ ] Yongsin analysis returns confidence > 70%
- [ ] Foreign names convert to Korean syllables
- [ ] Generates 5-6 quality names (score > 80)
- [ ] YinYang balance validated (71% paper method)
- [ ] 81 Numerology calculates 4 grids
- [ ] Complete pipeline < 10 seconds

### Quality Requirements
- [ ] Saju accuracy > 95% vs manual calculation
- [ ] Name cultural appropriateness verified by native speaker
- [ ] No crashes or unhandled errors
- [ ] API responses are structured JSON
- [ ] Logging captures all failures

### Performance Requirements
- [ ] Database queries < 50ms
- [ ] AI responses < 5 seconds
- [ ] Total pipeline < 10 seconds
- [ ] Handles 10 concurrent requests

---

## 📋 QUICK COMMAND REFERENCE

### Development Commands
```bash
# Start development server
npm run dev

# Run Prisma Studio (DB GUI)
npx prisma studio

# Test API endpoint
curl -X POST http://localhost:3000/api/naming/generate \
  -H "Content-Type: application/json" \
  -d '{"originalName":"John","birthDate":"1990-05-15","birthTime":"14:30"}'

# Check database
node -e "const {PrismaClient} = require('@prisma/client'); const prisma = new PrismaClient(); prisma.calendarData.count().then(console.log);"

# Run tests
npm test
```

### Useful Queries
```javascript
// Get Saju data for specific date
const calendar = await prisma.calendarData.findUnique({
  where: {
    solar_date_unique: {
      solarYear: 1990,
      solarMonth: 5,
      solarDay: 15
    }
  }
});

// Get hanja by element
const hanja = await prisma.hanjaDict.findMany({
  where: {
    element: 'WATER',
    isGoodForNaming: true
  },
  take: 20,
  orderBy: { nameFrequency: 'desc' }
});
```

---

## 🎯 IMMEDIATE NEXT ACTIONS

### Right Now (Next 30 Minutes)
1. ✅ Read this document thoroughly
2. ⬜ Create feature branch: `git checkout -b week1-day5-integration`
3. ⬜ Create `/app/lib/calendar/` directory
4. ⬜ Start Task 1.1: CalendarDataService

### Today (Day 5)
- ⬜ Complete CalendarDataService
- ⬜ Integrate with SajuCalculator
- ⬜ Set up Claude API
- ⬜ Build basic Yongsin analyzer
- ⬜ Test with 5 sample birth dates

### This Week (Days 5-7)
- ⬜ Complete all Day 5 tasks
- ⬜ Complete all Day 6 tasks
- ⬜ Complete all Day 7 tasks
- ⬜ 10/10 E2E tests passing
- ⬜ Demo ready for stakeholders

---

## 📞 QUESTIONS TO RESOLVE

### Technical Decisions Needed
1. **Yongsin Methods**: Start with 2 or all 5?
   - Recommendation: Start with 2 (조후 + 억부)

2. **Caching Strategy**: Redis or in-memory?
   - Recommendation: Redis (persistent across restarts)

3. **API Preference**: Claude Sonnet 4 or GPT-4 primary?
   - Recommendation: Claude primary, GPT-4 fallback

4. **Performance Target**: 10 seconds acceptable?
   - Recommendation: Yes for MVP, optimize Week 2

### Business Decisions Needed
1. Pricing for freemium tier?
2. Expert review threshold (confidence < 70%)?
3. Beta testing with how many users?

---

**READY TO START** ✅

**Next File to Create**: `/app/lib/calendar/calendar-data.service.ts`
**Next Command**: `git checkout -b week1-day5-integration`
**Next Action**: Implement CalendarDataService

---

*Analysis generated by sequential-thinking methodology*
*Last updated: 2025-10-24*
