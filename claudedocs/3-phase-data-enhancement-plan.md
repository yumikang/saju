# 한자 데이터 3단계 개선 계획: 체계적 분석 및 실행 전략

## 📊 Executive Summary

### Current State (Baseline Analysis - Oct 17, 2025)
- **Total Characters**: 8,787
- **Gender Classification**: 24 classified (0.27%), 8,763 unclassified (99.73%)
- **Name Popularity Data**: 0 characters with data (100% missing)
- **Negative Filtering**: 52 characters filtered (0.59%)
- **Element Distribution**: Balanced (19-21% per element)

### Target State
- **Gender Classification**: 100% coverage (8,787 characters)
- **Name Popularity**: 100% coverage with 2024 Korean newborn statistics
- **Negative Filtering**: Expanded to 150-200 characters with enhanced criteria

### Expected Impact
- **Recommendation Quality**: 3-5x improvement through gender-aware filtering
- **User Relevance**: 10x improvement through popularity-based ranking
- **Trust & Safety**: 3x improvement through comprehensive negative filtering

---

## 🎯 Phase 1: Gender Classification System

### 1.1 Problem Analysis

**Current State**:
- Only 24/8,787 characters (0.27%) have gender classification
- Database field exists (`gender: String?`) but is empty
- No systematic classification methodology

**Impact of Missing Data**:
- Cannot provide gender-appropriate name recommendations
- Users requesting male/female names get irrelevant results
- Competitive disadvantage vs. professional naming services

### 1.2 Classification Methodology

#### Three-Tier Approach

**Tier 1: Explicit Gender Characters (Target: ~200 characters)**
- **Male-Explicit**: 雄男夫父兄弟公侯將帥武伯叔翁郎君王帝
- **Female-Explicit**: 淑姬娥妍嬪姸娟妃姝媛婉嬌姜娜姉妺妹
- **Rationale**: Characters with inherent gender meaning in Korean culture
- **Confidence**: 95%+ accuracy
- **Implementation**: Manual curated list + database update

**Tier 2: Cultural Gender Preference (Target: ~1,500 characters)**

Based on Korean naming conventions and historical usage:

```typescript
// Male-preferred patterns
const malePatterns = {
  meanings: ['strength', 'power', 'achievement', 'wisdom', 'leadership'],
  radicals: ['力', '武', '文', '王', '士'],
  examples: ['強', '勇', '剛', '哲', '泰', '碩', '煥', '赫']
};

// Female-preferred patterns
const femalePatterns = {
  meanings: ['beauty', 'elegance', 'virtue', 'grace', 'gentleness'],
  radicals: ['女', '艸', '玉', '糸'],
  examples: ['美', '麗', '雅', '恩', '慧', '秀', '靜', '瑛']
};
```

**Data Sources**:
1. 2010-2024 Korean newborn name statistics (행자부 데이터)
2. Historical name databases (조선왕조실록 인명)
3. Modern naming service databases

**Classification Algorithm**:
```typescript
interface GenderScore {
  male: number;      // 0-100
  female: number;    // 0-100
  neutral: number;   // 0-100
}

function classifyGender(
  character: string,
  meaning: string,
  radical: string,
  historicalUsage: UsageStats
): 'male' | 'female' | 'neutral' {
  const scores = calculateGenderScores(character, meaning, radical, historicalUsage);

  // Strong preference threshold: 70+
  if (scores.male >= 70 && scores.male > scores.female + 30) return 'male';
  if (scores.female >= 70 && scores.female > scores.male + 30) return 'female';

  // Moderate preference threshold: 60+
  if (scores.male >= 60 && scores.male > scores.female + 20) return 'male';
  if (scores.female >= 60 && scores.female > scores.male + 20) return 'female';

  // Otherwise neutral
  return 'neutral';
}
```

**Tier 3: Neutral Characters (Target: ~7,000 characters)**
- Characters with no strong gender association
- Common elements: numbers, nature, colors, abstract concepts
- Examples: 一二三天地山川春夏秋冬紅藍綠

#### 1.3 Data Sources & Collection Strategy

**Primary Source: 2010-2024 Korean Newborn Names**
```typescript
interface NewbornNameData {
  year: number;
  character: string;
  maleCount: number;    // Usage in male names
  femaleCount: number;  // Usage in female names
  totalCount: number;
}

// Example data structure
const exampleData = {
  '2024': {
    '윤': { male: 12453, female: 3421 },  // 78% male → 'male'
    '서': { male: 8234, female: 11234 },  // 58% female → 'female'
    '민': { male: 7823, female: 7234 }    // 52% male → 'neutral'
  }
};
```

**Data Collection Methods**:

1. **Web Scraping** (if available):
```typescript
// scripts/etl/85_scrape_newborn_stats.ts
async function scrapeNewbornStats(year: number): Promise<NewbornNameData[]> {
  // Target: 행정안전부 이름 통계 (mois.go.kr)
  // Fallback: 통계청 인구동향조사
}
```

2. **Manual Dataset Creation** (if scraping unavailable):
```typescript
// data/gender-classification/manual-newborn-stats.json
{
  "source": "행정안전부 2024년 신생아 이름 통계",
  "year": 2024,
  "data": [
    { "char": "서", "male": 8234, "female": 11234 },
    { "char": "윤", "male": 12453, "female": 3421 },
    // ... top 500 most common characters
  ]
}
```

3. **Academic/Commercial Datasets**:
- Purchase from naming service providers
- Academic research papers on Korean naming trends
- Collaborate with Korean language institutes

#### 1.4 Implementation Steps

**Step 1: Create Gender Classification Data Structure**
```bash
# Directory structure
data/
└── gender-classification/
    ├── tier1-explicit.json           # Manual curated ~200 chars
    ├── tier2-cultural-male.json      # Cultural male preference
    ├── tier2-cultural-female.json    # Cultural female preference
    ├── tier3-neutral.json            # Neutral characters
    └── newborn-stats-2024.json       # Statistical data
```

