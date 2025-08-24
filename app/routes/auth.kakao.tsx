import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticator } from "~/utils/auth.server";

export async function loader() {
  return redirect("/admin/login");
}

export async function action({ request }: ActionFunctionArgs) {
  return authenticator.authenticate("kakao", request);
}