import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { userAuthenticator } from "~/utils/user-auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error("[OAuth] Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");

    // Get redirect URL from query params
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get("redirectTo") || "/account";

    // Redirect back with error message
    return redirect(`/login?error=google_not_configured&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  try {
    return await userAuthenticator.authenticate("google", request);
  } catch (error) {
    console.error("[OAuth] Google authentication error:", error);

    // Get redirect URL from query params
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get("redirectTo") || "/account";

    // Redirect back with generic error
    return redirect(`/login?error=oauth_failed&redirectTo=${encodeURIComponent(redirectTo)}`);
  }
}

export async function action({ request }: ActionFunctionArgs) {
  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return json(
      {
        error: "Google 소셜 로그인이 현재 설정되지 않았습니다. 다른 로그인 방법을 사용해주세요.",
        code: "OAUTH_NOT_CONFIGURED"
      },
      { status: 503 }
    );
  }

  try {
    return await userAuthenticator.authenticate("google", request);
  } catch (error) {
    console.error("[OAuth] Google authentication error:", error);
    return json(
      {
        error: "소셜 로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        code: "OAUTH_ERROR"
      },
      { status: 500 }
    );
  }
}