**Step 2: Build Classification Script**
```typescript
// scripts/etl/85_classify_gender.ts
import { PrismaClient } from '@prisma/client';
import tier1Data from '../../data/gender-classification/tier1-explicit.json';
import newbornStats from '../../data/gender-classification/newborn-stats-2024.json';

interface ClassificationResult {
  character: string;
  gender: 'male' | 'female' | 'neutral';
  confidence: number;
  source: 'explicit' | 'statistical' | 'cultural' | 'default';
  metadata: {
    maleUsage?: number;
    femaleUsage?: number;
    reasoning: string;
  };
}

async function classifyAllCharacters(): Promise<ClassificationResult[]> {
  const results: ClassificationResult[] = [];

  // Get all characters from database
  const allChars = await prisma.hanjaDict.findMany({
    select: { character: true, meaning: true, radical: true }
  });

  for (const char of allChars) {
    const result = await classifyCharacter(char);
    results.push(result);
  }

  return results;
}

async function classifyCharacter(char: {
  character: string;
  meaning: string | null;
  radical: string | null;
}): Promise<ClassificationResult> {
  // Tier 1: Check explicit list
  const tier1 = tier1Data.find(t => t.character === char.character);
  if (tier1) {
    return {
      character: char.character,
      gender: tier1.gender,
      confidence: 0.95,
      source: 'explicit',
      metadata: { reasoning: tier1.reason }
    };
  }

  // Tier 2: Check statistical data
  const stats = newbornStats.find(s => s.char === char.character);
  if (stats) {
    const total = stats.male + stats.female;
    const maleRatio = stats.male / total;
    const femaleRatio = stats.female / total;

    if (maleRatio >= 0.70) {
      return {
        character: char.character,
        gender: 'male',
        confidence: maleRatio,
        source: 'statistical',
        metadata: {
          maleUsage: stats.male,
          femaleUsage: stats.female,
          reasoning: `${(maleRatio*100).toFixed(1)}% male usage in 2024 newborns`
        }
      };
    }

    if (femaleRatio >= 0.70) {
      return {
        character: char.character,
        gender: 'female',
        confidence: femaleRatio,
        source: 'statistical',
        metadata: {
          maleUsage: stats.male,
          femaleUsage: stats.female,
          reasoning: `${(femaleRatio*100).toFixed(1)}% female usage in 2024 newborns`
        }
      };
    }
  }

  // Tier 3: Cultural patterns
  const cultural = analyzeCulturalPatterns(char.character, char.meaning, char.radical);
  if (cultural.confidence >= 0.60) {
    return {
      character: char.character,
      gender: cultural.gender,
      confidence: cultural.confidence,
      source: 'cultural',
      metadata: { reasoning: cultural.reasoning }
    };
  }

  // Default: neutral
  return {
    character: char.character,
    gender: 'neutral',
    confidence: 0.50,
    source: 'default',
    metadata: { reasoning: 'No strong gender association found' }
  };
}
```

**Step 3: Validation & Review**
```typescript
// scripts/etl/86_validate_gender_classification.ts

async function validateClassification() {
  // Sample validation: check 100 random characters
  const sample = await getRandomSample(100);

  console.log('🔍 Manual Review Required:');
  console.log('Please review these classifications:\n');

  for (const item of sample) {
    console.log(`${item.character} → ${item.gender} (confidence: ${item.confidence})`);
    console.log(`  Reasoning: ${item.metadata.reasoning}\n`);
  }

  // Generate validation report
  const report = generateValidationReport(sample);
  await saveReport(report, 'gender-classification-validation.md');
}
```

**Step 4: Database Update**
```typescript
// scripts/etl/87_update_gender_data.ts

async function updateGenderData(classifications: ClassificationResult[]) {
  console.log(`📝 Updating gender data for ${classifications.length} characters...`);

  // Batch update for performance
  const batchSize = 100;
  let updated = 0;

  for (let i = 0; i < classifications.length; i += batchSize) {
    const batch = classifications.slice(i, i + batchSize);

    await prisma.$transaction(
      batch.map(item =>
        prisma.hanjaDict.update({
          where: { character: item.character },
          data: {
            gender: item.gender,
            // Store metadata in evidenceJSON for audit trail
            evidenceJSON: {
              ...(item.metadata as Record<string, unknown>),
              genderSource: item.source,
              genderConfidence: item.confidence,
              classifiedAt: new Date().toISOString()
            }
          }
        })
      )
    );

    updated += batch.length;
    console.log(`  Progress: ${updated}/${classifications.length} (${((updated/classifications.length)*100).toFixed(1)}%)`);
  }

  console.log('✅ Gender data update complete!');

  // Verify results
  const stats = await prisma.hanjaDict.groupBy({
    by: ['gender'],
    _count: true
  });

  console.log('\n📊 Final Statistics:');
  stats.forEach(s => {
    console.log(`  ${s.gender}: ${s._count} characters`);
  });
}
```

#### 1.5 Testing Strategy

**Unit Tests**:
```typescript
// scripts/etl/__tests__/gender-classification.test.ts

describe('Gender Classification', () => {
  it('should classify explicit male characters correctly', () => {
    expect(classifyCharacter('雄')).toEqual({
      gender: 'male',
      confidence: expect.any(Number),
      source: 'explicit'
    });
  });

  it('should classify explicit female characters correctly', () => {
    expect(classifyCharacter('淑')).toEqual({
      gender: 'female',
      confidence: expect.any(Number),
      source: 'explicit'
    });
  });

  it('should classify neutral characters correctly', () => {
    expect(classifyCharacter('山')).toEqual({
      gender: 'neutral',
      confidence: expect.any(Number),
      source: expect.stringMatching(/cultural|default/)
    });
  });

  it('should handle statistical data correctly', () => {
    const result = classifyWithStats('서', { male: 1000, female: 5000 });
    expect(result.gender).toBe('female');
    expect(result.confidence).toBeGreaterThan(0.7);
  });
});
```

**Integration Tests**:
```typescript
describe('Gender Classification Integration', () => {
  it('should classify all 8,787 characters without errors', async () => {
    const results = await classifyAllCharacters();
    expect(results).toHaveLength(8787);
    expect(results.every(r => ['male', 'female', 'neutral'].includes(r.gender))).toBe(true);
  });

  it('should have at least 50% neutral characters', async () => {
    const results = await classifyAllCharacters();
    const neutral = results.filter(r => r.gender === 'neutral').length;
    expect(neutral / results.length).toBeGreaterThan(0.5);
  });
});
```

#### 1.6 Timeline & Effort Estimation

| Task | Effort | Duration | Dependencies |
|------|--------|----------|--------------|
| Data collection (newborn stats) | 2-3 days | Week 1 | None |
| Tier 1 manual curation | 1 day | Week 1 | None |
| Classification algorithm | 2 days | Week 1 | Data collection |
| Implementation script | 1 day | Week 1 | Algorithm |
| Testing & validation | 1-2 days | Week 2 | Implementation |
| Database update | 0.5 days | Week 2 | Validation |
| **Total** | **7.5-9.5 days** | **2 weeks** | |

