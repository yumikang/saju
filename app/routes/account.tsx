import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { requireUser } from "~/utils/user-session.server";
import { db } from "~/utils/db.server";
import { AccountNav } from "~/components/account/AccountNav";

export async function loader({ request }: LoaderFunctionArgs) {
  // 인증된 사용자만 접근 가능
  const sessionUser = await requireUser(request);
  
  // 전체 사용자 정보 가져오기
  const user = await db.user.findUnique({
    where: { id: sessionUser.userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      emailVerified: true,
      profile: {
        select: {
          nickname: true,
          gender: true,
          birthDate: true,
          phone: true,
        }
      }
    }
  });
  
  if (!user) {
    throw new Response("User not found", { status: 404 });
  }
  
  return json({ user });
}

export default function AccountLayout() {
  const { user } = useLoaderData<typeof loader>();
  
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">마이페이지</h1>
        <p className="mt-2 text-muted-foreground">
          {user.name || user.email}님, 환영합니다.
        </p>
      </div>
      
      {/* 2컬럼 레이아웃 */}
      <div className="flex flex-col lg:flex-row lg:gap-8">
        {/* 사이드바 네비게이션 */}
        <AccountNav />
        
        {/* 콘텐츠 영역 */}
        <div className="flex-1 mt-6 lg:mt-0">
          <div className="bg-white rounded-lg shadow-sm border">
            <Outlet context={{ user }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Outlet context 타입 정의
export type AccountContextType = {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: string;
    createdAt: Date;
    emailVerified: boolean;
    profile: {
      nickname: string | null;
      gender: string | null;
      birthDate: Date | null;
      phone: string | null;
    } | null;
  };
};