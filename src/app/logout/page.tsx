import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { LogoutCard } from "./logout-card";

export const metadata: Metadata = {
  title: "Log out",
};

export default async function LogoutPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/signin");
  }

  return (
    <main className="bg-muted flex min-h-svh items-center justify-center p-6">
      <LogoutCard />
    </main>
  );
}
