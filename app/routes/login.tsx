import { Form, useSearchParams, useActionData, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { userAuthenticator } from "~/utils/user-auth.server";
import { getOptionalUser } from "~/utils/user-session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // If the user is already authenticated redirect to account
  const user = await userAuthenticator.isAuthenticated(request);
  if (user) {
    return redirect("/account");
  }
  
  // Check for any error messages from OAuth callback
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  
  return json({ 
    error: error ? decodeURIComponent(error) : null 
  });
}

export async function action({ request }: ActionFunctionArgs) {
  // This will be handled by the OAuth providers
  // The actual authentication happens in the callback routes
  return null;
}

export default function UserLogin() {
  const [searchParams] = useSearchParams();
  const { error } = useLoaderData<typeof loader>();
  const redirectTo = searchParams.get("next") || "/account";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">사주 작명</h1>
          <p className="mt-2 text-gray-600">소셜 계정으로 간편하게 시작하세요</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {/* Google Login */}
          <Form method="post" action={`/auth/user/google?redirectTo=${redirectTo}`}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google로 시작하기
            </button>
          </Form>

          {/* Kakao Login */}
          <Form method="post" action={`/auth/user/kakao?redirectTo=${redirectTo}`}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg shadow-sm text-sm font-medium text-gray-900 bg-[#FEE500] hover:bg-[#FDD835] focus:ring-2 focus:ring-yellow-400 focus:bg-[#FDD835] transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#000000"
                  d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3zm5.907 8.06l1.47-1.424a.472.472 0 0 0-.656-.678l-1.928 1.866V9.282a.472.472 0 0 0-.944 0v2.557a.471.471 0 0 0 0 .222V13.5a.472.472 0 0 0 .944 0v-1.363l.427-.413 1.428 2.033a.472.472 0 1 0 .773-.543l-1.514-2.155zm-2.958 1.924h-1.46V9.297a.472.472 0 0 0-.943 0v4.159c0 .26.21.472.471.472h1.932a.472.472 0 1 0 0-.944zm-5.857-1.092l.696-1.707.638 1.707H9.092zm2.523.488l.002-.016a.469.469 0 0 0-.127-.32l-1.046-2.8a.69.69 0 0 0-.627-.474.696.696 0 0 0-.653.447l-1.661 4.075a.472.472 0 0 0 .874.357l.33-.813h2.07l.299.8a.472.472 0 1 0 .884-.33l-.345-.926zM8.293 9.302a.472.472 0 0 0-.471-.472H4.577a.472.472 0 1 0 0 .944h1.16v3.736a.472.472 0 0 0 .944 0V9.774h1.14c.261 0 .472-.212.472-.472z"
                />
              </svg>
              카카오로 시작하기
            </button>
          </Form>

          {/* Naver Login */}
          <Form method="post" action={`/auth/user/naver?redirectTo=${redirectTo}`}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg shadow-sm text-sm font-medium text-white bg-[#03C75A] hover:bg-[#02b351] focus:ring-2 focus:ring-green-400 focus:bg-[#02b351] transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="white"
                  d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"
                />
              </svg>
              네이버로 시작하기
            </button>
          </Form>

          {/* Test Login Button (Development Only) */}
          {process.env.NODE_ENV !== "production" && (
            <Form method="post" action="/auth/test/login">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-gray-400 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                테스트 계정으로 로그인 (개발용)
              </button>
            </Form>
          )}
        </div>

        {/* Information Section */}
        <div className="mt-8 space-y-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              소셜 로그인으로 간편하게 시작하세요
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-xs text-blue-700">
                <p className="font-semibold mb-1">안내사항</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>이메일 정보 제공 시 계정 연결이 더욱 안전해집니다</li>
                  <li>같은 이메일의 다른 소셜 계정과 자동 연결됩니다</li>
                  <li>개인정보는 작명 서비스 목적으로만 사용됩니다</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-400">
              로그인 시 <span className="underline">서비스 약관</span> 및 <span className="underline">개인정보처리방침</span>에 동의하게 됩니다
            </p>
          </div>
        </div>

        {/* Mobile optimization notice */}
        <div className="mt-6 text-center md:hidden">
          <p className="text-xs text-gray-400">
            📱 모바일에서도 편리하게 이용하세요
          </p>
        </div>
      </div>
    </div>
  );
}