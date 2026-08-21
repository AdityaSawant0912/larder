import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/auth";
import { LandingPage } from "@/components/landing/landing-page";

export default async function IndexPage() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/app");
  }

  return <LandingPage />;
}
