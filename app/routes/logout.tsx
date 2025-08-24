import type { LoaderFunctionArgs } from "@remix-run/node";
import { logoutUser } from "~/utils/user-session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Logout user and redirect to home page
  return await logoutUser(request, "/");
}

// This component should never render as we always redirect
export default function UserLogout() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">로그아웃 중...</p>
      </div>
    </div>
  );
}