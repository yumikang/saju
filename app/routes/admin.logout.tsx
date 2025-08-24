import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/utils/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  return authenticator.logout(request, { redirectTo: "/admin/login" });
}

export async function loader({ request }: ActionFunctionArgs) {
  // Redirect to login if accessed via GET
  return authenticator.logout(request, { redirectTo: "/admin/login" });
}