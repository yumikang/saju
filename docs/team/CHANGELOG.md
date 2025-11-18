# 변경 이력 (Changelog)

## [2.0.1] - 2025-11-13

### 🎯 주요 개선사항

#### 이름 점수 시스템 강화
- **용신 가중치 증가**: 60%로 상향 조정하여 사주팔자 적합도 극대화
- **점수 분포 개선**: 80-100점 범위로 명확한 품질 차이 표현
- **보너스 시스템**: 음양오행(≥90점) + 발음(≥90점) + 의미(≥80점) 모두 충족 시 +5점 추가

**점수 계산 공식**:
```
기본점수 = (용신 60%) + (음양오행 10%) + (발음 10%) + (의미 10%)
최종점수 = 기본점수 + 보너스(+5점, 조건부)
```

#### 부적절 한자 완전 차단
12개 명시적 부적절 한자를 점수 계산 전 Early Filtering으로 완전 차단:

| 한자 | 의미 | 사유 |
|-----|------|------|
| 愚 | 어리석음 | 부정적 의미 |
| 滯 | 막힘, 정체 | 부정적 의미 |
| 重 | 무거움 | 부담스러운 의미 |
| 尤 | 허물, 원망 | 부정적 의미 |
| 蹲 | 쭈그리다 | 부정적 동작 |
| 薯 | 고구마 | 식물명 부적합 |
| 猶 | 같을 | 비교 의미 부적합 |
| 雖 | 비록 | 접속사 부적합 |
| 猢 | 원숭이 | 동물명 부적합 |
| 鵞 | 거위 | 동물명 부적합 |

**기술적 구현**:
- `app/lib/naming/filters/taboo-rules.ts`: 명시적 차단 목록 관리
- `app/lib/naming/pipeline/naming-pipeline.ts`: Early filtering 로직 (560-576라인)
- 심각도(severity) 무관하게 `matchedCharacter` 필드 존재 시 즉시 차단

#### OAuth 에러 핸들링 개선
소셜 로그인 미설정 시 500 에러 대신 친절한 안내 메시지 표시:

**변경된 파일**:
- `app/routes/auth.user.kakao.tsx`: 환경변수 체크 및 에러 핸들링
- `app/routes/auth.user.google.tsx`: 동일 패턴 적용
- `app/routes/auth.user.naver.tsx`: 동일 패턴 적용
- `app/routes/login.tsx`: 에러 메시지 한글 매핑

**에러 처리 로직**:
```typescript
// 환경변수 체크
if (!process.env.KAKAO_CLIENT_ID || !process.env.KAKAO_CLIENT_SECRET) {
  return redirect(`/login?error=kakao_not_configured&redirectTo=...`);
}

// 인증 실패 시 catch
try {
  return await userAuthenticator.authenticate("kakao", request);
} catch (error) {
  return redirect(`/login?error=oauth_failed&redirectTo=...`);
}
```

**사용자 경험**:
- React Hydration 에러 해결 (#418, #423)
- 500 Internal Server Error → 503 Service Unavailable (설정 누락)
- 한글 안내 메시지: "카카오 로그인이 현재 설정되지 않았습니다. 다른 로그인 방법을 사용해주세요."

### 🚀 프로덕션 배포

**배포 정보**:
- 서버: 141.164.60.51
- 경로: /var/www/saju
- 프로세스: PM2 (saju-naming)
- URL: https://saju-naming.one-q.xyz/

**배포 일시**: 2025-11-13

**배포 내용**:
1. 점수 시스템 개선 (용신 60% 가중치)
2. 부적절 한자 12종 완전 차단
3. OAuth 에러 핸들링 강화

### 🐛 버그 수정

#### 점수 획일화 문제 해결
**문제**: 모든 이름이 88-89점으로 동일하게 나오는 현상
**원인**: 용신 가중치가 낮아(10%) 개별 이름 특성이 반영되지 않음
**해결**: 용신 가중치 60%로 증가 → 사주팔자에 맞는 이름이 명확히 높은 점수 획득

#### 부적절 한자 노출 문제 해결
**문제**: 猶(같을), 雖(비록), 鵞(거위) 등 부적절 한자가 결과에 포함됨
**원인**: Early filtering이 critical/high severity만 차단, medium severity는 통과
**해결**: `matchedCharacter` 필드 존재 여부로 판단하여 severity 무관 완전 차단

#### OAuth 500 에러 해결
**문제**: 프로덕션에서 Kakao 로그인 시도 시 500 에러 및 React 에러 발생
**원인**: OAuth 환경변수 미설정 상태에서 `authenticate()` 호출 시 unhandled error
**해결**: 환경변수 체크 로직 추가 및 try-catch로 에러 핸들링, 한글 안내 메시지 표시

### 📚 문서 개선

- README.md 업데이트 (프로덕션 정보, 주요 기능, 배포 가이드)
- CHANGELOG.md 생성 (변경 이력 상세 기록)
- 프로덕션 배포 절차 문서화
- 12개 부적절 한자 목록 명시

### 🔧 기술적 변경사항

**파일 변경**:
```
Modified:
  app/lib/naming/pipeline/naming-pipeline.ts (L560-576)
  app/lib/naming/filters/taboo-rules.ts (L117-130)
  app/routes/auth.user.kakao.tsx (전체)
  app/routes/auth.user.google.tsx (전체)
  app/routes/auth.user.naver.tsx (전체)
  app/routes/login.tsx (L7-42)
  README.md (전체 업데이트)

Added:
  CHANGELOG.md (신규)
```

**Git 커밋**:
- `fix: 부적절 한자 완전 차단 - 명시적 taboo 한자 severity 무관 필터링`
- `feat: OAuth 에러 핸들링 개선 - 500 에러 방지 및 한글 안내 메시지`
- `docs: 팀 협업을 위한 문서 업데이트`

### ⚠️ 알려진 이슈

1. **OAuth 미설정**: 프로덕션 환경에서 소셜 로그인 환경변수가 설정되지 않아 실제 로그인 불가 (에러 핸들링은 완료)
2. **데이터베이스 품질**: 기존 DB에 여전히 부적절 한자가 `isGoodForNaming: true`로 표시되어 있음 (현재는 블랙리스트 방식으로 대응 중)

### 📈 다음 버전 계획

- [ ] OAuth 환경변수 프로덕션 설정
- [ ] 데이터베이스 한자 품질 개선 (화이트리스트 방식 검토)
- [ ] 성씨 보호 마이그레이션 적용 검증
- [ ] 추가 부적절 한자 발견 시 블랙리스트 확장

---

## [2.0.0] - 2025-11-XX

### 초기 릴리스
- 사주팔자 기반 작명 시스템
- 실시간 Socket.IO 처리
- Redis 대기열 시스템
- 프리미엄/개명 서비스
- TossPayments 결제 연동