---

## 🎯 Phase 2: Name Popularity Scoring (2024 Korean Newborn Statistics)

### 2.1 Problem Analysis

**Current State**:
- ALL 8,787 characters have `nameFrequency: 0`
- No ranking or prioritization in recommendations
- Users get obscure characters mixed with popular ones
- No way to filter/sort by popularity

**Impact**:
- Poor user experience (obscure characters recommended first)
- No data-driven insights for name trends
- Cannot match competitive naming services
- Missing opportunity for "trending names" feature

### 2.2 Data Sources & Collection

**Primary Source: 2024 Korean Newborn Names**

Target data structure:
```typescript
interface NewbornNameStatistic {
  year: number;
  rank: number;          // Overall popularity rank
  name: string;          // Full name (e.g., "서윤")
  gender: 'M' | 'F';
  count: number;         // Number of newborns with this name
  characters: {
    first: string;       // First character
    second?: string;     // Second character (if 2-char name)
  };
}

// Example: Top names in 2024
const top2024Names = [
  { rank: 1, name: '서윤', gender: 'F', count: 2431, chars: ['서', '윤'] },
  { rank: 2, name: '하윤', gender: 'F', count: 2184, chars: ['하', '윤'] },
  { rank: 3, name: '지우', gender: 'M', count: 2156, chars: ['지', '우'] },
  // ... top 100-1000 names
];
```

**Data Collection Strategy**:

**Option 1: Official Government Data** (Preferred)
- Source: 행정안전부 (Ministry of Interior and Safety)
- URL: https://www.mois.go.kr (주민등록 인구통계)
- Format: Excel/CSV download
- Coverage: Top 100-1000 names per year
- Quality: Highest accuracy, official statistics

**Option 2: Web Scraping**
```typescript
// scripts/etl/88_scrape_newborn_names_2024.ts
import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrapeNewbornNames2024(): Promise<NewbornNameStatistic[]> {
  const url = 'https://www.mois.go.kr/frt/bbs/type001/commonSelectBoardArticle.do';

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Parse table data
    const names: NewbornNameStatistic[] = [];

    $('table.board-list tbody tr').each((idx, el) => {
      const rank = $(el).find('td').eq(0).text().trim();
      const name = $(el).find('td').eq(1).text().trim();
      const count = parseInt($(el).find('td').eq(2).text().trim());

      // Extract characters from name
      const characters = name.split('').slice(1); // Remove surname

      names.push({
        year: 2024,
        rank: parseInt(rank),
        name,
        gender: inferGender(name), // Use existing gender data
        count,
        characters: {
          first: characters[0],
          second: characters[1]
        }
      });
    });

    return names;
  } catch (error) {
    console.error('Failed to scrape newborn names:', error);
    return [];
  }
}
```

**Option 3: Manual Dataset Creation**
```json
// data/popularity/newborn-names-2024.json
{
  "source": "행정안전부 2024년 신생아 이름 통계",
  "year": 2024,
  "lastUpdated": "2024-12-31",
  "totalBirths": 230000,
  "names": [
    {
      "rank": 1,
      "name": "서윤",
      "gender": "F",
      "count": 2431,
      "percentage": 1.06,
      "characters": ["서", "윤"]
    }
  ]
}
```

### 2.3 Popularity Scoring Algorithm

**Frequency Calculation Logic**:

```typescript
// Calculate character frequency from name statistics
interface CharacterFrequency {
  character: string;
  totalUsage: number;
  maleUsage: number;
  femaleUsage: number;
  appearanceInTopNames: number;
  averageRank: number;
  score: number; // Final popularity score
}

function calculateCharacterFrequencies(
  nameStats: NewbornNameStatistic[]
): Map<string, CharacterFrequency> {
  const freqMap = new Map<string, CharacterFrequency>();

  for (const stat of nameStats) {
    const chars = [stat.characters.first, stat.characters.second].filter(Boolean);

    for (const char of chars) {
      if (!freqMap.has(char)) {
        freqMap.set(char, {
          character: char,
          totalUsage: 0,
          maleUsage: 0,
          femaleUsage: 0,
          appearanceInTopNames: 0,
          averageRank: 0,
          score: 0
        });
      }

      const freq = freqMap.get(char)!;
      freq.totalUsage += stat.count;

      if (stat.gender === 'M') {
        freq.maleUsage += stat.count;
      } else {
        freq.femaleUsage += stat.count;
      }

      freq.appearanceInTopNames += 1;
      freq.averageRank += stat.rank;
    }
  }

  // Calculate average rank and popularity score
  for (const freq of freqMap.values()) {
    freq.averageRank = freq.averageRank / freq.appearanceInTopNames;

    // Popularity score formula (0-10000 scale)
    // Factors:
    // - Total usage (weight: 40%)
    // - Appearance in top names (weight: 30%)
    // - Average rank position (weight: 30%)

    const usageScore = Math.min(freq.totalUsage / 100, 4000);
    const appearanceScore = Math.min(freq.appearanceInTopNames * 100, 3000);
    const rankScore = Math.max(0, 3000 - freq.averageRank * 10);

    freq.score = Math.round(usageScore + appearanceScore + rankScore);
  }

  return freqMap;
}
```

**Normalization & Scaling**:

```typescript
// Normalize scores to 0-10000 range for consistency
function normalizeScores(frequencies: Map<string, CharacterFrequency>): void {
  const scores = Array.from(frequencies.values()).map(f => f.score);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);

  for (const freq of frequencies.values()) {
    // Min-max normalization to 0-10000 range
    freq.score = Math.round(
      ((freq.score - minScore) / (maxScore - minScore)) * 10000
    );
  }
}
```

**Default Values for Characters Not in Dataset**:

```typescript
// Characters not appearing in top names get default low score
const DEFAULT_FREQUENCY = 100; // Low but non-zero

async function assignDefaultFrequencies(
  allCharacters: string[],
  frequencies: Map<string, CharacterFrequency>
): Promise<void> {
  for (const char of allCharacters) {
    if (!frequencies.has(char)) {
      frequencies.set(char, {
        character: char,
        totalUsage: DEFAULT_FREQUENCY,
        maleUsage: 50,
        femaleUsage: 50,
        appearanceInTopNames: 0,
        averageRank: 999,
        score: DEFAULT_FREQUENCY
      });
    }
  }
}
```

