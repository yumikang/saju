# 기술 스택 패턴 가이드 (Tech Stack Patterns Guide)

> 프로젝트 기술 스택의 공식 문서 기반 Best Practice 및 패턴 모음

**생성일**: 2025-10-27
**기술 스택**: Remix v2, TossPayments, Prisma, React 18, TypeScript 5

---

## 📋 목차

1. [Remix Framework v2](#1-remix-framework-v2)
2. [TossPayments API](#2-tosspayments-api)
3. [Prisma ORM](#3-prisma-orm)
4. [React 18](#4-react-18)
5. [TypeScript 5 + Zod](#5-typescript-5--zod)
6. [통합 시나리오 패턴](#6-통합-시나리오-패턴)

---

## 1. Remix Framework v2

### 📚 공식 문서
- **메인**: https://v2.remix.run/docs
- **Loader**: https://v2.remix.run/docs/route/loader
- **Action**: https://v2.remix.run/docs/route/action
- **Form**: https://v2.remix.run/docs/components/form
- **Progressive Enhancement**: https://v2.remix.run/docs/discussion/progressive-enhancement

---

### 1.1 Loader 패턴

#### ✅ 핵심 원칙
```typescript
// ✅ 올바른 패턴: 서버 전용, 타입 세이프
import { json, type LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ params, request }: LoaderFunctionArgs) {
  // 1. 인증 확인
  const userId = await requireUserId(request);

  // 2. 데이터 로드
  const invoice = await db.invoice.findUnique({
    where: { id: params.invoiceId }
  });

  // 3. 존재하지 않으면 404
  if (!invoice) {
    throw json("Not Found", { status: 404 });
  }

  // 4. 권한 확인
  if (invoice.userId !== userId) {
    throw json("Forbidden", { status: 403 });
  }

  // 5. 안전한 데이터만 반환
  return json({
    invoice: {
      id: invoice.id,
      amount: invoice.amount,
      status: invoice.status,
      // ⚠️ 민감 정보 제외 (secretKey, internalNotes 등)
    }
  });
}
```

#### ❌ 안티패턴
```typescript
// ❌ 나쁜 예: 민감한 데이터 노출
export async function loader() {
  const invoice = await db.invoice.findUnique({ ... });
  return json(invoice); // secretKey, API keys 등 모두 노출됨
}

// ❌ 나쁜 예: 에러 처리 없음
export async function loader({ params }: LoaderFunctionArgs) {
  const data = await db.find({ id: params.id });
  return json(data); // null 체크 없음
}

// ❌ 나쁜 예: 권한 확인 없음
export async function loader({ params }: LoaderFunctionArgs) {
  const userPrivateData = await db.user.findUnique({
    where: { id: params.userId }
  });
  return json(userPrivateData); // 누구나 다른 사용자 정보 접근 가능
}
```

#### 🎯 URL 파라미터 & 쿼리 처리
```typescript
export async function loader({ params, request }: LoaderFunctionArgs) {
  // Route: /invoices/$invoiceId
  const invoiceId = params.invoiceId; // ✅ 타입: string

  // Query parameters: /invoices/123?sort=date&filter=paid
  const url = new URL(request.url);
  const sort = url.searchParams.get("sort"); // "date"
  const filter = url.searchParams.get("filter"); // "paid"

  const invoices = await db.invoice.findMany({
    where: { status: filter },
    orderBy: { [sort]: "desc" }
  });

  return json({ invoices });
}
```

#### 🔐 헤더 & 쿠키 접근
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  // 쿠키 읽기
  const cookie = request.headers.get("Cookie");
  const session = await getSession(cookie);

  // 인증 토큰 확인
  const authToken = request.headers.get("Authorization");

  return json({ user: session.user });
}
```

#### 🎨 컴포넌트에서 타입 세이프 사용
```typescript
import { useLoaderData } from "@remix-run/react";

export default function InvoiceRoute() {
  const { invoice } = useLoaderData<typeof loader>();

  // ✅ 타입 추론 자동 적용
  // invoice.id → string
  // invoice.amount → number
  // invoice.status → "pending" | "paid" | "cancelled"

  return (
    <div>
      <h1>Invoice #{invoice.id}</h1>
      <p>Amount: ${invoice.amount}</p>
    </div>
  );
}
```

---

### 1.2 Action 패턴

#### ✅ 핵심 원칙
```typescript
import { redirect, json, type ActionFunctionArgs } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  // 1. Form 데이터 파싱
  const formData = await request.formData();
  const title = formData.get("title");
  const amount = formData.get("amount");

  // 2. 유효성 검증
  const errors = {};
  if (!title || title.length < 3) {
    errors.title = "Title must be at least 3 characters";
  }
  if (!amount || isNaN(Number(amount))) {
    errors.amount = "Amount must be a valid number";
  }

  // 3. 검증 실패 시 에러 반환
  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }

  // 4. 데이터 저장
  const invoice = await db.invoice.create({
    data: {
      title: String(title),
      amount: Number(amount)
    }
  });

  // 5. 성공 후 리다이렉트
  return redirect(`/invoices/${invoice.id}`);
}
```

#### 🎨 Form 컴포넌트 연동
```typescript
import { Form, useActionData, useNavigation } from "@remix-run/react";

export default function NewInvoice() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post">
      <div>
        <label htmlFor="title">Title</label>
        <input
          type="text"
          id="title"
          name="title"
          aria-invalid={actionData?.errors?.title ? true : undefined}
        />
        {actionData?.errors?.title && (
          <p className="error">{actionData.errors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="amount">Amount</label>
        <input
          type="number"
          id="amount"
          name="amount"
          aria-invalid={actionData?.errors?.amount ? true : undefined}
        />
        {actionData?.errors?.amount && (
          <p className="error">{actionData.errors.amount}</p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Invoice"}
      </button>
    </Form>
  );
}
```

#### 🎯 HTTP Method 처리
```typescript
export async function action({ request }: ActionFunctionArgs) {
  const method = request.method;

  switch (method) {
    case "POST":
      // 새 리소스 생성
      return handleCreate(request);

    case "PUT":
    case "PATCH":
      // 리소스 업데이트
      return handleUpdate(request);

    case "DELETE":
      // 리소스 삭제
      return handleDelete(request);

    default:
      throw json({ error: "Method not allowed" }, { status: 405 });
  }
}
```

#### 🔄 Progressive Enhancement
```typescript
// ✅ JavaScript 없이도 작동하는 Form
<Form method="post">
  {/* HTML form이 먼저 작동하고, JS 로드 후 fetch로 업그레이드 */}
  <button type="submit">Submit</button>
</Form>

// ✅ Pending UI (JS 로드 후 활성화)
const navigation = useNavigation();
const isSubmitting = navigation.state === "submitting";

// ✅ Optimistic UI
const fetcher = useFetcher();
const optimisticData = fetcher.formData?.get("data");
```

---

### 1.3 Route 구조 Best Practice

#### 📁 파일 네이밍 (Remix v2 Flat Routes)
```
app/
├── routes/
│   ├── _index.tsx                    # /
│   ├── about.tsx                     # /about
│   ├── account.tsx                   # Layout without route
│   ├── account._index.tsx            # /account
│   ├── account.profile.tsx           # /account/profile
│   ├── account.orders.$orderId.tsx   # /account/orders/123
│   ├── api.payments.webhook.tsx      # /api/payments/webhook (Resource Route)
│   └── _auth.login.tsx               # /login (별도 레이아웃)
```

#### 🎯 Co-location 원칙
```typescript
// ✅ 하나의 파일에 데이터 읽기/쓰기/렌더링 모두 포함
// routes/invoices.$id.tsx

// 데이터 읽기
export async function loader({ params }: LoaderFunctionArgs) {
  return json({ invoice: await getInvoice(params.id) });
}

// 데이터 쓰기
export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  await updateInvoice(params.id, formData);
  return redirect(`/invoices/${params.id}`);
}

// 렌더링
export default function InvoiceRoute() {
  const { invoice } = useLoaderData<typeof loader>();
  return <InvoiceForm invoice={invoice} />;
}

// 에러 처리
export function ErrorBoundary() {
  const error = useRouteError();
  return <div>Error: {error.message}</div>;
}
```

#### 🔧 Resource Routes (API 엔드포인트)
```typescript
// routes/api.payments.webhook.tsx
import { json, type ActionFunctionArgs } from "@remix-run/node";

// ⚠️ default export 없음 = UI 렌더링 안 함 = Resource Route
export async function action({ request }: ActionFunctionArgs) {
  const payload = await request.json();

  // Webhook 처리
  await processPaymentWebhook(payload);

  return json({ success: true }, { status: 200 });
}
```

---

### 1.4 Error Boundary 패턴

```typescript
import { useRouteError, isRouteErrorResponse } from "@remix-run/react";

export function ErrorBoundary() {
  const error = useRouteError();

  // ✅ Response 에러 처리 (throw json(), throw redirect() 등)
  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
      </div>
    );
  }

  // ✅ 일반 에러 처리
  if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <pre>{error.stack}</pre>
      </div>
    );
  }

  // ✅ 알 수 없는 에러
  return <div>Unknown Error</div>;
}
```

---

### ✅ Remix 체크리스트

- [ ] Loader에서 민감한 데이터 노출하지 않기
- [ ] 모든 loader에 권한 확인 로직 추가
- [ ] Form 데이터 검증 후 action 실행
- [ ] 성공 후 redirect() 사용 (PRG 패턴)
- [ ] ErrorBoundary로 모든 에러 처리
- [ ] useLoaderData<typeof loader>로 타입 세이프 보장
- [ ] Progressive Enhancement 고려 (JS 없이도 작동)
- [ ] Resource Routes로 API 엔드포인트 구현
- [ ] Co-location 원칙 준수 (한 파일에 모든 로직)

---

## 2. TossPayments API

### 📚 공식 문서
- **API Guide**: https://docs.tosspayments.com/en/api-guide
- **Integration**: https://docs.tosspayments.com/en/integration
- **Webhooks**: https://docs.tosspayments.com/en/webhooks

---

### 2.1 결제 요청 플로우

#### ✅ 4단계 통합 패턴
```typescript
// Step 1: SDK 초기화 및 결제 요청
// 클라이언트 사이드 (React 컴포넌트)

import { loadTossPayments } from '@tosspayments/payment-sdk';

export default function CheckoutPage() {
  const handlePayment = async () => {
    const tossPayments = await loadTossPayments(clientKey);

    // 결제창 호출
    await tossPayments.requestPayment('CARD', {
      amount: {
        value: 15000,
        currency: 'KRW'
      },
      orderId: generateOrderId(), // 6-64자, 영문/숫자/-/_만 허용
      orderName: '사주 상담 서비스',
      successUrl: `${window.location.origin}/payments/success`,
      failUrl: `${window.location.origin}/payments/fail`,
      customerName: '홍길동',
      customerEmail: 'customer@example.com'
    });
  };

  return <button onClick={handlePayment}>결제하기</button>;
}
```

#### ✅ Step 2: Success URL 처리
```typescript
// routes/payments.success.tsx
import { redirect, type LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  // ✅ 쿼리 파라미터 추출
  const paymentKey = url.searchParams.get("paymentKey");
  const orderId = url.searchParams.get("orderId");
  const amount = url.searchParams.get("amount");

  // ⚠️ 필수 검증: 요청한 금액과 반환된 금액 일치 확인
  const originalOrder = await db.order.findUnique({
    where: { orderId }
  });

  if (Number(amount) !== originalOrder.amount) {
    throw new Error("Amount mismatch - possible tampering");
  }

  // Step 3: 승인 API 호출 (다음 섹션 참고)
  const payment = await confirmPayment({
    paymentKey,
    orderId,
    amount: Number(amount)
  });

  return redirect(`/orders/${orderId}`);
}
```

#### ✅ Step 3: 결제 승인 (Authorization)
```typescript
// lib/payments.server.ts
import { json } from "@remix-run/node";

const SECRET_KEY = process.env.TOSS_PAYMENTS_SECRET_KEY!;

export async function confirmPayment({
  paymentKey,
  orderId,
  amount
}: {
  paymentKey: string;
  orderId: string;
  amount: number;
}) {
  // ✅ Basic Auth 인코딩
  const encodedAuth = Buffer.from(`${SECRET_KEY}:`).toString('base64');

  const response = await fetch(
    'https://api.tosspayments.com/v1/payments/confirm',
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Payment confirmation failed: ${error.message}`);
  }

  const payment = await response.json();

  // ✅ DB 업데이트
  await db.payment.create({
    data: {
      paymentKey: payment.paymentKey,
      orderId: payment.orderId,
      amount: payment.totalAmount,
      status: payment.status,
      method: payment.method,
      approvedAt: new Date(payment.approvedAt)
    }
  });

  return payment;
}
```

#### ❌ 결제 실패 처리
```typescript
// routes/payments.fail.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const message = url.searchParams.get("message");
  const orderId = url.searchParams.get("orderId");

  // ✅ 실패 로그 저장
  await db.paymentFailure.create({
    data: {
      orderId,
      errorCode: code,
      errorMessage: message,
      failedAt: new Date()
    }
  });

  return json({ code, message });
}

// 주요 에러 코드
// PAY_PROCESS_CANCELED - 사용자가 결제 취소
// PAY_PROCESS_ABORTED - 결제 진행 중 중단
// REJECT_CARD_COMPANY - 카드사 승인 거부
```

---

### 2.2 Webhook 검증 패턴

#### ✅ Webhook 엔드포인트 구현
```typescript
// routes/api.webhooks.tosspayments.tsx
import { json, type ActionFunctionArgs } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  // ⚠️ IP 화이트리스트 확인 (선택사항)
  const clientIP = request.headers.get("x-forwarded-for");
  // 토스페이먼츠 IP 검증 로직...

  // ✅ Webhook 페이로드 파싱
  const payload = await request.json();

  const {
    eventType,
    data,
    createdAt
  } = payload;

  // ✅ 이벤트 타입별 처리
  switch (eventType) {
    case "PAYMENT_STATUS_CHANGED":
      await handlePaymentStatusChanged(data);
      break;

    case "DEPOSIT_CALLBACK":
      // 가상계좌 입금 확인
      if (data.secret !== await getPaymentSecret(data.orderId)) {
        throw new Error("Invalid secret - webhook verification failed");
      }
      await handleVirtualAccountDeposit(data);
      break;

    case "CANCEL_STATUS_CHANGED":
      await handleCancellation(data);
      break;

    default:
      console.warn(`Unknown webhook event: ${eventType}`);
  }

  // ⚠️ 필수: 200 응답 반환 (안 하면 최대 7번 재시도)
  return json({ success: true }, { status: 200 });
}

// ✅ 가상계좌 입금 처리
async function handleVirtualAccountDeposit(data: any) {
  const payment = await db.payment.findUnique({
    where: { orderId: data.orderId }
  });

  if (payment.status === "DONE") {
    // 이미 처리됨 (중복 webhook)
    return;
  }

  // 상품 제공 로직
  await fulfillOrder(data.orderId);

  // 상태 업데이트
  await db.payment.update({
    where: { orderId: data.orderId },
    data: {
      status: "DONE",
      depositedAt: new Date()
    }
  });
}
```

#### 🔐 Webhook 보안 Best Practice
```typescript
// ✅ 1. HTTPS 사용 필수
// ✅ 2. IP 화이트리스트 설정
const TOSSPAYMENTS_IPS = [
  // 토스페이먼츠 공식 IP 목록
];

function isValidTossPaymentsRequest(clientIP: string): boolean {
  return TOSSPAYMENTS_IPS.includes(clientIP);
}

// ✅ 3. Secret 검증 (가상계좌)
async function verifyWebhookSecret(orderId: string, secret: string) {
  const payment = await db.payment.findUnique({
    where: { orderId }
  });

  if (payment.secret !== secret) {
    throw new Error("Webhook verification failed");
  }
}

// ✅ 4. 멱등성 보장 (중복 처리 방지)
async function ensureIdempotency(webhookId: string) {
  const existing = await db.webhookLog.findUnique({
    where: { webhookId }
  });

  if (existing) {
    return false; // 이미 처리됨
  }

  await db.webhookLog.create({
    data: { webhookId, processedAt: new Date() }
  });

  return true; // 처리 진행
}
```

---

### 2.3 샌드박스 테스트

#### 🧪 테스트 환경 설정
```typescript
// .env.development
TOSS_PAYMENTS_CLIENT_KEY=test_ck_xxxxxxxxxx
TOSS_PAYMENTS_SECRET_KEY=test_sk_xxxxxxxxxx

// .env.production
TOSS_PAYMENTS_CLIENT_KEY=live_ck_xxxxxxxxxx
TOSS_PAYMENTS_SECRET_KEY=live_sk_xxxxxxxxxx
```

#### 🧪 테스트 카드 정보
```typescript
// 테스트 결제 성공 케이스
const TEST_CARD = {
  cardNumber: '1234567890123456',
  expiryYear: '25',
  expiryMonth: '12',
  customerIdentityNumber: '123456'
};

// 실패 케이스 테스트
// - 잔액 부족: amount를 999999999로 설정
// - 카드 정지: 특정 테스트 카드 번호 사용
```

---

### ✅ TossPayments 체크리스트

- [ ] 결제 요청 시 orderId 유니크 보장 (6-64자)
- [ ] Success URL에서 금액 일치 검증
- [ ] Secret Key는 서버 사이드에서만 사용
- [ ] Webhook 엔드포인트 200 응답 필수
- [ ] 가상계좌 webhook에 secret 검증 추가
- [ ] 멱등성 보장 (중복 webhook 처리)
- [ ] HTTPS 연결 사용
- [ ] 샌드박스 환경에서 충분한 테스트
- [ ] 에러 코드별 사용자 안내 메시지 준비

---

## 3. Prisma ORM

### 📚 공식 문서
- **Transaction Guide**: https://www.prisma.io/docs/concepts/components/prisma-client/transactions
- **Migration Guide**: https://www.prisma.io/docs/guides/data-migration
- **Type Safety**: https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/use-custom-model-and-field-names

---

### 3.1 Transaction 패턴

#### ✅ Sequential Transaction (순차 실행)
```typescript
// ✅ 배치 트랜잭션 (여러 작업 원자성 보장)
const [payment, order, user] = await prisma.$transaction([
  prisma.payment.create({
    data: { orderId, amount, status: 'PENDING' }
  }),
  prisma.order.update({
    where: { id: orderId },
    data: { paymentId: payment.id }
  }),
  prisma.user.update({
    where: { id: userId },
    data: { lastOrderAt: new Date() }
  })
]);
// ⚠️ 하나라도 실패하면 전체 롤백
```

#### ✅ Interactive Transaction (복잡한 로직)
```typescript
// ✅ 복잡한 비즈니스 로직이 필요한 경우
await prisma.$transaction(async (tx) => {
  // 1. 재고 확인
  const product = await tx.product.findUnique({
    where: { id: productId }
  });

  if (product.stock < quantity) {
    throw new Error("Insufficient stock");
  }

  // 2. 재고 차감
  await tx.product.update({
    where: { id: productId },
    data: { stock: product.stock - quantity }
  });

  // 3. 주문 생성
  const order = await tx.order.create({
    data: {
      userId,
      productId,
      quantity,
      totalAmount: product.price * quantity
    }
  });

  // 4. 포인트 차감 (선택적)
  if (usePoints > 0) {
    await tx.user.update({
      where: { id: userId },
      data: { points: { decrement: usePoints } }
    });
  }

  return order;
}, {
  maxWait: 5000, // 5초 대기
  timeout: 10000, // 10초 타임아웃
  isolationLevel: 'Serializable' // 격리 수준
});
```

#### ❌ 안티패턴
```typescript
// ❌ 나쁜 예: 트랜잭션 없이 순차 실행
const payment = await prisma.payment.create({ ... });
const order = await prisma.order.update({ ... });
// ⚠️ payment는 성공했지만 order 업데이트 실패 시 데이터 불일치

// ❌ 나쁜 예: 외부 API 호출을 트랜잭션 안에 포함
await prisma.$transaction(async (tx) => {
  await tx.order.create({ ... });
  await fetch('https://external-api.com/...'); // ❌ 트랜잭션 시간 증가
});
// ✅ 올바른 방법: 외부 API는 트랜잭션 밖에서 호출
```

---

### 3.2 Migration Best Practice

#### 📋 Expand and Contract 패턴
```typescript
// Phase 1: Expand (컬럼 추가)
// schema.prisma
model User {
  id        String   @id @default(cuid())
  name      String   // 기존
  fullName  String?  // 새 컬럼 (nullable로 시작)
}

// Migration 생성
// npx prisma migrate dev --name add_fullname_column
```

```typescript
// Phase 2: Data Migration (데이터 변환)
// scripts/migrate-fullname.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    const users = await tx.user.findMany();

    for (const user of users) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          fullName: user.name // 기존 name을 fullName으로 복사
        }
      });
    }
  });
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// 실행: tsx scripts/migrate-fullname.ts
```

```typescript
// Phase 3: Contract (기존 컬럼 제거)
// schema.prisma
model User {
  id        String   @id @default(cuid())
  fullName  String   // ✅ nullable 제거, 기본 컬럼으로 승격
  // name 컬럼 제거
}

// Migration 생성
// npx prisma migrate dev --name remove_name_column
```

#### 🎯 Migration 워크플로우
```bash
# 1. 개발 환경: 자동 마이그레이션
npx prisma migrate dev --name describe_changes

# 2. 스키마 변경 후 타입 재생성
npx prisma generate

# 3. 프로덕션 배포 전: 마이그레이션 확인
npx prisma migrate deploy

# 4. 마이그레이션 롤백 (신중하게!)
# ⚠️ Prisma는 자동 롤백 미지원 - 직접 SQL 작성 필요
```

#### ⚠️ 주의사항
```typescript
// ❌ 프로덕션에서 절대 금지
npx prisma migrate dev   // 데이터 손실 위험
npx prisma db push       // 마이그레이션 히스토리 없음

// ✅ 프로덕션 배포
npx prisma migrate deploy  // 안전한 마이그레이션 적용
```

---

### 3.3 Type Safety 패턴

#### ✅ Prisma Client 타입 활용
```typescript
import { Prisma } from '@prisma/client';

// ✅ 모델 타입 추출
type User = Prisma.UserGetPayload<{}>;

// ✅ Include 타입 안전
type UserWithOrders = Prisma.UserGetPayload<{
  include: { orders: true }
}>;

// ✅ Select 타입 안전
type UserPublicProfile = Prisma.UserGetPayload<{
  select: {
    id: true,
    name: true,
    avatar: true
  }
}>;

// ✅ 함수 반환 타입
async function getUser(): Promise<User | null> {
  return prisma.user.findUnique({ where: { id: "123" } });
}
```

#### ✅ Zod + Prisma 통합
```typescript
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// ✅ Prisma 스키마 기반 Zod 스키마 생성
const UserCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  password: z.string().min(8)
}) satisfies z.ZodType<Prisma.UserCreateInput>;

// ✅ Action에서 검증
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  // Zod 검증
  const result = UserCreateSchema.safeParse(data);

  if (!result.success) {
    return json({
      errors: result.error.flatten().fieldErrors
    }, { status: 400 });
  }

  // Prisma 생성 (타입 안전)
  const user = await prisma.user.create({
    data: result.data
  });

  return redirect(`/users/${user.id}`);
}
```

---

### 3.4 Query Optimization

#### ✅ N+1 문제 해결
```typescript
// ❌ N+1 문제 발생
const orders = await prisma.order.findMany();
for (const order of orders) {
  const user = await prisma.user.findUnique({
    where: { id: order.userId }
  });
  // ⚠️ 100개 주문 = 101번 쿼리 (1 + 100)
}

// ✅ Include로 해결
const orders = await prisma.order.findMany({
  include: { user: true }
});
// ✅ 1번의 JOIN 쿼리로 해결
```

#### ✅ 필요한 필드만 Select
```typescript
// ❌ 모든 필드 가져오기
const users = await prisma.user.findMany();
// ⚠️ password, internalNotes 등 불필요한 데이터까지 로드

// ✅ 필요한 필드만 선택
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true
  }
});
```

#### ✅ Pagination
```typescript
// ✅ Cursor-based pagination (대규모 데이터)
async function getOrders(cursor?: string) {
  return prisma.order.findMany({
    take: 20,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' }
  });
}

// ✅ Offset-based pagination (소규모 데이터)
async function getOrdersPage(page: number, pageSize = 20) {
  return prisma.order.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: 'desc' }
  });
}
```

---

### ✅ Prisma 체크리스트

- [ ] 중요한 작업은 항상 트랜잭션 사용
- [ ] 외부 API 호출은 트랜잭션 밖에서 실행
- [ ] Migration은 expand-contract 패턴 준수
- [ ] 프로덕션에서 migrate deploy만 사용
- [ ] Include/Select로 N+1 문제 방지
- [ ] Zod로 입력 검증 후 Prisma 호출
- [ ] 타입 추출은 Prisma.ModelGetPayload 활용
- [ ] Pagination으로 대량 데이터 처리
- [ ] 격리 수준(isolation level) 고려

---

## 4. React 18

### 📚 공식 문서
- **Suspense**: https://react.dev/reference/react/Suspense
- **Error Boundary**: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- **Transitions**: https://react.dev/reference/react/useTransition

---

### 4.1 Suspense 패턴

#### ✅ 기본 사용법
```typescript
import { Suspense } from 'react';

export default function OrderPage() {
  return (
    <Suspense fallback={<OrderSkeleton />}>
      <OrderDetails />
    </Suspense>
  );
}

// OrderDetails 컴포넌트에서 데이터 로딩 중 suspend
function OrderDetails() {
  const order = use(fetchOrder(orderId)); // React 18 use() hook
  return <div>{order.name}</div>;
}
```

#### ✅ 중첩 Suspense (Progressive Loading)
```typescript
export default function DashboardPage() {
  return (
    <div>
      {/* 헤더는 즉시 렌더링 */}
      <Header />

      {/* 통계는 빠르게 로드 */}
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>

      {/* 차트는 느리게 로드 */}
      <Suspense fallback={<ChartSkeleton />}>
        <Chart />
      </Suspense>

      {/* 테이블은 가장 느리게 로드 */}
      <Suspense fallback={<TableSkeleton />}>
        <DataTable />
      </Suspense>
    </div>
  );
}
// ✅ 각 섹션이 준비되는 대로 순차적으로 표시
```

#### ✅ Remix와 Suspense 통합
```typescript
// Remix의 Await 컴포넌트로 Suspense 활용
import { defer } from "@remix-run/node";
import { Await, useLoaderData } from "@remix-run/react";

export async function loader() {
  // 빠른 데이터
  const user = await getUser();

  // 느린 데이터 (await 없이 Promise 반환)
  const ordersPromise = getOrders();

  return defer({
    user,
    orders: ordersPromise
  });
}

export default function ProfilePage() {
  const { user, orders } = useLoaderData<typeof loader>();

  return (
    <div>
      {/* 즉시 렌더링 */}
      <h1>Hello, {user.name}</h1>

      {/* Suspense로 지연 로딩 */}
      <Suspense fallback={<OrdersSkeleton />}>
        <Await resolve={orders}>
          {(resolvedOrders) => <OrderList orders={resolvedOrders} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

---

### 4.2 Error Boundary 패턴

#### ✅ React 18 Error Boundary 구현
```typescript
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러 로깅
    console.error('Error caught by boundary:', error, errorInfo);

    // 외부 로깅 서비스 전송 (Sentry 등)
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!);
      }

      return (
        <div>
          <h1>Something went wrong</h1>
          <pre>{this.state.error?.message}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### ✅ Suspense + Error Boundary 통합
```typescript
export default function OrderPage() {
  return (
    <ErrorBoundary fallback={(error) => <ErrorView error={error} />}>
      <Suspense fallback={<OrderSkeleton />}>
        <OrderDetails />
      </Suspense>
    </ErrorBoundary>
  );
}

// ✅ OrderDetails에서 에러 발생 시 ErrorBoundary가 처리
// ✅ 로딩 중에는 Suspense fallback 표시
```

#### ✅ Remix Error Boundary (더 간단함)
```typescript
// routes/orders.$id.tsx
import { useRouteError } from "@remix-run/react";

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div>
      <h1>Order Error</h1>
      <p>{error.message}</p>
    </div>
  );
}
// ✅ Remix가 자동으로 Error Boundary 설정
```

---

### 4.3 Form 상태 관리 패턴

#### ✅ Remix Form (Controlled)
```typescript
import { useState } from 'react';
import { Form, useActionData, useNavigation } from '@remix-run/react';

export default function NewOrderForm() {
  const [amount, setAmount] = useState('');
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === 'submitting';

  return (
    <Form method="post">
      <label>
        Amount:
        <input
          type="number"
          name="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isSubmitting}
        />
      </label>

      {actionData?.errors?.amount && (
        <p className="error">{actionData.errors.amount}</p>
      )}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Order'}
      </button>
    </Form>
  );
}
```

#### ✅ Uncontrolled Form (Progressive Enhancement)
```typescript
import { Form, useActionData } from '@remix-run/react';

export default function SignupForm() {
  const actionData = useActionData<typeof action>();

  return (
    <Form method="post">
      {/* ✅ Uncontrolled: JS 없이도 작동 */}
      <input
        type="email"
        name="email"
        defaultValue={actionData?.values?.email}
        aria-invalid={actionData?.errors?.email ? true : undefined}
      />

      <button type="submit">Sign Up</button>
    </Form>
  );
}
```

#### ✅ Optimistic UI
```typescript
import { useFetcher } from '@remix-run/react';

export default function LikeButton({ postId, initialLikes }: Props) {
  const fetcher = useFetcher();

  // ✅ Optimistic 상태
  const optimisticLikes = fetcher.formData
    ? Number(fetcher.formData.get('likes')) + 1
    : initialLikes;

  return (
    <fetcher.Form method="post" action={`/posts/${postId}/like`}>
      <input type="hidden" name="likes" value={optimisticLikes} />
      <button type="submit">
        👍 {optimisticLikes}
      </button>
    </fetcher.Form>
  );
}
```

---

### 4.4 Progressive Enhancement 패턴

#### ✅ 4단계 Form (JavaScript 점진적 향상)
```typescript
// Step 1: HTML Form (JS 없이 작동)
<Form method="post">
  <input name="step1" />
  <button type="submit">Next</button>
</Form>

// Step 2: JS 로드 후 Fetch로 업그레이드
// Remix가 자동 처리

// Step 3: Pending UI 추가
const navigation = useNavigation();
{navigation.state === 'submitting' && <Spinner />}

// Step 4: Optimistic UI 추가
const fetcher = useFetcher();
const optimisticValue = fetcher.formData?.get('value');
```

---

### ✅ React 18 체크리스트

- [ ] Suspense boundary를 적절한 단위로 배치
- [ ] Error Boundary로 모든 비동기 에러 처리
- [ ] 중첩 Suspense로 Progressive Loading 구현
- [ ] Remix Await로 지연 로딩 활용
- [ ] Form은 Uncontrolled 우선 (Progressive Enhancement)
- [ ] useNavigation으로 Pending UI 제공
- [ ] useFetcher로 Optimistic UI 구현
- [ ] startTransition으로 부드러운 UI 전환

---

## 5. TypeScript 5 + Zod

### 📚 공식 문서
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/handbook/intro.html
- **Zod**: https://zod.dev/

---

### 5.1 TypeScript Strict Mode 설정

#### ✅ tsconfig.json
```json
{
  "compilerOptions": {
    "strict": true,               // ✅ 모든 엄격 검사 활성화
    "noUncheckedIndexedAccess": true, // ✅ 배열/객체 접근 시 undefined 고려
    "noImplicitReturns": true,    // ✅ 모든 코드 경로에서 return 필수
    "noFallthroughCasesInSwitch": true, // ✅ switch case fallthrough 방지
    "forceConsistentCasingInFileNames": true, // ✅ 파일명 대소문자 일관성
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}
```

---

### 5.2 Type Guards 패턴

#### ✅ 기본 Type Guard
```typescript
// ✅ typeof type guard
function formatValue(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase(); // ✅ string 타입으로 좁혀짐
  }
  return value.toFixed(2); // ✅ number 타입으로 좁혀짐
}

// ✅ instanceof type guard
function handleError(error: unknown) {
  if (error instanceof Error) {
    console.error(error.message); // ✅ Error 타입
  } else {
    console.error('Unknown error:', error);
  }
}

// ✅ in operator type guard
type User = { name: string; email: string };
type Admin = { name: string; permissions: string[] };

function greet(user: User | Admin) {
  if ('permissions' in user) {
    console.log(`Admin: ${user.name}`); // ✅ Admin 타입
  } else {
    console.log(`User: ${user.name}`); // ✅ User 타입
  }
}
```

#### ✅ Custom Type Guard
```typescript
// ✅ is 키워드로 커스텀 타입 가드
function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function processEmail(email: unknown) {
  if (isValidEmail(email)) {
    console.log(email.toLowerCase()); // ✅ string 타입 확정
  }
}
```

---

### 5.3 Discriminated Unions 패턴

#### ✅ 결제 상태 모델링
```typescript
type Payment =
  | { status: 'pending'; orderId: string }
  | { status: 'processing'; orderId: string; paymentKey: string }
  | { status: 'done'; orderId: string; paymentKey: string; paidAt: Date }
  | { status: 'failed'; orderId: string; errorCode: string; errorMessage: string };

function handlePayment(payment: Payment) {
  switch (payment.status) {
    case 'pending':
      // ✅ orderId만 접근 가능
      console.log(`Waiting for payment: ${payment.orderId}`);
      break;

    case 'processing':
      // ✅ orderId, paymentKey 접근 가능
      console.log(`Processing: ${payment.paymentKey}`);
      break;

    case 'done':
      // ✅ orderId, paymentKey, paidAt 접근 가능
      console.log(`Paid at: ${payment.paidAt}`);
      break;

    case 'failed':
      // ✅ orderId, errorCode, errorMessage 접근 가능
      console.error(`Failed: ${payment.errorMessage}`);
      break;

    default:
      // ✅ exhaustive check
      const _exhaustive: never = payment;
      throw new Error(`Unhandled payment status`);
  }
}
```

---

### 5.4 Zod 통합 패턴

#### ✅ 기본 스키마 정의
```typescript
import { z } from 'zod';

// ✅ Primitive types
const EmailSchema = z.string().email();
const AgeSchema = z.number().int().min(0).max(150);
const BirthDateSchema = z.coerce.date(); // string → Date 자동 변환

// ✅ Object schema
const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  age: z.number().int().min(0).optional(),
  birthDate: z.coerce.date()
});

// ✅ 타입 추출
type User = z.infer<typeof UserSchema>;
// { email: string; name: string; age?: number; birthDate: Date }
```

#### ✅ Remix Action에서 Zod 검증
```typescript
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { z } from 'zod';

const OrderSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().int().min(1).max(100),
  amount: z.coerce.number().min(0),
  customerEmail: z.string().email()
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  // ✅ safeParse로 안전하게 검증
  const result = OrderSchema.safeParse(data);

  if (!result.success) {
    return json({
      errors: result.error.flatten().fieldErrors
      // { productId: ["Invalid cuid"], quantity: ["Expected number, received string"] }
    }, { status: 400 });
  }

  // ✅ result.data는 타입 안전
  const order = await prisma.order.create({
    data: result.data
  });

  return redirect(`/orders/${order.id}`);
}
```

#### ✅ 복잡한 검증 규칙
```typescript
const PaymentSchema = z.object({
  orderId: z.string().regex(/^[a-zA-Z0-9_-]{6,64}$/),
  amount: z.number().positive(),
  method: z.enum(['CARD', 'VIRTUAL_ACCOUNT', 'MOBILE_PHONE', 'TRANSFER']),

  // ✅ 조건부 필드 (method에 따라 달라짐)
  cardNumber: z.string().optional(),
  bankCode: z.string().optional()
}).superRefine((data, ctx) => {
  // ✅ 커스텀 검증: CARD 결제는 cardNumber 필수
  if (data.method === 'CARD' && !data.cardNumber) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['cardNumber'],
      message: 'Card number is required for card payments'
    });
  }

  // ✅ 커스텀 검증: 가상계좌는 bankCode 필수
  if (data.method === 'VIRTUAL_ACCOUNT' && !data.bankCode) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['bankCode'],
      message: 'Bank code is required for virtual account'
    });
  }
});
```

#### ✅ Union & Discriminated Union
```typescript
// ✅ 간단한 Union
const IdSchema = z.union([
  z.string().cuid(),
  z.number().int().positive()
]);

// ✅ Discriminated Union (타입에 따라 스키마 달라짐)
const PaymentEventSchema = z.discriminatedUnion('eventType', [
  z.object({
    eventType: z.literal('PAYMENT_STATUS_CHANGED'),
    orderId: z.string(),
    status: z.enum(['PENDING', 'DONE', 'CANCELED'])
  }),
  z.object({
    eventType: z.literal('DEPOSIT_CALLBACK'),
    orderId: z.string(),
    secret: z.string(),
    depositedAt: z.coerce.date()
  })
]);

type PaymentEvent = z.infer<typeof PaymentEventSchema>;
// ✅ eventType에 따라 타입 자동 좁혀짐
```

#### ✅ Transform & Preprocess
```typescript
// ✅ Transform: 검증 후 변환
const TrimmedStringSchema = z.string().transform(s => s.trim());

// ✅ Preprocess: 검증 전 변환
const ParsedNumberSchema = z.preprocess(
  (val) => Number(val),
  z.number()
);

// ✅ 실전 예시: FormData → 검증된 객체
const FormDataSchema = z.object({
  email: z.string().email().transform(s => s.toLowerCase()),
  age: z.preprocess((val) => Number(val), z.number().int().min(0)),
  tags: z.preprocess(
    (val) => typeof val === 'string' ? val.split(',') : [],
    z.array(z.string())
  )
});
```

---

### 5.5 Prisma + Zod 통합

#### ✅ Prisma 스키마 기반 Zod 스키마
```typescript
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// ✅ Prisma 타입을 Zod로 변환
const UserCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  birthDate: z.coerce.date().optional()
}) satisfies z.ZodType<Prisma.UserCreateInput>;

// ✅ Action에서 활용
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const result = UserCreateSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return json({ errors: result.error.flatten() }, { status: 400 });
  }

  // ✅ Prisma와 타입 호환 보장
  const user = await prisma.user.create({
    data: result.data
  });

  return json({ user });
}
```

---

### ✅ TypeScript + Zod 체크리스트

- [ ] tsconfig.json에 strict: true 설정
- [ ] 모든 외부 입력은 Zod로 검증
- [ ] safeParse() 사용해 에러 안전하게 처리
- [ ] Discriminated Union으로 상태 모델링
- [ ] Type Guard로 타입 좁히기
- [ ] Prisma 타입과 Zod 스키마 일치 확인
- [ ] unknown 타입에 Type Guard 적용
- [ ] exhaustive check로 switch/case 완전성 보장
- [ ] z.infer<>로 타입 추출

---

## 6. 통합 시나리오 패턴

### 6.1 통합 API 엔드포인트 구현

#### 시나리오: 결제 승인 API
```typescript
// routes/api.payments.confirm.tsx
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { z } from 'zod';

// ✅ 1. Zod 스키마 정의
const PaymentConfirmSchema = z.object({
  paymentKey: z.string(),
  orderId: z.string().regex(/^[a-zA-Z0-9_-]{6,64}$/),
  amount: z.number().positive()
});

// ✅ 2. Action 구현
export async function action({ request }: ActionFunctionArgs) {
  // 인증 확인
  const userId = await requireUserId(request);

  // 요청 파싱 & 검증
  const body = await request.json();
  const result = PaymentConfirmSchema.safeParse(body);

  if (!result.success) {
    return json({
      error: 'Validation failed',
      details: result.error.flatten()
    }, { status: 400 });
  }

  const { paymentKey, orderId, amount } = result.data;

  // ✅ 3. Prisma 트랜잭션으로 원자성 보장
  try {
    const payment = await prisma.$transaction(async (tx) => {
      // 주문 확인
      const order = await tx.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.userId !== userId) {
        throw new Error('Forbidden');
      }

      if (order.amount !== amount) {
        throw new Error('Amount mismatch');
      }

      // 토스페이먼츠 승인 API 호출
      const tossPayment = await confirmTossPayment({
        paymentKey,
        orderId,
        amount
      });

      // DB 업데이트
      const payment = await tx.payment.create({
        data: {
          orderId,
          paymentKey,
          amount,
          status: tossPayment.status,
          method: tossPayment.method,
          approvedAt: new Date(tossPayment.approvedAt)
        }
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paymentId: payment.id
        }
      });

      return payment;
    });

    return json({ payment }, { status: 200 });

  } catch (error) {
    console.error('Payment confirmation failed:', error);
    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ✅ 4. TossPayments API 호출 (서버 전용)
async function confirmTossPayment(data: {
  paymentKey: string;
  orderId: string;
  amount: number;
}) {
  const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY!;
  const encodedAuth = Buffer.from(`${secretKey}:`).toString('base64');

  const response = await fetch(
    'https://api.tosspayments.com/v1/payments/confirm',
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`TossPayments API failed: ${error.message}`);
  }

  return response.json();
}
```

---

### 6.2 결제 플로우 구현

#### 1단계: 결제 요청 페이지
```typescript
// routes/checkout.$orderId.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { loadTossPayments } from '@tosspayments/payment-sdk';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { items: true }
  });

  if (!order || order.userId !== userId) {
    throw json("Not found", { status: 404 });
  }

  return json({
    order,
    clientKey: process.env.TOSS_PAYMENTS_CLIENT_KEY
  });
}

export default function CheckoutPage() {
  const { order, clientKey } = useLoaderData<typeof loader>();

  const handlePayment = async () => {
    const tossPayments = await loadTossPayments(clientKey);

    await tossPayments.requestPayment('CARD', {
      amount: {
        value: order.amount,
        currency: 'KRW'
      },
      orderId: order.id,
      orderName: order.items.map(i => i.name).join(', '),
      successUrl: `${window.location.origin}/payments/success`,
      failUrl: `${window.location.origin}/payments/fail`,
      customerEmail: order.customerEmail
    });
  };

  return (
    <div>
      <h1>결제</h1>
      <p>주문 금액: {order.amount}원</p>
      <button onClick={handlePayment}>결제하기</button>
    </div>
  );
}
```

#### 2단계: 결제 성공 처리
```typescript
// routes/payments.success.tsx
import { redirect, type LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);

  const paymentKey = url.searchParams.get("paymentKey")!;
  const orderId = url.searchParams.get("orderId")!;
  const amount = Number(url.searchParams.get("amount"));

  // API 호출로 승인 처리 (위의 confirm API 사용)
  const response = await fetch(`${request.url.origin}/api/payments/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('Cookie') || ''
    },
    body: JSON.stringify({ paymentKey, orderId, amount })
  });

  if (!response.ok) {
    throw new Error('Payment confirmation failed');
  }

  return redirect(`/orders/${orderId}`);
}
```

---

### 6.3 DB 트랜잭션 처리

#### 시나리오: 주문 생성 + 재고 차감 + 포인트 사용
```typescript
// routes/api.orders.create.tsx
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { z } from 'zod';

const CreateOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().int().min(1)
  })),
  usePoints: z.number().int().min(0).default(0)
});

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const body = await request.json();
  const result = CreateOrderSchema.safeParse(body);

  if (!result.success) {
    return json({ errors: result.error.flatten() }, { status: 400 });
  }

  const { items, usePoints } = result.data;

  // ✅ Interactive Transaction으로 복잡한 비즈니스 로직 처리
  const order = await prisma.$transaction(async (tx) => {
    // 1. 재고 확인 & 차감
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      });
    }

    // 2. 총 금액 계산
    const products = await tx.product.findMany({
      where: { id: { in: items.map(i => i.productId) } }
    });

    const totalAmount = items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId)!;
      return sum + (product.price * item.quantity);
    }, 0);

    // 3. 포인트 사용 검증 & 차감
    if (usePoints > 0) {
      const user = await tx.user.findUnique({
        where: { id: userId }
      });

      if (!user || user.points < usePoints) {
        throw new Error('Insufficient points');
      }

      await tx.user.update({
        where: { id: userId },
        data: { points: { decrement: usePoints } }
      });
    }

    // 4. 주문 생성
    const order = await tx.order.create({
      data: {
        userId,
        amount: totalAmount - usePoints,
        status: 'PENDING',
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: products.find(p => p.id === item.productId)!.price
          }))
        }
      },
      include: { items: true }
    });

    return order;
  }, {
    maxWait: 5000,
    timeout: 10000
  });

  return json({ order }, { status: 201 });
}
```

---

### 6.4 4단계 폼 처리

#### Multi-Step Form with Remix
```typescript
// routes/consultation.new.tsx
import { useState } from 'react';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { z } from 'zod';

