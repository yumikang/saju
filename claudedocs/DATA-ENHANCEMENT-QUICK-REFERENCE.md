# 한자 데이터베이스 확장 - Quick Reference Guide

## 🎯 프로젝트 목표
**189 → 3,000+ 사용 가능 한자 (7일 스프린트)**

---

## 📊 현재 상황 (2025-10-30)
```
총 한자: 8,787개
├─ 사용 가능 (isGoodForNaming=true): 189개 (2.2%) ⚠️
├─ nameFrequency > 0: 2,670개 (30.4%)
├─ strokes/element 완료: 8,787개 (100%) ✅
└─ 🚨 18개 핵심 성씨가 nameFrequency=0으로 필터링 위험
```

---

## 📅 일일 실행 계획

### Day 1 (Today): Emergency Fixes 🔴
**목표**: 300개 성씨 100% 보호
**예상 시간**: 4-6 시간

```bash
# Morning (3 hours)
npx tsx scripts/etl/analyze-surnames.ts           # 30min
npx tsx scripts/etl/protect-surnames.ts            # 1hr
npx tsx scripts/etl/verify-surname-protection.ts   # 30min
npx tsx scripts/qa/data-quality-report.ts          # 30min

# Afternoon (2-3 hours)
# Review and update isGoodForNaming logic
# Add database constraint (isSurname field)
npx prisma migrate dev --name protect_surnames     # 30min

# Setup monitoring
npx tsx scripts/monitoring/daily-quality-check.ts  # 1hr
crontab -e  # Setup daily cron job                 # 30min
```

**Success Criteria**:
- ✅ 300 surnames protected
- ✅ Database constraint added
- ✅ Monitoring system active

---

### Day 2: Quick Wins Phase 1 🟡
**목표**: Identify and prepare top 500 characters
**예상 시간**: 8 hours

```bash
# Morning (4 hours)
npx tsx scripts/etl/analyze-popularity-distribution.ts  # 1hr
# Download and process Unihan database                  # 2hrs
npx tsx scripts/etl/preprocess-unihan.ts                # 1hr

# Afternoon (4 hours)
# Create reference data files                           # 3hrs
# Build ElementLookupService                            # 1hr
```

**Success Criteria**:
- ✅ Top 500 characters identified
- ✅ Unihan database integrated
- ✅ Element lookup service ready

---

### Day 3: Quick Wins Phase 2 🟡
**목표**: Process top 500 → 700+ usable characters
**예상 시간**: 8-10 hours

```bash
# Morning (4-5 hours)
npx tsx scripts/etl/enhance-top-500.ts --dry-run   # 2hrs
# Review dry-run results                            # 1hr
npx tsx scripts/etl/enhance-top-500.ts             # 1-2hrs

# Afternoon (4-5 hours)
npx tsx scripts/qa/validate-enhanced-characters.ts # 2hrs
# Manual review of samples                          # 2hrs
npx tsx scripts/qa/data-quality-report.ts          # 30min
```

**Success Criteria**:
- ✅ 500 characters processed
- ✅ 700+ usable characters achieved
- ✅ 85%+ inference accuracy

---

### Day 4: Bulk Enhancement Start 🟢
**목표**: Categorize and start Band 1-2
**예상 시간**: 8-10 hours

```bash
# Morning (4 hours)
npx tsx scripts/etl/categorize-remaining.ts        # 2hrs
npx tsx scripts/etl/process-band1.ts               # 2hrs

# Afternoon (4-6 hours)
npx tsx scripts/etl/process-band2.ts               # 4-6hrs
```

**Success Criteria**:
- ✅ Band 1 (200 chars) complete
- ✅ Band 2 (500 chars) 50%+ complete

---

### Day 5: Bulk Enhancement Continue 🟢
**목표**: Complete Band 2-3
**예상 시간**: 8-10 hours

```bash
# Full Day
npx tsx scripts/etl/process-band2.ts --continue    # 2-3hrs
npx tsx scripts/etl/process-band3.ts               # 6-7hrs
```

**Success Criteria**:
- ✅ Band 2 complete (500 chars)
- ✅ Band 3 50%+ complete (900+ chars)

---

### Day 6: Bulk Enhancement Finish 🟢
**목표**: Complete Band 3 and apply Laplace smoothing
**예상 시간**: 8-10 hours

```bash
# Morning (4-5 hours)
npx tsx scripts/etl/process-band3.ts --continue    # 4-5hrs

# Afternoon (4-5 hours)
npx tsx scripts/etl/apply-laplace-smoothing.ts     # 2-3hrs
npx tsx scripts/qa/comprehensive-validation.ts     # 2hrs
```

**Success Criteria**:
- ✅ Band 3 complete (1,800 chars)
- ✅ Laplace smoothing applied
- ✅ 2,500+ usable characters

---

### Day 7: Validation & Completion 🎯
**목표**: Final validation and project completion
**예상 시간**: 6-8 hours

```bash
# Morning (3-4 hours)
npx tsx scripts/qa/comprehensive-validation.ts     # 1hr
npx tsx scripts/etl/fix-validation-errors.ts       # 2-3hrs (if needed)

# Afternoon (3-4 hours)
npx tsx scripts/qa/data-quality-report.ts          # 30min
# Generate final reports                            # 1-2hrs
# Stakeholder presentation                          # 1-2hrs
```

**Success Criteria**:
- ✅ 3,000+ usable characters
- ✅ 95%+ quality score (A grade)
- ✅ Project complete

---

## 🛠️ Key Scripts Reference

### Analysis Scripts
```bash
# Current state analysis
npx tsx scripts/qa/data-quality-report.ts

# Surname status check
npx tsx scripts/etl/analyze-surnames.ts

# Popularity distribution
npx tsx scripts/etl/analyze-popularity-distribution.ts

# Categorize remaining characters
npx tsx scripts/etl/categorize-remaining.ts
```

