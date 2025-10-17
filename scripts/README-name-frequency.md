# Name Frequency Scoring Script - Quick Start

## Quick Run

```bash
# Run the script
npx tsx scripts/update-name-frequency.ts
```

## What It Does

Updates `nameFrequency` field (0-100) for all 8,787 hanja characters based on 2024 Korean baby name statistics.

## Scoring System

| Score | Meaning | Example |
|-------|---------|---------|
| 100 | TOP 10 names | 俊(준), 書(서), 雅(아) |
| 90 | TOP 50 names | 采(채), 珉(민), 浩(호) |
| 70 | TOP 100 names | 秀(수), 賢(현), 英(영) |
| 50 | Frequently used | 仁(인), 義(의), 禮(예) |
| 30 | Occasionally used | 鳳(봉), 龍(용), 梅(매) |
| 0 | Rarely/never used | ~7,957 characters |

## Expected Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 한자 작명 인기도 점수 업데이트 시작...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  TOP 10 이름 분석 (점수 100 - 매우 인기 많음)
   🔍 총 20개 고유 음절 분석 중...
   ✅ 35개 한자 발견
   📊 35개 한자 업데이트 시작...
   🎯 점수: 100
   ✅ 완료: 35/35개 업데이트 | 1250 records/sec | 0.1s 경과

2️⃣  TOP 11-50 이름 분석 (점수 90 - 인기 많음)
   ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 최종 통계
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔥 100점 (매우 인기 많음 (TOP 10)): 35개 (0.40%)
⭐ 90점 (인기 많음 (TOP 50)): 85개 (0.97%)
✨ 70점 (인기 있음 (TOP 100)): 125개 (1.42%)
💫 50점 (보통 (자주 사용)): 195개 (2.22%)
🌟 30점 (가끔 사용): 95개 (1.08%)
❌ 0점 (현대 작명 미사용): 8252개 (93.91%)

✅ 모든 한자 점수 업데이트 완료!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 작명 인기도 점수 시스템 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Verify Results

```bash
# Check distribution
npx prisma studio

# Or SQL query
psql $DATABASE_URL -c "
SELECT
  name_frequency,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM hanja_dict), 2) as pct
FROM hanja_dict
GROUP BY name_frequency
ORDER BY name_frequency DESC;
"
```

## Data Sources

- **Primary**: 대한민국 법원 전자가족관계등록시스템 (2024 birth registration data)
- **Secondary**: namechart.kr, baby-name.kr

## Performance

- **Execution Time**: ~2-5 minutes
- **Updates**: 8,787 records
- **Method**: Batch updates via Prisma `updateMany`
- **Type Safety**: Full TypeScript with no 'any' types

## Related Scripts

- `scripts/classify-gender-comprehensive.ts` - Gender classification (similar pattern)
- See `claudedocs/name-frequency-scoring-system.md` for detailed documentation

## Troubleshooting

### Issue: "Cannot find module '@prisma/client'"
```bash
npm install
npx prisma generate
```

### Issue: "Database connection failed"
```bash
# Check .env file
cat .env | grep DATABASE_URL

# Test connection
npx prisma db pull
```

### Issue: "Some characters not found in database"
This is normal - the script reports characters in name data that aren't in your hanja dictionary. These warnings are informational only.

## Future Improvements

1. **Expand to TOP 500**: More comprehensive name coverage
2. **Multi-year tracking**: 2023, 2022 data for trend analysis
3. **Regional analysis**: Seoul/Busan/Gyeonggi preferences
4. **Weighted scoring**: Frequency-based weighting instead of tier-based