### 2.4 Implementation Steps

**Step 1: Data Collection Script**

```typescript
// scripts/etl/88_collect_newborn_stats.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';

async function main() {
  console.log('📊 수집 중: 2024 신생아 이름 통계...\n');

  // Try multiple sources
  let nameStats: NewbornNameStatistic[] = [];

  // Source 1: Manual dataset (if available)
  try {
    const manualData = await fs.readFile(
      'data/popularity/newborn-names-2024.json',
      'utf-8'
    );
    nameStats = JSON.parse(manualData).names;
    console.log(`✅ Loaded ${nameStats.length} names from manual dataset`);
  } catch {
    console.log('⚠️  Manual dataset not found');
  }

  // Source 2: Web scraping (fallback)
  if (nameStats.length === 0) {
    console.log('🔄 Attempting web scraping...');
    nameStats = await scrapeNewbornNames2024();

    if (nameStats.length > 0) {
      console.log(`✅ Scraped ${nameStats.length} names`);
      // Save for future use
      await fs.writeFile(
        'data/popularity/newborn-names-2024-scraped.json',
        JSON.stringify({ year: 2024, names: nameStats }, null, 2)
      );
    }
  }

  if (nameStats.length === 0) {
    throw new Error('❌ No data sources available. Please provide manual dataset.');
  }

  // Calculate character frequencies
  const frequencies = calculateCharacterFrequencies(nameStats);
  normalizeScores(frequencies);

  console.log(`\n📈 Calculated frequencies for ${frequencies.size} unique characters`);

  // Save frequency data
  await fs.writeFile(
    'data/popularity/character-frequencies-2024.json',
    JSON.stringify(Array.from(frequencies.values()), null, 2)
  );

  console.log('✅ Character frequency data saved');

  // Display top 20 most popular characters
  const topChars = Array.from(frequencies.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  console.log('\n⭐ Top 20 Most Popular Characters in 2024:');
  topChars.forEach((char, idx) => {
    console.log(
      `  ${idx + 1}. ${char.character} (score: ${char.score}, ` +
      `usage: ${char.totalUsage}, appearances: ${char.appearanceInTopNames})`
    );
  });
}

main()
  .catch(console.error)
  .finally(() => process.exit());
```

**Step 2: Database Update Script**

```typescript
// scripts/etl/89_update_name_frequency.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';

const prisma = new PrismaClient();

async function main() {
  console.log('📝 Updating nameFrequency in database...\n');

  // Load frequency data
  const freqData = JSON.parse(
    await fs.readFile('data/popularity/character-frequencies-2024.json', 'utf-8')
  );

  console.log(`📊 Loaded ${freqData.length} character frequencies`);

  // Get all characters from database
  const allChars = await prisma.hanjaDict.findMany({
    select: { character: true }
  });

  console.log(`📚 Database has ${allChars.length} characters total`);

  // Create update operations
  const updates: Array<{ character: string; frequency: number }> = [];

  for (const char of allChars) {
    const freqEntry = freqData.find((f: CharacterFrequency) => f.character === char.character);
    const frequency = freqEntry ? freqEntry.score : DEFAULT_FREQUENCY;

    updates.push({
      character: char.character,
      frequency
    });
  }

  // Batch update for performance
  const batchSize = 100;
  let updated = 0;

  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);

    await prisma.$transaction(
      batch.map(item =>
        prisma.hanjaDict.update({
          where: { character: item.character },
          data: { nameFrequency: item.frequency }
        })
      )
    );

    updated += batch.length;

    if (updated % 1000 === 0 || updated === updates.length) {
      console.log(`  Progress: ${updated}/${updates.length} (${((updated/updates.length)*100).toFixed(1)}%)`);
    }
  }

  console.log('\n✅ nameFrequency update complete!');

  // Verification statistics
  const stats = await prisma.hanjaDict.aggregate({
    _count: true,
    _avg: { nameFrequency: true },
    _max: { nameFrequency: true },
    _min: { nameFrequency: true }
  });

  const withData = await prisma.hanjaDict.count({
    where: { nameFrequency: { gt: DEFAULT_FREQUENCY } }
  });

  console.log('\n📊 Final Statistics:');
  console.log(`  Total characters: ${stats._count}`);
  console.log(`  Average frequency: ${stats._avg.nameFrequency?.toFixed(2)}`);
  console.log(`  Max frequency: ${stats._max.nameFrequency}`);
  console.log(`  Min frequency: ${stats._min.nameFrequency}`);
  console.log(`  Characters with real data: ${withData} (${((withData/stats._count)*100).toFixed(1)}%)`);

  // Show top 10 most popular in database
  const topChars = await prisma.hanjaDict.findMany({
    orderBy: { nameFrequency: 'desc' },
    take: 10,
    select: { character: true, meaning: true, nameFrequency: true }
  });

  console.log('\n⭐ Top 10 Most Popular Characters in Database:');
  topChars.forEach((char, idx) => {
    console.log(`  ${idx + 1}. ${char.character} (${char.meaning}) - frequency: ${char.nameFrequency}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Step 3: API Integration**

Update HanjaRepository to use nameFrequency:

```typescript
// app/repositories/hanja.repository.ts (updated)

async function findMany(params: {
  element?: string;
  gender?: string;
  minStrokes?: number;
  maxStrokes?: number;
  sortBy?: 'popularity' | 'strokes' | 'default';
  skip?: number;
  take?: number;
}): Promise<{ data: HanjaDict[]; total: number }> {
  const {
    element,
    gender,
    minStrokes,
    maxStrokes,
    sortBy = 'popularity', // Changed default to popularity
    skip = 0,
    take = 100
  } = params;

  const where: Prisma.HanjaDictWhereInput = {
    ...(element && { element }),
    ...(gender && { gender }),
    ...(minStrokes || maxStrokes
      ? {
          strokes: {
            ...(minStrokes && { gte: minStrokes }),
            ...(maxStrokes && { lte: maxStrokes })
          }
        }
      : {}),
    isGoodForNaming: true // Always filter out negative characters
  };

  // Dynamic ordering based on sortBy parameter
  const orderBy = sortBy === 'popularity'
    ? [{ nameFrequency: 'desc' as const }, { strokes: 'asc' as const }]
    : sortBy === 'strokes'
    ? [{ strokes: 'asc' as const }, { nameFrequency: 'desc' as const }]
    : [{ nameFrequency: 'desc' as const }, { usageFrequency: 'desc' as const }];

  const [data, total] = await Promise.all([
    this.prisma.hanjaDict.findMany({
      where,
      skip,
      take,
      orderBy
    }),
    this.prisma.hanjaDict.count({ where })
  ]);

  return { data, total };
}
```

