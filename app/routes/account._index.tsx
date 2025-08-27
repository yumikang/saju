import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link, Form, useActionData, useNavigation, useFetcher } from "@remix-run/react";
import { requireUser } from "~/utils/user-session.server";
import { logUserAction } from "~/utils/user-auth.server";
import { db } from "~/utils/db.server";
import { useState, useEffect } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);
  
  // Get full user data
  const user = await db.user.findUnique({
    where: { id: sessionUser.userId },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
    }
  });
  
  if (!user) {
    throw new Response("User not found", { status: 404 });
  }
  
  // Get user profile and connected OAuth accounts
  const profile = await db.userProfile.findUnique({
    where: { userId: user.id },
  });
  
  const oauthAccounts = await db.userOAuth.findMany({
    where: { userId: user.id },
    orderBy: { linkedAt: 'desc' },
  });
  
  const termsConsent = await db.termsConsent.findFirst({
    where: { 
      userId: user.id,
      revokedAt: null,
    },
    orderBy: { agreedAt: 'desc' },
  });
  
  return json({ 
    user, 
    profile, 
    oauthAccounts,
    termsConsent,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const sessionUser = await requireUser(request);
  
  // Get full user data
  const user = await db.user.findUnique({
    where: { id: sessionUser.userId },
  });
  
  if (!user) {
    throw new Response("User not found", { status: 404 });
  }
  const formData = await request.formData();
  const action = formData.get("_action");
  
  if (action === "updateProfile") {
    const nickname = String(formData.get("nickname") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const bio = String(formData.get("bio") || "").trim();
    
    const errors: Record<string, string> = {};
    
    if (!nickname) {
      errors.nickname = "닉네임은 필수입니다.";
    } else if (nickname.length < 2 || nickname.length > 20) {
      errors.nickname = "닉네임은 2-20자 사이여야 합니다.";
    }
    
    if (phone && !/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(phone)) {
      errors.phone = "올바른 전화번호 형식이 아닙니다.";
    }
    
    if (bio && bio.length > 200) {
      errors.bio = "자기소개는 200자 이내로 작성해주세요.";
    }
    
    if (Object.keys(errors).length > 0) {
      return json({ errors, success: false }, { status: 400 });
    }
    
    await db.userProfile.update({
      where: { userId: user.id },
      data: {
        nickname,
        phone: phone || null,
        bio: bio || null,
      },
    });
    
    await logUserAction(
      user,
      "PROFILE_UPDATE",
      { type: "UserProfile", id: user.id },
      { updatedFields: ["nickname", phone ? "phone" : null, bio ? "bio" : null].filter(Boolean) },
      request
    );
    
    return json({ success: true, message: "프로필이 업데이트되었습니다." });
  }
  
  if (action === "unlinkOAuth") {
    const accountId = String(formData.get("accountId"));
    
    // Check if this is the last OAuth account
    const accountCount = await db.userOAuth.count({
      where: { userId: user.id },
    });
    
    if (accountCount <= 1) {
      return json(
        { error: "마지막 로그인 계정은 삭제할 수 없습니다. 다른 계정을 연결한 후 삭제해주세요." },
        { status: 400 }
      );
    }
    
    await db.userOAuth.delete({
      where: { 
        id: accountId,
        userId: user.id, // Extra safety check
      },
    });
    
    await logUserAction(
      user,
      "OAUTH_UNLINK",
      { type: "UserOAuth", id: accountId },
      {},
      request
    );
    
    return json({ success: true, message: "계정 연결이 해제되었습니다." });
  }
  
  return json({ error: "Invalid action" }, { status: 400 });
}

export default function AccountIndex() {
  const { user, profile, oauthAccounts, termsConsent } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const [showToast, setShowToast] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const isSubmitting = navigation.state === "submitting";
  
  useEffect(() => {
    if (actionData?.success) {
      setShowToast(true);
      setIsEditing(false);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">내 계정</h1>
                <p className="text-gray-600">프로필과 계정 설정을 관리하세요</p>
              </div>
              <Form action="/logout" method="get">
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  로그아웃
                </button>
              </Form>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">프로필 정보</h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      수정
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                {isEditing ? (
                  <Form method="post" className="space-y-4">
                    <input type="hidden" name="_action" value="updateProfile" />
                    
                    <div>
                      <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                        닉네임 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="nickname"
                        name="nickname"
                        defaultValue={profile?.nickname || ""}
                        maxLength={20}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                          actionData?.errors?.nickname ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {actionData?.errors?.nickname && (
                        <p className="mt-1 text-xs text-red-600">{actionData.errors.nickname}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        전화번호
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        defaultValue={profile?.phone || ""}
                        placeholder="010-1234-5678"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                          actionData?.errors?.phone ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {actionData?.errors?.phone && (
                        <p className="mt-1 text-xs text-red-600">{actionData.errors.phone}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                        자기소개
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        rows={3}
                        defaultValue={profile?.bio || ""}
                        maxLength={200}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                          actionData?.errors?.bio ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {actionData?.errors?.bio && (
                        <p className="mt-1 text-xs text-red-600">{actionData.errors.bio}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {isSubmitting ? "저장 중..." : "저장"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        취소
                      </button>
                    </div>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">닉네임</p>
                      <p className="font-medium">{profile?.nickname || "설정되지 않음"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">이메일</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">전화번호</p>
                      <p className="font-medium">{profile?.phone || "설정되지 않음"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">자기소개</p>
                      <p className="font-medium">{profile?.bio || "설정되지 않음"}</p>
                    </div>
                    {profile?.gender && (
                      <div>
                        <p className="text-sm text-gray-500">성별</p>
                        <p className="font-medium">
                          {profile.gender === "MALE" ? "남성" : profile.gender === "FEMALE" ? "여성" : "기타"}
                        </p>
                      </div>
                    )}
                    {profile?.birthDate && (
                      <div>
                        <p className="text-sm text-gray-500">생년월일</p>
                        <p className="font-medium">
                          {new Date(profile.birthDate).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Connected OAuth Accounts */}
            <div className="bg-white rounded-lg shadow-sm mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">연결된 계정</h2>
                <p className="text-sm text-gray-600 mt-1">
                  다른 소셜 계정을 연결하여 로그인 옵션을 추가할 수 있습니다.
                </p>
              </div>
              
              <div className="p-6">
                {actionData?.error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{actionData.error}</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  {oauthAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          account.provider === 'GOOGLE' ? 'bg-blue-50' :
                          account.provider === 'KAKAO' ? 'bg-yellow-50' :
                          'bg-green-50'
                        }`}>
                          {account.provider === 'GOOGLE' && (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                          )}
                          {account.provider === 'KAKAO' && (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path fill="#000000" d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z" />
                            </svg>
                          )}
                          {account.provider === 'NAVER' && (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path fill="#03C75A" d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {account.provider === 'GOOGLE' ? 'Google' :
                             account.provider === 'KAKAO' ? 'Kakao' :
                             'Naver'}
                          </p>
                          <p className="text-sm text-gray-500">{account.email}</p>
                        </div>
                      </div>
                      
                      {oauthAccounts.length > 1 && (
                        <Form method="post">
                          <input type="hidden" name="_action" value="unlinkOAuth" />
                          <input type="hidden" name="accountId" value={account.id} />
                          <button
                            type="submit"
                            className="text-sm text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              if (!confirm(`${account.provider} 계정 연결을 해제하시겠습니까?`)) {
                                e.preventDefault();
                              }
                            }}
                          >
                            연결 해제
                          </button>
                        </Form>
                      )}
                    </div>
                  ))}
                </div>
                
                {oauthAccounts.length === 1 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      ⚠️ 마지막 로그인 계정은 삭제할 수 없습니다. 
                      다른 계정을 먼저 연결해주세요.
                    </p>
                  </div>
                )}
                
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-3">새 계정 연결하기</p>
                  <div className="flex gap-3">
                    {!oauthAccounts.find(a => a.provider === 'GOOGLE') && (
                      <Link
                        to="/auth/user/google"
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Google 연결
                      </Link>
                    )}
                    {!oauthAccounts.find(a => a.provider === 'KAKAO') && (
                      <Link
                        to="/auth/user/kakao"
                        className="px-4 py-2 bg-[#FEE500] rounded-md text-sm font-medium text-gray-900 hover:bg-[#FDD835]"
                      >
                        Kakao 연결
                      </Link>
                    )}
                    {!oauthAccounts.find(a => a.provider === 'NAVER') && (
                      <Link
                        to="/auth/user/naver"
                        className="px-4 py-2 bg-[#03C75A] rounded-md text-sm font-medium text-white hover:bg-[#02b351]"
                      >
                        Naver 연결
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 메뉴</h3>
              <div className="space-y-2">
                <Link 
                  to="/naming" 
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                >
                  🔮 새 작명 시작하기
                </Link>
                <Link 
                  to="/naming/history" 
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  📜 작명 이력 보기
                </Link>
                <Link 
                  to="/naming/favorites" 
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  ⭐ 즐겨찾기 이름
                </Link>
              </div>
            </div>

            {/* Terms Info */}
            {termsConsent && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">약관 동의</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    버전: <span className="font-medium">{termsConsent.version}</span>
                  </p>
                  <p className="text-gray-600">
                    동의일: <span className="font-medium">
                      {new Date(termsConsent.agreedAt).toLocaleDateString('ko-KR')}
                    </span>
                  </p>
                  <div className="pt-2 space-y-1">
                    <p className="text-gray-600">
                      ✓ 이용약관
                    </p>
                    <p className="text-gray-600">
                      ✓ 개인정보처리방침
                    </p>
                    {termsConsent.marketingAgreed && (
                      <p className="text-gray-600">
                        ✓ 마케팅 정보 수신
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Account Created */}
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-sm text-gray-600">
                계정 생성일
              </p>
              <p className="text-lg font-medium text-gray-900">
                {new Date(user.id).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        </div>

        {/* Success Toast */}
        {showToast && actionData?.success && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {actionData.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}