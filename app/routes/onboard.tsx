import { Form, useActionData, useSearchParams, useLoaderData, useNavigation } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { requireUserLogin, logUserAction } from "~/utils/user-auth.server";
import { db } from "~/utils/db.server";
import { useState } from "react";

const CURRENT_TERMS_VERSION = "2025-08-24";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  
  // Check if onboarding is already completed
  const profile = await db.userProfile.findUnique({
    where: { userId: user.id },
  });
  
  const latestTerms = await db.termsConsent.findFirst({
    where: { 
      userId: user.id,
      revokedAt: null,
      version: CURRENT_TERMS_VERSION,
    },
  });
  
  // If already completed, redirect to account
  if (profile && latestTerms) {
    const url = new URL(request.url);
    const next = url.searchParams.get("next") || "/account";
    return redirect(next);
  }
  
  return json({ 
    user,
    hasProfile: !!profile,
    hasTermsConsent: !!latestTerms,
    termsVersion: CURRENT_TERMS_VERSION
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  const formData = await request.formData();
  
  // Extract form data
  const tosAgreed = formData.get("tosAgreed") === "on";
  const privacyAgreed = formData.get("privacyAgreed") === "on";
  const marketingAgreed = formData.get("marketingAgreed") === "on";
  const nickname = String(formData.get("nickname") || "").trim();
  const gender = String(formData.get("gender") || "");
  const birthDate = String(formData.get("birthDate") || "");
  
  const errors: Record<string, string> = {};
  
  // Validate terms consent
  if (!tosAgreed) {
    errors.tosAgreed = "이용약관 동의는 필수입니다.";
  }
  if (!privacyAgreed) {
    errors.privacyAgreed = "개인정보처리방침 동의는 필수입니다.";
  }
  
  // Validate profile data
  if (!nickname) {
    errors.nickname = "닉네임은 필수입니다.";
  } else if (nickname.length < 2 || nickname.length > 20) {
    errors.nickname = "닉네임은 2-20자 사이여야 합니다.";
  }
  
  // Optional gender validation
  if (gender && !["MALE", "FEMALE", "OTHER"].includes(gender)) {
    errors.gender = "올바른 성별을 선택해주세요.";
  }
  
  // Optional birth date validation
  if (birthDate) {
    const birthDateObj = new Date(birthDate);
    if (isNaN(birthDateObj.getTime())) {
      errors.birthDate = "올바른 생년월일을 입력해주세요.";
    } else {
      const today = new Date();
      const age = today.getFullYear() - birthDateObj.getFullYear();
      if (age < 1 || age > 120) {
        errors.birthDate = "올바른 생년월일을 입력해주세요.";
      }
    }
  }
  
  if (Object.keys(errors).length > 0) {
    return json({ errors, success: false }, { status: 400 });
  }
  
  try {
    // Transaction: Save terms consent and profile
    await db.$transaction(async (tx) => {
      // 1. Save terms consent
      await tx.termsConsent.create({
        data: {
          userId: user.id,
          version: CURRENT_TERMS_VERSION,
          tosAgreed,
          privacyAgreed,
          marketingAgreed,
          agreedAt: new Date(),
        },
      });
      
      // 2. Upsert user profile
      await tx.userProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          nickname,
          gender: gender || null,
          birthDate: birthDate ? new Date(birthDate) : null,
        },
        update: {
          nickname,
          gender: gender || null,
          birthDate: birthDate ? new Date(birthDate) : null,
          updatedAt: new Date(),
        },
      });
    });
    
    // 3. Log onboarding completion for audit
    await logUserAction(
      user,
      "ONBOARD_COMPLETE",
      { type: "UserProfile", id: user.id },
      {
        termsVersion: CURRENT_TERMS_VERSION,
        marketingAgreed,
        hasGender: !!gender,
        hasBirthDate: !!birthDate,
      },
      request
    );
    
    // Redirect to intended destination
    const url = new URL(request.url);
    const next = url.searchParams.get("next") || "/account";
    return redirect(next);
    
  } catch (error) {
    console.error("Onboarding save error:", error);
    return json(
      { 
        errors: { general: "저장 중 오류가 발생했습니다. 다시 시도해주세요." },
        success: false 
      },
      { status: 500 }
    );
  }
}