### 2.5 Testing Strategy

```typescript
// scripts/etl/__tests__/popularity-scoring.test.ts

describe('Popularity Scoring', () => {
  it('should calculate frequencies correctly from name statistics', () => {
    const mockStats: NewbornNameStatistic[] = [
      { rank: 1, name: '서윤', gender: 'F', count: 2000, characters: { first: '서', second: '윤' } },
      { rank: 2, name: '하윤', gender: 'F', count: 1500, characters: { first: '하', second: '윤' } }
    ];

    const frequencies = calculateCharacterFrequencies(mockStats);

    expect(frequencies.get('윤')?.totalUsage).toBe(3500); // appears in both
    expect(frequencies.get('서')?.totalUsage).toBe(2000);
    expect(frequencies.get('윤')?.appearanceInTopNames).toBe(2);
  });

  it('should normalize scores to 0-10000 range', () => {
    const frequencies = new Map([
      ['A', { character: 'A', score: 1000, totalUsage: 1000, maleUsage: 500, femaleUsage: 500, appearanceInTopNames: 1, averageRank: 1 }],
      ['B', { character: 'B', score: 5000, totalUsage: 5000, maleUsage: 2500, femaleUsage: 2500, appearanceInTopNames: 5, averageRank: 2 }],
      ['C', { character: 'C', score: 9000, totalUsage: 9000, maleUsage: 4500, femaleUsage: 4500, appearanceInTopNames: 10, averageRank: 3 }]
    ]);

    normalizeScores(frequencies);

    expect(frequencies.get('A')?.score).toBe(0);
    expect(frequencies.get('C')?.score).toBe(10000);
    expect(frequencies.get('B')?.score).toBeGreaterThan(0);
    expect(frequencies.get('B')?.score).toBeLessThan(10000);
  });

  it('should assign default frequency to characters not in dataset', async () => {
    const allChars = ['A', 'B', 'C', 'D', 'E'];
    const frequencies = new Map([
      ['A', { character: 'A', score: 5000, totalUsage: 5000, maleUsage: 2500, femaleUsage: 2500, appearanceInTopNames: 5, averageRank: 1 }]
    ]);

    await assignDefaultFrequencies(allChars, frequencies);

    expect(frequencies.get('B')?.score).toBe(DEFAULT_FREQUENCY);
    expect(frequencies.get('C')?.score).toBe(DEFAULT_FREQUENCY);
  });
});

describe('Database Update Integration', () => {
  it('should update all 8,787 characters with frequencies', async () => {
    const result = await updateAllFrequencies();
    expect(result.updated).toBe(8787);
    expect(result.errors).toHaveLength(0);
  });

  it('should have non-zero frequencies after update', async () => {
    const count = await prisma.hanjaDict.count({
      where: { nameFrequency: { gt: 0 } }
    });
    expect(count).toBe(8787);
  });
});
```

### 2.6 Timeline & Effort Estimation

| Task | Effort | Duration | Dependencies |
|------|--------|----------|--------------|
| Data source identification | 1 day | Week 2 | None |
| Data collection/scraping | 2-3 days | Week 2-3 | Source identification |
| Frequency calculation algorithm | 1 day | Week 3 | Data collection |
| Implementation scripts | 1 day | Week 3 | Algorithm |
| Database update | 0.5 days | Week 3 | Implementation |
| API integration | 1 day | Week 3 | Database update |
| Testing & validation | 1-2 days | Week 3-4 | API integration |
| **Total** | **7.5-9.5 days** | **3 weeks** | |

---

## 🎯 Phase 3: Enhanced Negative Character Filtering

### 3.1 Problem Analysis

**Current State**:
- Only 52/8,787 characters (0.59%) marked as unsuitable for naming
- Basic negative character list from `update-negative-hanja.ts`
- No systematic categorization or severity levels
- Missing many culturally inappropriate characters

**Impact**:
- Risk of recommending inappropriate names
- User trust issues if negative characters appear
- Competitive disadvantage vs. professional services
- Potential cultural insensitivity

### 3.2 Comprehensive Negative Character Categories

**Extended Negative Character List**:

```typescript
// data/negative-characters/categories.json
{
  "categories": {
    "death_disaster": {
      "severity": "critical",
      "description": "Characters related to death, killing, or disaster",
      "characters": [
        "死", "亡", "喪", "殺", "屠", "刑", "斬", "殉", "弔", "崩",
        "滅", "絕", "盡", "終", "墓", "葬", "殃", "禍", "災", "厄"
      ]
    },
    "disease_injury": {
      "severity": "critical",
      "description": "Characters related to illness, injury, or disability",
      "characters": [
        "病", "患", "疾", "痛", "傷", "殘", "弱", "瘦", "癌", "疫",
        "痴", "癡", "瘋", "癩", "瘡", "腫", "疼", "瘴", "癱", "疲"
      ]
    },
    "poverty_failure": {
      "severity": "high",
      "description": "Characters related to poverty, failure, or decline",
      "characters": [
        "貧", "窮", "困", "敗", "衰", "破", "廢", "枯", "衰", "敗",
        "落", "虧", "損", "失", "匱", "乏", "缺", "塌", "傾", "倒"
      ]
    },
    "negative_emotions": {
      "severity": "high",
      "description": "Characters expressing strong negative emotions",
      "characters": [
        "苦", "悲", "哀", "憂", "愁", "怨", "恨", "恥", "羞", "慚",
        "懼", "恐", "驚", "慌", "惶", "愧", "怖", "怯", "懦", "憾"
      ]
    },
    "immoral_criminal": {
      "severity": "critical",
      "description": "Characters related to immorality or criminal behavior",
      "characters": [
        "賤", "卑", "陋", "醜", "劣", "拙", "僞", "欺", "盜", "奸",
        "詐", "騙", "妖", "魔", "鬼", "怪", "邪", "惡", "凶", "兇",
        "暴", "虐", "殘", "酷", "狠", "毒", "恨", "仇", "讐", "敵"
      ]
    },
    "violence_conflict": {
      "severity": "medium",
      "description": "Characters related to violence or conflict",
      "characters": [
        "戰", "爭", "鬪", "毆", "打", "擊", "刺", "砍", "劈", "斷",
        "闘", "撲", "搏", "格", "敵", "襲", "攻", "伐", "征", "討"
      ]
    },
    "decay_corruption": {
      "severity": "medium",
      "description": "Characters related to decay, rot, or corruption",
      "characters": [
        "腐", "爛", "朽", "蝕", "蛀", "蟲", "銹", "髒", "污", "穢",
        "臭", "腥", "臭", "穢", "汙", "濁", "昏", "暗", "黑", "陰"
      ]
    },
    "isolation_abandonment": {
      "severity": "medium",
      "description": "Characters related to isolation or abandonment",
      "characters": [
        "孤", "寂", "寞", "獨", "離", "別", "棄", "捨", "遺", "拋",
        "棄", "廢", "遺", "忘", "疏", "遠", "隔", "斷", "絕", "孑"
      ]
    },
    "natural_disasters": {
      "severity": "medium",
      "description": "Characters related to natural disasters",
      "characters": [
        "震", "崩", "塌", "陷", "裂", "旱", "澇", "洪", "淹", "溺",
        "颶", "颱", "暴", "雷", "霹", "靂", "霜", "雹", "霧", "霾"
      ]
    },
    "supernatural_fear": {
      "severity": "low",
      "description": "Characters with supernatural or fearful connotations",
      "characters": [
        "鬼", "魔", "妖", "怪", "魅", "魑", "魍", "魎", "祟", "詛",
        "咒", "巫", "靈", "幽", "冥", "闇", "陰", "煞", "殃", "厄"
      ]
    }
  }
}
```

