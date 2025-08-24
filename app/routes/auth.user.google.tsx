import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { userAuthenticator } from "~/utils/user-auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  return userAuthenticator.authenticate("google", request);
}

export async function action({ request }: ActionFunctionArgs) {
  return userAuthenticator.authenticate("google", request);
}