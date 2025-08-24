import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  return authenticator.authenticate("kakao", request, {
    successRedirect: "/admin",
    failureRedirect: "/admin/login",
  });
}