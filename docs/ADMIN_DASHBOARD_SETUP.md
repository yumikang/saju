# Admin Dashboard 설정 가이드

## 1. OAuth 애플리케이션 설정

### Google OAuth 설정
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "APIs & Services" → "Credentials" 이동
4. "Create Credentials" → "OAuth client ID" 선택
5. Application type: "Web application"
6. Authorized redirect URIs 추가:
   - `http://localhost:3001/auth/google/callback` (개발)
   - `https://yourdomain.com/auth/google/callback` (프로덕션)
7. Client ID와 Client Secret 복사

### Kakao OAuth 설정
1. [Kakao Developers](https://developers.kakao.com/) 접속
2. "내 애플리케이션" → "애플리케이션 추가하기"
3. 앱 생성 후 "앱 설정" → "앱 키" 에서 REST API 키 확인
4. "앱 설정" → "플랫폼" → "Web" 추가
   - 사이트 도메인: `http://localhost:3001` (개발)
5. "제품 설정" → "카카오 로그인" 활성화
6. Redirect URI 등록:
   - `http://localhost:3001/auth/kakao/callback`
7. "동의항목" 에서 필요한 정보 설정 (이메일 필수)

### Naver OAuth 설정
1. [Naver Developers](https://developers.naver.com/apps/#/register) 접속
2. "애플리케이션 등록"
3. 사용 API: "네아로(네이버 아이디로 로그인)" 선택
4. 서비스 환경:
   - PC 웹 선택
   - 서비스 URL: `http://localhost:3001`
   - Callback URL: `http://localhost:3001/auth/naver/callback`
5. Client ID와 Client Secret 확인

## 2. 환경변수 설정

`.env` 파일에 다음 추가:

```env
# OAuth - Google
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OAuth - Kakao
KAKAO_CLIENT_ID="your-kakao-rest-api-key"
KAKAO_CLIENT_SECRET="your-kakao-client-secret"

# OAuth - Naver
NAVER_CLIENT_ID="your-naver-client-id"
NAVER_CLIENT_SECRET="your-naver-client-secret"

# App URL (중요!)
APP_URL="http://localhost:3001"  # 개발 환경

# Admin 설정
ADMIN_EMAIL_WHITELIST="your-email@gmail.com,admin@example.com"
ADMIN_DOMAIN_WHITELIST="your-company.com"
AUTO_ADMIN_FIRST_USER="true"  # 첫 번째 가입자를 관리자로 설정

# Session
SESSION_SECRET="your-super-secret-session-key-at-least-32-chars"

# Security
RATE_LIMIT_WINDOW="900000"  # 15분
RATE_LIMIT_MAX_REQUESTS="100"
RATE_LIMIT_LOGIN_MAX="5"
```

## 3. 테스트용 간편 설정 (OAuth 없이)

OAuth 설정 없이 테스트하려면 임시 로그인 라우트를 만들 수 있습니다:

### app/routes/admin.dev-login.tsx (개발용)
```typescript
import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { sessionStorage } from "~/utils/session.server";
import { db } from "~/utils/db.server";

export async function action({ request }: ActionFunctionArgs) {
  // 개발 환경에서만 작동
  if (process.env.NODE_ENV !== "development") {
    throw new Response("Not Found", { status: 404 });
  }

  // 테스트 사용자 생성 또는 조회
  let user = await db.user.findFirst({
    where: { email: "admin@test.com" }
  });

  if (!user) {
    user = await db.user.create({
      data: {
        email: "admin@test.com",
        name: "Test Admin",
        role: "ADMIN",
        status: "ACTIVE",
        emailVerified: true,
      }
    });
  }

  // 세션 생성
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  session.set("userId", user.id);
  
  return redirect("/admin", {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export default function DevLogin() {
  if (process.env.NODE_ENV !== "development") {
    return <div>Not Found</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">개발용 빠른 로그인</h1>
        <Form method="post">
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            테스트 Admin으로 로그인
          </button>
        </Form>
      </div>
    </div>
  );
}
```

## 4. Admin 대시보드 페이지 구조

로그인 후 접근 가능한 페이지들:

- `/admin` - 메인 대시보드 (통계, 최근 활동)
- `/admin/users` - 사용자 관리
- `/admin/audit` - 감사 로그
- `/admin/metrics` - 시스템 메트릭
- `/admin/account-link` - 계정 연결 관리
- `/admin/hanja` - 한자 데이터 관리 (아직 미구현)

## 5. 모니터링 도구

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (기본 로그인: admin/admin)

## 6. 보안 기능

- **Rate Limiting**: 로그인 시도 5회 제한 (15분)
- **Session Security**: IP/UA 기반 핑거프린팅
- **Account Linking**: 동일 이메일로 여러 소셜 계정 연결
- **Audit Logging**: 모든 관리 작업 추적
- **RBAC**: Admin/Operator/Viewer 역할 구분

## 문제 해결

### OAuth 리다이렉트 오류
- APP_URL이 올바르게 설정되었는지 확인
- OAuth 제공자의 콜백 URL이 정확한지 확인
- 개발 환경에서는 http://localhost:3001 사용

### 권한 오류 (403 Forbidden)
- ADMIN_EMAIL_WHITELIST에 이메일 추가
- 또는 AUTO_ADMIN_FIRST_USER="true" 설정 후 첫 번째 사용자로 가입

### Rate Limit 오류
- 15분 기다리거나 RATE_LIMIT_LOGIN_MAX 값 증가