**Nuanced Filtering Strategy**:

Some characters have dual meanings - negative in isolation but acceptable in compounds:
```typescript
interface NuancedCharacter {
  character: string;
  standalone: 'bad' | 'neutral' | 'good';
  inCompound: 'bad' | 'neutral' | 'good';
  acceptableCompounds?: string[];
  reasoning: string;
}

const nuancedCharacters: NuancedCharacter[] = [
  {
    character: '死',
    standalone: 'bad',
    inCompound: 'bad',
    reasoning: 'Always inappropriate for names - death'
  },
  {
    character: '龍',
    standalone: 'good',
    inCompound: 'good',
    reasoning: 'Positive - dragon, power, nobility'
  },
  {
    character: '鬼',
    standalone: 'bad',
    inCompound: 'neutral',
    acceptableCompounds: ['鬼才'], // genius talent
    reasoning: 'Ghost/demon - bad alone, but okay in specific compounds'
  }
];
```

### 3.3 Implementation Strategy

**Step 1: Expand Negative Character Database**

```typescript
// scripts/etl/90_expand_negative_characters.ts
import { PrismaClient } from '@prisma/client';
import categories from '../../data/negative-characters/categories.json';

const prisma = new PrismaClient();

interface NegativeCategory {
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  characters: string[];
}

async function main() {
  console.log('🛡️  Expanding negative character filtering...\n');

  // Collect all negative characters
  const allNegativeChars = new Set<string>();
  const charMetadata = new Map<string, {
    category: string;
    severity: string;
    reason: string;
  }>();

  for (const [categoryName, category] of Object.entries(categories.categories)) {
    const cat = category as NegativeCategory;
    console.log(`📋 ${categoryName}: ${cat.characters.length} characters (${cat.severity})`);

    for (const char of cat.characters) {
      allNegativeChars.add(char);
      charMetadata.set(char, {
        category: categoryName,
        severity: cat.severity,
        reason: cat.description
      });
    }
  }

  console.log(`\n📊 Total negative characters: ${allNegativeChars.size}`);

  // Check which ones exist in database
  const existingChars = await prisma.hanjaDict.findMany({
    where: {
      character: {
        in: Array.from(allNegativeChars)
      }
    },
    select: { character: true, isGoodForNaming: true }
  });

  console.log(`✅ Found ${existingChars.length} in database`);

  const alreadyMarked = existingChars.filter(c => !c.isGoodForNaming).length;
  const toUpdate = existingChars.filter(c => c.isGoodForNaming).length;

  console.log(`  Already marked: ${alreadyMarked}`);
  console.log(`  Need update: ${toUpdate}`);

  // Update database
  if (toUpdate > 0) {
    const updateResult = await prisma.hanjaDict.updateMany({
      where: {
        character: {
          in: existingChars
            .filter(c => c.isGoodForNaming)
            .map(c => c.character)
        }
      },
      data: {
        isGoodForNaming: false
      }
    });

    console.log(`\n✅ Updated ${updateResult.count} characters`);
  }

  // Store metadata in evidenceJSON for audit trail
  console.log('\n📝 Storing negative character metadata...');

  let metadataUpdated = 0;
  for (const char of existingChars) {
    const metadata = charMetadata.get(char.character);
    if (metadata) {
      await prisma.hanjaDict.update({
        where: { character: char.character },
        data: {
          evidenceJSON: {
            negativeReason: metadata.reason,
            negativeCategory: metadata.category,
            negativeSeverity: metadata.severity,
            markedAt: new Date().toISOString()
          }
        }
      });
      metadataUpdated++;
    }
  }

  console.log(`✅ Metadata updated for ${metadataUpdated} characters`);

  // Final statistics
  const finalStats = await prisma.hanjaDict.groupBy({
    by: ['isGoodForNaming'],
    _count: true
  });

  console.log('\n📊 Final Statistics:');
  finalStats.forEach(stat => {
    const label = stat.isGoodForNaming ? '작명 적합' : '작명 부적합';
    console.log(`  ${label}: ${stat._count}`);
  });

  // Show sample of negative characters
  const sampleNegative = await prisma.hanjaDict.findMany({
    where: { isGoodForNaming: false },
    take: 20,
    select: { character: true, meaning: true, evidenceJSON: true }
  });

  console.log('\n🔍 Sample Negative Characters (first 20):');
  sampleNegative.forEach(char => {
    const evidence = char.evidenceJSON as any;
    console.log(
      `  ${char.character} (${char.meaning}) - ` +
      `${evidence?.negativeCategory || 'unknown'} [${evidence?.negativeSeverity || 'unknown'}]`
    );
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Step 2: Validation & Audit Trail**

```typescript
// scripts/etl/91_validate_negative_characters.ts

