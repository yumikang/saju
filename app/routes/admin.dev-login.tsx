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
    where: { email: "admin@test.local" }
  });

  if (!user) {
    user = await db.user.create({
      data: {
        email: "admin@test.local",
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
  session.set("user", {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
  });
  
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">개발용 빠른 로그인</h1>
          <p className="text-red-600 text-sm">⚠️ 개발 환경에서만 사용 가능</p>
        </div>
        
        <Form method="post">
          <button
            type="submit"
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            테스트 Admin으로 로그인
          </button>
        </Form>
        
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>테스트 계정 정보:</strong><br />
            이메일: admin@test.local<br />
            권한: ADMIN (전체 권한)
          </p>
        </div>
        
        <div className="mt-4 text-center">
          <a href="/admin/login" className="text-sm text-gray-600 hover:text-gray-900">
            일반 로그인 페이지로 이동 →
          </a>
        </div>
      </div>
    </div>
  );
}