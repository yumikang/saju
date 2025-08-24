import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { requireUser, logAdminAction } from "~/utils/auth.server";
import { db } from "~/utils/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  // Get all OAuth accounts linked to this user
  const oauthAccounts = await db.userOAuth.findMany({
    where: { userId: user.id },
    orderBy: { linkedAt: "desc" },
  });

  // Get available providers that are not yet linked
  const linkedProviders = oauthAccounts.map(a => a.provider);
  const allProviders = ["GOOGLE", "KAKAO", "NAVER"];
  const availableProviders = allProviders.filter(p => !linkedProviders.includes(p as any));

  return json({
    user,
    oauthAccounts,
    availableProviders,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const accountId = formData.get("accountId") as string;

  if (accountId) {
    // Verify the account belongs to this user
    const oauth = await db.userOAuth.findFirst({
      where: {
        id: accountId,
        userId: user.id,
      },
    });

    if (!oauth) {
      throw new Response("Not Found", { status: 404 });
    }

    // Check if this is the last linked account
    const accountCount = await db.userOAuth.count({
      where: { userId: user.id },
    });

    if (accountCount <= 1) {
      throw new Response("Cannot unlink the last account", { status: 400 });
    }

    // Delete the OAuth account
    await db.userOAuth.delete({
      where: { id: accountId },
    });

    // Log the action
    await logAdminAction(
      user,
      "ACCOUNT_UNLINKED",
      { type: "UserOAuth", id: accountId },
      { provider: oauth.provider },
      request
    );

    return redirect("/admin/account-link");
  }

  return json({ error: "Invalid request" }, { status: 400 });
}

export default function AccountLink() {
  const { user, oauthAccounts, availableProviders } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b">
            <h1 className="text-xl font-semibold text-gray-900">계정 연결 관리</h1>
            <p className="mt-1 text-sm text-gray-600">
              여러 소셜 로그인 계정을 하나의 계정으로 연결할 수 있습니다.
            </p>
          </div>

          <div className="p-6">
            {/* Current User Info */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-sm font-medium text-gray-700 mb-2">현재 로그인 정보</h2>
              <div className="space-y-1">
                <p className="text-sm text-gray-900">이메일: {user.email}</p>
                <p className="text-sm text-gray-900">권한: {user.role}</p>
              </div>
            </div>

            {/* Linked Accounts */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">연결된 계정</h2>
              <div className="space-y-3">
                {oauthAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {account.provider === "GOOGLE" && "G"}
                        {account.provider === "KAKAO" && "K"}
                        {account.provider === "NAVER" && "N"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{account.provider}</p>
                        <p className="text-sm text-gray-500">{account.email || account.name}</p>
                        <p className="text-xs text-gray-400">
                          연결일: {new Date(account.linkedAt).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                    </div>
                    {oauthAccounts.length > 1 && (
                      <Form method="post">
                        <input type="hidden" name="accountId" value={account.id} />
                        <button
                          type="submit"
                          className="text-sm text-red-600 hover:text-red-800"
                          onClick={(e) => {
                            if (!confirm("이 계정 연결을 해제하시겠습니까?")) {
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
            </div>

            {/* Available to Link */}
            {availableProviders.length > 0 && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">계정 연결 추가</h2>
                <div className="space-y-3">
                  {availableProviders.map((provider) => (
                    <Form key={provider} method="post" action={`/auth/${provider.toLowerCase()}`}>
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        {provider === "GOOGLE" && "Google 계정 연결"}
                        {provider === "KAKAO" && "카카오 계정 연결"}
                        {provider === "NAVER" && "네이버 계정 연결"}
                      </button>
                    </Form>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}