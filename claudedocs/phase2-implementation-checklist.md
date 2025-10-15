# Phase 2 Implementation Checklist

## Overview
Implementation guide for Remix API endpoints based on the comprehensive design document.

**Reference**: `phase2-remix-api-design.md`

---

## Pre-Implementation Setup

- [ ] Review Phase 1 components (HanjaMatcher, SajuCalculator, ScoringPipeline)
- [ ] Verify Prisma schema and database connection
- [ ] Check Supabase authentication setup
- [ ] Install required dependencies (if any missing)

```bash
# Verify dependencies
npm list zod @remix-run/node @remix-run/react
```

---

## Step 1: Create Shared Utilities (Foundation)

### 1.1 Validators
- [ ] Create `app/lib/naming/validators.ts`
  - [ ] `AnalyzeRequestSchema`
  - [ ] `RecommendRequestSchema`
  - [ ] `CharacterParamsSchema`
  - [ ] `validateRequest` helper function

**File**: See Section 4.2.1 in design doc

### 1.2 Error Handling
- [ ] Create `app/lib/naming/errors.ts`
  - [ ] `ErrorCode` enum
  - [ ] Error type interfaces
  - [ ] Error factory functions
  - [ ] `handleApiError` middleware

**File**: See Section 4.2.2 in design doc

### 1.3 API Handlers
- [ ] Create `app/lib/naming/api-handlers.ts`
  - [ ] `handleAnalyzeRequest`
  - [ ] `handleRecommendRequest`
  - [ ] `handleCharacterRequest`
  - [ ] Helper functions (element conversions, etc.)

**File**: See Section 4.2.3 in design doc

**Test**: Run `npm test app/lib/naming/__tests__/validators.test.ts`

---

## Step 2: Create Repository Layer

### 2.1 Saju Repository
- [ ] Create `app/repositories/saju.repository.ts`
  - [ ] `create` method
  - [ ] `findById` method
  - [ ] `findByUserId` method

**File**: See Section 8.2 in design doc

### 2.2 Hanja Repository
- [ ] Create `app/repositories/hanja.repository.ts`
  - [ ] `findById` method
  - [ ] `findByCharacter` method
  - [ ] `findRelatedCharacters` method

**File**: See Section 8.2 in design doc

### 2.3 Update db.server.ts
- [ ] Add repository factory functions to `app/lib/db.server.ts`
  - [ ] Import new repository classes
  - [ ] Export `getSajuRepository()`
  - [ ] Export `getHanjaRepository()`

**Test**: Verify repository integration

---

## Step 3: Implement Resource Routes

### 3.1 POST /api/naming/analyze
- [ ] Create `app/routes/api.naming.analyze.ts`
  - [ ] Import dependencies
  - [ ] Implement `action` function
  - [ ] Implement `loader` function (405 handler)
  - [ ] Add error handling
  - [ ] Add performance logging

**File**: See Section 8.1 in design doc
**Performance Target**: 50-150ms

**Test**:
```bash
curl -X POST http://localhost:3000/api/naming/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "birthDate": "1990-05-15",
    "birthTime": "14:30",
    "isLunar": false,
    "gender": "M"
  }'
```

### 3.2 POST /api/naming/recommend
- [ ] Create `app/routes/api.naming.recommend.ts`
  - [ ] Import dependencies
  - [ ] Implement `action` function
  - [ ] Implement `loader` function (405 handler)
  - [ ] Add error handling
  - [ ] Add performance logging

**File**: See Section 8.1 in design doc
**Performance Target**: 2-5 seconds

**Test**:
```bash
curl -X POST http://localhost:3000/api/naming/recommend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "sajuDataId": "<saju-id>",
    "lastName": "김",
    "preferences": {
      "minScore": 70,
      "maxResults": 20
    }
  }'
```

### 3.3 GET /api/naming/character/:id
- [ ] Create `app/routes/api.naming.character.$id.ts`
  - [ ] Import dependencies
  - [ ] Implement `loader` function
  - [ ] Add caching headers
  - [ ] Add error handling

**File**: See Section 8.1 in design doc
**Performance Target**: <50ms

**Test**:
```bash
curl http://localhost:3000/api/naming/character/<character-id> \
  -H "Authorization: Bearer <token>"
```

---

## Step 4: Testing

### 4.1 Unit Tests
- [ ] Create `app/lib/naming/__tests__/validators.test.ts`
  - [ ] Test valid inputs
  - [ ] Test invalid inputs
  - [ ] Test edge cases

- [ ] Create `app/lib/naming/__tests__/api-handlers.test.ts`
  - [ ] Test `handleAnalyzeRequest`
  - [ ] Test `handleRecommendRequest`
  - [ ] Test `handleCharacterRequest`
  - [ ] Test error scenarios

**Run**: `npm test app/lib/naming/__tests__/`

### 4.2 Integration Tests
- [ ] Create `app/routes/__tests__/api.naming.analyze.test.ts`
  - [ ] Test successful requests
  - [ ] Test validation errors
  - [ ] Test authentication errors

- [ ] Create `app/routes/__tests__/api.naming.recommend.test.ts`
  - [ ] Test successful recommendations
  - [ ] Test not found errors
  - [ ] Test insufficient candidates