async function validateNegativeCharacters() {
  console.log('🔍 Validating negative character classifications...\n');

  // Get all negative characters
  const negativeChars = await prisma.hanjaDict.findMany({
    where: { isGoodForNaming: false }
  });

  console.log(`📊 Total negative characters: ${negativeChars.length}`);

  // Group by severity
  const bySeverity = negativeChars.reduce((acc, char) => {
    const evidence = char.evidenceJSON as any;
    const severity = evidence?.negativeSeverity || 'unknown';
    if (!acc[severity]) acc[severity] = [];
    acc[severity].push(char);
    return acc;
  }, {} as Record<string, typeof negativeChars>);

  console.log('\n📋 Distribution by Severity:');
  for (const [severity, chars] of Object.entries(bySeverity)) {
    console.log(`  ${severity}: ${chars.length} characters`);
  }

  // Check for common names that might be affected
  const commonButNegative = negativeChars.filter(char =>
    (char.usageFrequency || 0) > 1000
  );

  if (commonButNegative.length > 0) {
    console.log('\n⚠️  Warning: These negative characters have high usage:');
    commonButNegative.forEach(char => {
      console.log(
        `  ${char.character} (${char.meaning}) - ` +
        `usage: ${char.usageFrequency}`
      );
    });
    console.log('  → Manual review recommended');
  }

  // Generate audit report
  const report = {
    timestamp: new Date().toISOString(),
    totalNegative: negativeChars.length,
    bySeverity: Object.entries(bySeverity).map(([severity, chars]) => ({
      severity,
      count: chars.length,
      examples: chars.slice(0, 5).map(c => c.character)
    })),
    highUsageNegative: commonButNegative.map(c => ({
      character: c.character,
      meaning: c.meaning,
      usage: c.usageFrequency
    }))
  };

  await fs.writeFile(
    'data/negative-characters/validation-report.json',
    JSON.stringify(report, null, 2)
  );

  console.log('\n✅ Validation complete. Report saved.');
}
```

### 3.4 Testing Strategy

```typescript
// scripts/etl/__tests__/negative-filtering.test.ts

describe('Negative Character Filtering', () => {
  it('should mark all critical severity characters as unsuitable', async () => {
    const critical = await prisma.hanjaDict.findMany({
      where: {
        evidenceJSON: {
          path: ['negativeSeverity'],
          equals: 'critical'
        }
      }
    });

    expect(critical.every(c => !c.isGoodForNaming)).toBe(true);
  });

  it('should have at least 150 negative characters', async () => {
    const count = await prisma.hanjaDict.count({
      where: { isGoodForNaming: false }
    });

    expect(count).toBeGreaterThanOrEqual(150);
  });

  it('should not filter positive characters like 龍, 鳳, 福', () => {
    const positiveChars = ['龍', '鳳', '福', '壽', '喜', '吉'];

    for (const char of positiveChars) {
      const result = await prisma.hanjaDict.findUnique({
        where: { character: char }
      });
      expect(result?.isGoodForNaming).toBe(true);
    }
  });
});
```

### 3.5 Timeline & Effort Estimation

| Task | Effort | Duration | Dependencies |
|------|--------|----------|--------------|
| Negative character research | 1 day | Week 4 | None |
| Category definition | 0.5 days | Week 4 | Research |
| Implementation script | 0.5 days | Week 4 | Categories |
| Database update | 0.5 days | Week 4 | Implementation |
| Validation & testing | 1 day | Week 4 | Database update |
| Manual review | 1 day | Week 4 | Validation |
| **Total** | **4.5 days** | **1 week** | |

---

## 📋 Integrated Implementation Timeline

### Week 1: Gender Classification Foundation
- **Days 1-2**: Data collection (newborn stats, cultural sources)
- **Days 3-4**: Tier 1 manual curation + classification algorithm
- **Days 5-6**: Implementation scripts + initial testing
- **Day 7**: Database update (gender field)

### Week 2: Gender Classification Completion + Popularity Start
- **Days 1-2**: Gender classification validation + refinement
- **Days 3-4**: Newborn name statistics collection (2024)
- **Days 5-6**: Popularity scoring algorithm development
- **Day 7**: Initial popularity data processing

### Week 3: Popularity Scoring Completion
- **Days 1-2**: Character frequency calculation + normalization
- **Days 3-4**: Database update (nameFrequency field)
- **Days 5-6**: API integration + repository updates
- **Day 7**: Testing & validation

### Week 4: Negative Filtering + Final Integration
- **Days 1-2**: Negative character research + categorization
- **Days 3-4**: Database update (isGoodForNaming expansion)
- **Days 5-6**: Comprehensive testing + validation
- **Day 7**: Final integration testing + documentation

---

## 🧪 Comprehensive Testing Strategy

### Unit Tests
```typescript
// scripts/etl/__tests__/data-enhancement.test.ts

describe('Gender Classification', () => {
  test('Tier 1 explicit classification', () => {});
  test('Tier 2 statistical classification', () => {});
  test('Tier 3 neutral classification', () => {});
  test('Edge cases handling', () => {});
});

describe('Popularity Scoring', () => {
  test('Frequency calculation accuracy', () => {});
  test('Score normalization (0-10000 range)', () => {});
  test('Default value assignment', () => {});
  test('Batch update performance', () => {});
});