export default function Onboard() {
  const { user, hasProfile, hasTermsConsent, termsVersion } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(hasTermsConsent ? 2 : 1);
  
  const isSubmitting = navigation.state === "submitting";
  const errors = actionData?.errors || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-8 text-white">
            <div className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold">환영합니다!</h1>
              <p className="mt-2 text-blue-100">사주 작명 서비스 이용을 위한 간단한 설정을 완료해주세요</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-100' : 'bg-gray-200'}`}>
                  {hasTermsConsent ? (
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">1</span>
                  )}
                </div>
                <span className="ml-2 text-sm font-medium">약관 동의</span>
              </div>
              <div className="w-8 h-1 bg-gray-200 rounded">
                <div className={`h-full rounded transition-all duration-300 ${currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
              </div>
              <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-100' : 'bg-gray-200'}`}>
                  {hasProfile ? (
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">2</span>
                  )}
                </div>
                <span className="ml-2 text-sm font-medium">프로필 설정</span>
              </div>
            </div>
          </div>

          <Form method="post" className="p-6 space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-700">{errors.general}</p>
                </div>
              </div>
            )}

            {/* Step 1: Terms Consent */}
            {!hasTermsConsent && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">서비스 약관에 동의해주세요</h3>
                <div className="space-y-3">
                  <div className={`p-4 border rounded-lg ${errors.tosAgreed ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        name="tosAgreed"
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          이용약관 동의 <span className="text-red-500">*</span>
                        </span>
                        <p className="mt-1 text-xs text-gray-600">
                          사주 작명 서비스 이용을 위한 기본 약관입니다.
                        </p>
                      </div>
                    </label>
                    {errors.tosAgreed && (
                      <p className="mt-1 text-xs text-red-600">{errors.tosAgreed}</p>
                    )}
                  </div>

                  <div className={`p-4 border rounded-lg ${errors.privacyAgreed ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        name="privacyAgreed"
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          개인정보처리방침 동의 <span className="text-red-500">*</span>
                        </span>
                        <p className="mt-1 text-xs text-gray-600">
                          개인정보 수집 및 이용에 대한 동의입니다.
                        </p>
                      </div>
                    </label>
                    {errors.privacyAgreed && (
                      <p className="mt-1 text-xs text-red-600">{errors.privacyAgreed}</p>
                    )}
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        name="marketingAgreed"
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          마케팅 정보 수신 동의 <span className="text-gray-500">(선택)</span>
                        </span>
                        <p className="mt-1 text-xs text-gray-600">
                          새로운 서비스 및 이벤트 정보를 받아보시겠습니까?
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  약관 버전: {termsVersion} | 동의 철회는 계정 설정에서 가능합니다.
                </div>
              </div>
            )}

            {/* Step 2: Profile Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">기본 정보를 입력해주세요</h3>
              
              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                  닉네임 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nickname"
                  name="nickname"
                  maxLength={20}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.nickname ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="2-20자 사이로 입력해주세요"
                />
                {errors.nickname && (
                  <p className="mt-1 text-xs text-red-600">{errors.nickname}</p>
                )}
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  성별 <span className="text-gray-500">(선택)</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.gender ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">선택 안함</option>
                  <option value="MALE">남성</option>
                  <option value="FEMALE">여성</option>
                  <option value="OTHER">기타</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-xs text-red-600">{errors.gender}</p>
                )}
              </div>

              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
                  생년월일 <span className="text-gray-500">(선택)</span>
                </label>
                <input
                  type="date"
                  id="birthDate"
                  name="birthDate"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.birthDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.birthDate && (
                  <p className="mt-1 text-xs text-red-600">{errors.birthDate}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  더 정확한 사주 분석을 위해 제공해주세요
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-md hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    설정 저장 중...
                  </div>
                ) : (
                  "설정 완료하기"
                )}
              </button>
            </div>

            {/* Help Text */}
            <div className="text-center text-xs text-gray-500">
              설정은 언제든지 계정 페이지에서 변경할 수 있습니다
            </div>
          </Form>
        </div>

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              <strong>개발 정보:</strong> 사용자 {user.email} | 프로필: {hasProfile ? '완료' : '미완료'} | 약관: {hasTermsConsent ? '동의' : '미동의'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}