- [ ] Create `app/routes/__tests__/api.naming.character.$id.test.ts`
  - [ ] Test successful lookups
  - [ ] Test not found errors
  - [ ] Test caching behavior

**Run**: `npm test app/routes/__tests__/`

### 4.3 Performance Tests
- [ ] Create `app/lib/naming/__tests__/performance.test.ts`
  - [ ] Benchmark analyze endpoint (target: <150ms)
  - [ ] Benchmark recommend endpoint (target: <5s)
  - [ ] Benchmark character endpoint (target: <50ms)

**Run**: `npm test app/lib/naming/__tests__/performance.test.ts`

---

## Step 5: Performance Optimization

### 5.1 Database Optimization
- [ ] Verify composite indexes exist
  - [ ] `@@index([element, isGoodForNaming])` on HanjaDict
  - [ ] `@@index([gender])` on HanjaDict
  - [ ] `@@index([nameFrequency])` on HanjaDict
- [ ] Test query performance with EXPLAIN ANALYZE
- [ ] Verify connection pooling configuration

### 5.2 Caching
- [ ] Implement character detail caching
  - [ ] Create LRU cache in `app/lib/cache-config.server.ts`
  - [ ] Add cache integration to `handleCharacterRequest`
- [ ] Optional: Add Redis caching for Saju analysis results
- [ ] Test cache hit/miss rates

### 5.3 Monitoring
- [ ] Add performance logging to all endpoints
- [ ] Set up metrics collection
- [ ] Add alerting for slow requests (>target time)

---

## Step 6: Documentation

### 6.1 API Documentation
- [ ] Create OpenAPI/Swagger spec (optional)
- [ ] Document request/response examples
- [ ] Document error codes and handling

### 6.2 Developer Documentation
- [ ] Update README with API endpoints
- [ ] Document authentication requirements
- [ ] Add troubleshooting guide

---

## Step 7: Deployment Preparation

### 7.1 Environment Configuration
- [ ] Verify environment variables
  - [ ] `DATABASE_URL`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `SUPABASE_ANON_KEY`
- [ ] Test in staging environment

### 7.2 Production Checklist
- [ ] Run full test suite
- [ ] Run performance benchmarks
- [ ] Verify database indexes
- [ ] Test error handling in production mode
- [ ] Set up monitoring and alerting

---

## Verification Checklist

### Functionality
- [ ] Analyze endpoint returns correct Saju data
- [ ] Recommend endpoint generates quality names
- [ ] Character endpoint returns complete details
- [ ] Authentication works correctly
- [ ] Validation catches invalid inputs
- [ ] Errors return proper status codes and messages

### Performance
- [ ] Analyze: ≤150ms (target: 50-150ms)
- [ ] Recommend: ≤5s (target: 2-5s)
- [ ] Character: ≤50ms (target: <50ms)
- [ ] Database queries use indexes
- [ ] No N+1 query problems

### Code Quality
- [ ] All TypeScript types defined
- [ ] No `any` types
- [ ] Error handling comprehensive
- [ ] Code follows Remix conventions
- [ ] Tests have good coverage (>80%)

---

## Common Issues and Solutions

### Issue: Authentication fails
**Solution**: Check Supabase configuration and token format

### Issue: Slow recommend endpoint (>5s)
**Solution**:
1. Check database indexes
2. Verify HanjaMatcher early termination
3. Review batch size configuration
4. Check for N+1 queries

### Issue: Validation errors not detailed
**Solution**: Update Zod schema error messages

### Issue: Character cache not working
**Solution**: Verify LRU cache configuration and TTL

---

## File Creation Order

1. **Foundation** (Day 1)
   - `validators.ts`
   - `errors.ts`
   - `api-handlers.ts`

2. **Data Layer** (Day 1-2)
   - `saju.repository.ts`
   - `hanja.repository.ts`
   - Update `db.server.ts`

3. **Routes** (Day 2-3)
   - `api.naming.analyze.ts`
   - `api.naming.recommend.ts`
   - `api.naming.character.$id.ts`

4. **Tests** (Day 3-4)
   - Unit tests
   - Integration tests
   - Performance tests

5. **Optimization** (Day 4-5)
   - Caching
   - Monitoring
   - Performance tuning

---

## Estimated Timeline

- **Day 1**: Foundation + Data Layer (Steps 1-2)
- **Day 2**: Resource Routes (Step 3)
- **Day 3**: Testing (Step 4)
- **Day 4**: Optimization (Step 5)
- **Day 5**: Documentation + Deployment (Steps 6-7)

**Total**: 5 days for complete implementation

---

## Success Criteria

✅ All 3 endpoints implemented and working
✅ All tests passing (unit + integration + performance)
✅ Performance targets met
✅ Error handling comprehensive
✅ Code follows Remix best practices
✅ Documentation complete
✅ Ready for production deployment

---

## Resources

- **Design Doc**: `claudedocs/phase2-remix-api-design.md`
- **Phase 1 Code**: `app/lib/naming/matcher.ts`, `app/lib/saju/calculator.ts`
- **Remix Docs**: https://remix.run/docs/en/main/guides/resource-routes
- **Zod Docs**: https://zod.dev/
