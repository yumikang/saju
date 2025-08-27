import type { ActionFunctionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { db } from "~/utils/db.server"
import { createUserSession } from "~/utils/user-session.server"

export async function action({ request }: ActionFunctionArgs) {
  // 개발 환경에서만 작동
  if (process.env.NODE_ENV === "production") {
    throw new Response("Not Found", { status: 404 })
  }

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
  // 개발 환경에서만 작동
  if (process.env.NODE_ENV === "production") {
    throw new Response("Not Found", { status: 404 })
  }
  
  return redirect("/login")
}