import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { userAuthenticator } from "~/utils/user-auth.server";
import { db } from "~/utils/db.server";
import { createUserSession } from "~/utils/user-session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo") || "/account";

  try {
    // Authenticate with Google
    const user = await userAuthenticator.authenticate("google", request, {
      throwOnError: true,
    });

    // Check if user has completed profile and terms
    const profile = await db.userProfile.findUnique({
      where: { userId: user.id },
    });

    const latestTerms = await db.termsConsent.findFirst({
      where: { 
        userId: user.id,
        revokedAt: null,
      },
      orderBy: { agreedAt: 'desc' },
    });

    // Create user session
    await createUserSession(user.id, {
      emailVerified: user.emailVerified,
      oidcSub: `${user.provider.toLowerCase()}:${user.providerId}`,
    });

    // Redirect to onboarding if profile/terms incomplete
    if (!profile || !latestTerms) {
      return redirect("/onboard");
    }

    // Redirect to intended destination
    return redirect(redirectTo);
    
  } catch (error: any) {
    // Log authentication error
    console.error("Google OAuth callback error:", error);
    
    // Redirect to login with error message
    const errorMessage = error.message || "구글 로그인 중 오류가 발생했습니다.";
    return redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
  }
}