// ✅ 각 단계별 Zod 스키마
const Step1Schema = z.object({
  birthDate: z.coerce.date(),
  birthTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
});

const Step2Schema = z.object({
  gender: z.enum(['male', 'female']),
  birthPlace: z.string().min(2)
});

const Step3Schema = z.object({
  consultationType: z.enum(['general', 'career', 'relationship']),
  question: z.string().min(10).max(500)
});

const Step4Schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().regex(/^010-\d{4}-\d{4}$/)
});

// ✅ 전체 폼 스키마
const FullFormSchema = Step1Schema
  .merge(Step2Schema)
  .merge(Step3Schema)
  .merge(Step4Schema);

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();

  const currentStep = Number(formData.get('currentStep'));
  const data = Object.fromEntries(formData);

  // ✅ 현재 단계 검증
  let result;
  switch (currentStep) {
    case 1:
      result = Step1Schema.safeParse(data);
      break;
    case 2:
      result = Step2Schema.safeParse(data);
      break;
    case 3:
      result = Step3Schema.safeParse(data);
      break;
    case 4:
      result = FullFormSchema.safeParse(data);

      // ✅ 최종 단계: DB 저장
      if (result.success) {
        const consultation = await prisma.consultation.create({
          data: {
            userId,
            ...result.data
          }
        });

        return redirect(`/consultations/${consultation.id}`);
      }
      break;
  }

  if (!result?.success) {
    return json({
      errors: result.error.flatten().fieldErrors,
      values: data
    }, { status: 400 });
  }

  // ✅ 다음 단계로 이동
  return json({
    success: true,
    nextStep: currentStep + 1,
    values: data
  });
}