### Protection Scripts
```bash
# Protect all Korean surnames
npx tsx scripts/etl/protect-surnames.ts

# Verify protection
npx tsx scripts/etl/verify-surname-protection.ts

# Daily monitoring
npx tsx scripts/monitoring/daily-quality-check.ts
```

### Enhancement Scripts
```bash
# Preprocess Unihan data
npx tsx scripts/etl/preprocess-unihan.ts

# Process top 500 characters
npx tsx scripts/etl/enhance-top-500.ts [--dry-run]

# Process by frequency bands
npx tsx scripts/etl/process-band1.ts  # 50-100
npx tsx scripts/etl/process-band2.ts  # 20-50
npx tsx scripts/etl/process-band3.ts  # 1-20

# Apply Laplace smoothing
npx tsx scripts/etl/apply-laplace-smoothing.ts
```

### Validation Scripts
```bash
# Validate enhanced characters
npx tsx scripts/qa/validate-enhanced-characters.ts

# Comprehensive validation
npx tsx scripts/qa/comprehensive-validation.ts

# Fix validation errors
npx tsx scripts/etl/fix-validation-errors.ts
```

---

## 🎓 Quick Tips

### Performance Optimization
```typescript
// Use batch processing
const BATCH_SIZE = 100;
for (let i = 0; i < total; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  await processBatch(batch);
}

// Use parallel processing for independent tasks
await Promise.all([
  processTask1(),
  processTask2(),
  processTask3()
]);

// Use worker threads for CPU-intensive tasks
import { Worker } from 'worker_threads';
```

### Error Handling
```typescript
// Always use try-catch in scripts
try {
  await processCharacters();
} catch (error) {
  console.error('Error:', error);
  // Log to file for debugging
  await fs.appendFile('logs/errors.log', `${error}\n`);
}

// Always disconnect Prisma
.finally(() => prisma.$disconnect());
```

### Backup Strategy
```bash
# Before major operations, always backup
pg_dump $DATABASE_URL > backups/before-$(date +%Y%m%d-%H%M%S).sql

# Keep backups for rollback
# Day 1: before-surname-protection.sql
# Day 2: before-top-500.sql
# Day 3: before-bulk-enhancement.sql
```

---

## 📈 Progress Tracking

### Daily Checklist
```
Day 1: Emergency Fixes
[ ] Surnames protected (300/300)
[ ] Database constraint added
[ ] Monitoring system active
[ ] Quality report shows 0 surname issues

Day 2-3: Quick Wins
[ ] Top 500 identified
[ ] Unihan integrated
[ ] Element lookup working
[ ] 700+ usable characters achieved

Day 4-6: Bulk Enhancement
[ ] Band 1 complete (200 chars)
[ ] Band 2 complete (500 chars)
[ ] Band 3 complete (1,800 chars)
[ ] Laplace smoothing applied
[ ] 2,500+ usable characters

Day 7: Validation
[ ] Comprehensive validation passed
[ ] 3,000+ usable characters
[ ] 95%+ quality score
[ ] Final reports generated
[ ] Project complete
```

### Key Metrics to Track
```typescript
// Run this daily to track progress
const metrics = {
  totalCharacters: await prisma.hanjaDict.count(),

  usableCharacters: await prisma.hanjaDict.count({
    where: {
      isGoodForNaming: true,
      nameFrequency: { gte: 1 }
    }
  }),

  surnamesProtected: await prisma.hanjaDict.count({
    where: {
      isSurname: true,
      isGoodForNaming: true
    }
  }),

  completeRecords: await prisma.hanjaDict.count({
    where: {
      AND: [
        { strokes: { not: null } },
        { element: { not: null } },
        { koreanReading: { not: null } }
      ]
    }
  })
};

const usablePercentage = (metrics.usableCharacters / metrics.totalCharacters) * 100;
console.log(`Progress: ${usablePercentage.toFixed(1)}% (Target: 35%+)`);
```

---

## 🚨 Troubleshooting

### Issue: Script fails with "Out of Memory"
**Solution**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npx tsx script.ts

# Or reduce batch size in script
const BATCH_SIZE = 50;  // Instead of 100
```

### Issue: Prisma connection timeout
**Solution**:
```typescript
// Increase connection pool size
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['error', 'warn']
});

// Add connection retry logic
let retries = 3;
while (retries > 0) {
  try {
    await prisma.$connect();
    break;
  } catch (error) {
    retries--;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

### Issue: Element inference accuracy low
**Solution**:
1. Check radical mappings are correct
2. Add more entries to reference data
3. Lower confidence threshold temporarily
4. Flag low-confidence for manual review

### Issue: Validation fails
**Solution**:
```bash
# Identify failed characters
npx tsx scripts/qa/comprehensive-validation.ts > validation-results.json

# Review errors
cat validation-results.json | grep -A 5 "failed"

# Fix specific issues
npx tsx scripts/etl/fix-validation-errors.ts --characters "賢,秀,美"
```

---

## 📞 Support

### Quick Questions
- Check `/claudedocs/DATA-ENHANCEMENT-DETAILED-PLAN.md` for full details
- Review existing scripts in `/scripts/etl/` for patterns
- Check test files in `/scripts/etl/__tests__/` for examples

### Need Help?
1. Check this Quick Reference first
2. Review detailed plan document
3. Search existing scripts for patterns
4. Contact project team

---

**Quick Reference Version**: 1.0
**Last Updated**: 2025-10-30
**For**: 한자 데이터베이스 확장 프로젝트 (189 → 3,000+)