describe('Negative Filtering', () => {
  test('Category completeness', () => {});
  test('Severity classification', () => {});
  test('No false positives (good characters)', () => {});
  test('Metadata preservation', () => {});
});
```

### Integration Tests
```typescript
describe('End-to-End Data Enhancement', () => {
  it('should complete all 8,787 character updates', async () => {
    const stats = await prisma.hanjaDict.aggregate({
      _count: true,
      where: {
        AND: [
          { gender: { not: null } },
          { nameFrequency: { gt: 0 } }
        ]
      }
    });

    expect(stats._count).toBe(8787);
  });

  it('should respect filtering in API queries', async () => {
    const repo = new HanjaRepository(prisma);
    const results = await repo.findMany({
      element: 'FIRE',
      gender: 'male',
      sortBy: 'popularity',
      take: 10
    });

    // All should be male-preferred and good for naming
    expect(results.data.every(c => c.gender === 'male')).toBe(true);
    expect(results.data.every(c => c.isGoodForNaming)).toBe(true);

    // Should be sorted by popularity
    for (let i = 1; i < results.data.length; i++) {
      expect(results.data[i-1].nameFrequency).toBeGreaterThanOrEqual(
        results.data[i].nameFrequency
      );
    }
  });
});
```

### Performance Tests
```typescript
describe('Performance Benchmarks', () => {
  it('should update 8,787 records in < 5 seconds', async () => {
    const start = Date.now();
    await updateAllCharacterData();
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000);
  });

  it('should handle concurrent API requests efficiently', async () => {
    const requests = Array(100).fill(null).map(() =>
      repo.findMany({ gender: 'male', take: 20 })
    );

    const start = Date.now();
    await Promise.all(requests);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(2000); // 100 requests in < 2s
  });
});
```

---

## 🚨 Risk Assessment & Mitigation

### High-Priority Risks

**Risk 1: Data Source Unavailability**
- **Probability**: Medium (30%)
- **Impact**: High (blocks Phase 2)
- **Mitigation**:
  - Prepare manual dataset fallback
  - Multiple data source options
  - Start with partial data (top 500 names)

**Risk 2: Classification Accuracy**
- **Probability**: Medium (40%)
- **Impact**: Medium (affects quality)
- **Mitigation**:
  - 10% manual validation sampling
  - Community feedback mechanism
  - Iterative refinement process

**Risk 3: Performance Degradation**
- **Probability**: Low (10%)
- **Impact**: Medium (user experience)
- **Mitigation**:
  - Database indexing optimization
  - Query performance testing
  - Caching strategy

### Medium-Priority Risks

**Risk 4: Cultural Sensitivity**
- **Probability**: Low (15%)
- **Impact**: High (brand reputation)
- **Mitigation**:
  - Expert review of negative characters
  - User feedback collection
  - Clear documentation of methodology

**Risk 5: Maintenance Burden**
- **Probability**: Medium (30%)
- **Impact**: Low (technical debt)
- **Mitigation**:
  - Comprehensive documentation
  - Automated testing suite
  - Clear update procedures

---

## 📊 Success Metrics & KPIs

### Quantitative Metrics

**Data Completeness**:
- Gender classification: 0.27% → 100% ✅
- Name frequency: 0% → 100% ✅
- Negative filtering: 0.59% → 2-3% ✅

**Recommendation Quality**:
- Gender-appropriate suggestions: 0% → 90%+
- Popularity relevance score: N/A → 8/10 (user rating)
- Negative character avoidance: 99.41% → 97-98% (more strict)

**Performance**:
- API response time: < 200ms (p95)
- Database query time: < 50ms (gender+popularity filter)
- Bulk update time: < 10 seconds (8,787 characters)

### Qualitative Metrics

**User Satisfaction**:
- "Relevant name suggestions" rating: Target 8.5/10
- "Trust in recommendations" rating: Target 9/10
- Feature usage increase: +40% for gender filtering

**Professional Quality**:
- Expert review score: Target 85%+ accuracy
- Competitive parity: Match/exceed naming services
- Cultural appropriateness: Zero critical incidents

---

## 🔧 Database Schema Review

### Current Schema (No Changes Needed)
```prisma
model HanjaDict {
  // ... existing fields

  gender           String?      // ✅ Ready for use
  nameFrequency    Int?         @default(0) @map("name_frequency") // ✅ Ready
  isGoodForNaming  Boolean      @default(true) @map("is_good_for_naming") // ✅ Ready
  evidenceJSON     Json?        @map("evidence_json") // ✅ For metadata

  @@index([gender])          // ✅ Already optimized
  @@index([nameFrequency])   // ✅ Already optimized
  @@index([element, isGoodForNaming]) // ✅ Composite index ready
}
```

**No Schema Migration Required** - all fields already exist!

---

## 📝 Implementation Checklist

### Phase 1: Gender Classification
- [ ] Collect 2024 newborn name statistics
- [ ] Create Tier 1 explicit gender list (200 characters)
- [ ] Develop classification algorithm
- [ ] Implement `85_classify_gender.ts`
- [ ] Validate classification accuracy (10% sample)
- [ ] Update database gender field (8,787 characters)
- [ ] Create validation report
- [ ] Update API to use gender filtering

### Phase 2: Popularity Scoring
- [ ] Obtain 2024 Korean newborn name dataset
- [ ] Calculate character frequencies
- [ ] Develop scoring algorithm (0-10000 scale)
- [ ] Implement `88_collect_newborn_stats.ts`
- [ ] Implement `89_update_name_frequency.ts`
- [ ] Update database nameFrequency field
- [ ] Modify HanjaRepository default sort order
- [ ] Test popularity-based queries

### Phase 3: Negative Filtering
- [ ] Research comprehensive negative character list
- [ ] Categorize by severity (critical/high/medium/low)
- [ ] Implement `90_expand_negative_characters.ts`
- [ ] Update isGoodForNaming field (150-200 characters)
- [ ] Store metadata in evidenceJSON
- [ ] Manual review of high-usage negative characters
- [ ] Create validation report
- [ ] Test filtering in API queries

### Integration & Testing
- [ ] Run comprehensive unit tests
- [ ] Run integration tests
- [ ] Performance benchmarking
- [ ] User acceptance testing
- [ ] Documentation updates
- [ ] Deployment plan review

---

## 🎓 Learning Resources & References

### Korean Naming Culture
- 행정안전부 신생아 이름 통계: https://www.mois.go.kr
- 통계청 인구동향조사: https://kostat.go.kr
- 대법원 인명용 한자표: https://www.scourt.go.kr

### Technical Resources
- Prisma Batch Operations: https://www.prisma.io/docs/concepts/components/prisma-client/transactions
- TypeScript Best Practices: https://www.typescriptlang.org/docs/handbook/
- Database Indexing Optimization: PostgreSQL performance tuning guides

### Cultural Sensitivity
- Korean Name Conventions: Academic papers on Korean anthroponomy
- Gender Stereotypes Awareness: Modern Korean naming trends research
- Cultural Appropriateness: Consult with Korean linguistics experts

---

## 📞 Support & Review Process

### Code Review Requirements
- All scripts must pass TypeScript strict mode
- Unit test coverage > 80%
- Manual validation for gender classification (10% sample)
- Performance benchmarks documented

### Expert Review (Optional)
- Korean linguistics expert: Gender classification accuracy
- Naming service professional: Negative character completeness
- Database performance expert: Query optimization review

### Deployment Approval Gates
1. All tests passing ✅
2. Performance benchmarks met ✅
3. Manual validation complete ✅
4. Documentation updated ✅
5. Rollback plan prepared ✅

---

**Document Version**: 1.0
**Author**: Claude Code Analysis
**Date**: October 17, 2025
**Status**: Ready for Implementation