export default function NewConsultationPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  // ✅ Action 성공 시 다음 단계로
  if (actionData?.success && actionData.nextStep) {
    setStep(actionData.nextStep);
    setFormData({ ...formData, ...actionData.values });
  }

  return (
    <div>
      <h1>사주 상담 신청 ({step}/4)</h1>

      <Form method="post">
        <input type="hidden" name="currentStep" value={step} />

        {/* ✅ 이전 단계 데이터 hidden input으로 유지 */}
        {Object.entries(formData).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={String(value)} />
        ))}

        {step === 1 && (
          <div>
            <label>생년월일</label>
            <input type="date" name="birthDate" required />

            <label>생시</label>
            <input type="time" name="birthTime" required />
          </div>
        )}

        {step === 2 && (
          <div>
            <label>성별</label>
            <select name="gender" required>
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>

            <label>출생지</label>
            <input type="text" name="birthPlace" required />
          </div>
        )}

        {step === 3 && (
          <div>
            <label>상담 유형</label>
            <select name="consultationType" required>
              <option value="general">종합</option>
              <option value="career">진로</option>
              <option value="relationship">연애/결혼</option>
            </select>

            <label>궁금한 내용</label>
            <textarea name="question" required />
          </div>
        )}

        {step === 4 && (
          <div>
            <label>이름</label>
            <input type="text" name="name" required />

            <label>이메일</label>
            <input type="email" name="email" required />

            <label>연락처</label>
            <input type="tel" name="phone" placeholder="010-0000-0000" required />
          </div>
        )}

        {actionData?.errors && (
          <div className="errors">
            {Object.entries(actionData.errors).map(([field, messages]) => (
              <p key={field}>{messages}</p>
            ))}
          </div>
        )}

        <div>
          {step > 1 && (
            <button type="button" onClick={() => setStep(step - 1)}>
              이전
            </button>
          )}

          <button type="submit" disabled={navigation.state === 'submitting'}>
            {step === 4 ? '제출' : '다음'}
          </button>
        </div>
      </Form>
    </div>
  );
}
```

---

### ✅ 통합 시나리오 체크리스트

**통합 API 엔드포인트**
- [ ] Remix Resource Route로 API 구현
- [ ] Zod로 요청 검증
- [ ] Prisma 트랜잭션으로 원자성 보장
- [ ] 에러 처리 및 적절한 HTTP 상태 코드 반환

**결제 플로우**
- [ ] TossPayments SDK로 결제창 호출
- [ ] Success URL에서 금액 검증
- [ ] 승인 API 호출 전 권한 확인
- [ ] Webhook으로 비동기 결제 처리
- [ ] 멱등성 보장

**DB 트랜잭션**
- [ ] Interactive Transaction으로 복잡한 로직 처리
- [ ] 재고/포인트 등 제약 조건 검증
- [ ] 타임아웃 설정
- [ ] 에러 시 자동 롤백

**4단계 폼**
- [ ] 각 단계별 Zod 검증
- [ ] Hidden input으로 이전 단계 데이터 유지
- [ ] Progressive Enhancement (JS 없이도 작동)
- [ ] 최종 단계에서 전체 검증 후 DB 저장
- [ ] useNavigation으로 Pending UI 제공

---

## 📚 참고 자료

### Remix v2
- 공식 문서: https://v2.remix.run/docs
- Remix Guide: https://remix.guide

### TossPayments
- 개발자 센터: https://docs.tosspayments.com/en
- API Reference: https://docs.tosspayments.com/en/api-guide

### Prisma
- 공식 문서: https://www.prisma.io/docs
- Best Practices: https://www.prisma.io/docs/guides/performance-and-optimization

### React 18
- 공식 문서: https://react.dev
- Suspense Guide: https://react.dev/reference/react/Suspense

### TypeScript
- Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- Zod: https://zod.dev

---

**마지막 업데이트**: 2025-10-27
**작성자**: Claude Code
**프로젝트**: Saju Application
