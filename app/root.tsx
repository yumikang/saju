import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "@remix-run/react"
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { Toaster } from "~/components/ui/toaster"
import { Header } from "~/components/layout/Header"
import { Footer } from "~/components/layout/Footer"
import { getOptionalUser } from "~/utils/user-session.server"
import { db } from "~/utils/db.server"

import globalStyles from "./globals.css?url"

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: globalStyles },
]

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const sessionUser = await getOptionalUser(request)

    let user = null
    if (sessionUser && typeof sessionUser.userId === 'string') {
      user = await db.user.findUnique({
        where: { id: sessionUser.userId },
        select: {
          id: true,
          email: true,
          name: true,
        }
      })
    }

    return json({ user })
  } catch (error) {
    console.error('Error in root loader:', error)
    return json({ user: null })
  }
}

export default function App() {
  const location = useLocation();
  const isKSajuPage = location.pathname === '/k-saju';

  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="min-h-screen flex flex-col">
          {!isKSajuPage && <Header />}
          <main className={isKSajuPage ? "" : "flex-1"}>
            <Outlet />
          </main>
          {!isKSajuPage && <Footer />}
        </div>
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}