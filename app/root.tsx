import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react"
import type { LinksFunction } from "@remix-run/node"
import { Toaster } from "~/components/ui/toaster"
import { Header } from "~/components/layout/Header"
import { Footer } from "~/components/layout/Footer"

import globalStyles from "./globals.css?url"

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: globalStyles },
]

export default function App() {
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
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}