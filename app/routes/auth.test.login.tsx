import type { ActionFunctionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { db } from "~/utils/db.server"
import { createUserSession } from "~/utils/user-session.server"

export async function action({ request }: ActionFunctionArgs) {
  // 테스트 사용자 찾기
  const testUser = await db.user.findUnique({
    where: { email: "test@example.com" },
    include: {
      profile: true,
      termsConsents: {
        orderBy: { agreedAt: "desc" },
        take: 1
      }
    }
  })

  if (!testUser) {
    throw new Response("Test user not found", { status: 404 })
  }

  // 세션 생성 - 올바른 시그니처로 수정
  return createUserSession(
    testUser.id,
    { emailVerified: testUser.emailVerified },
    "/account"
  )
}

export async function loader() {
  return null
}

export default function TestLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            테스트 로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            개발 환경 전용
          </p>
        </div>

        <form method="post" className="mt-8 space-y-6">
          <div className="rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-700">
              test@example.com 계정으로 자동 로그인됩니다.
            </p>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            테스트 계정으로 로그인
          </button>
        </form>
      </div>
    </div>
  )
}