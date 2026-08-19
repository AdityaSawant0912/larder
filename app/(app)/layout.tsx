import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/auth";
import { AppShell } from "@/components/nav/app-shell";

// Five real destinations (docs/07-screens-mobile): Home, Grocery List,
// Use-soon, Settings/Catalog, bottom tabs on mobile / sidebar on desktop.
// Clear-Out and Restock are modes inside Home, not routes.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return <AppShell user={{ name: session.user.name, email: session.user.email }}>{children}</AppShell>;
}
