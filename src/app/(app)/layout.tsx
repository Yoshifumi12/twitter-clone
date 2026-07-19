import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/nav/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/signin");
  }

  const user = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: { displayName: true, username: true },
  });

  return (
    <div className="flex flex-1 mx-20">
      <Nav
        displayName={user?.displayName ?? session.user.name ?? ""}
        username={user?.username ?? ""}
      />
      <main className="flex flex-1 items-center justify-center">
        {children}
      </main>
    </div>
  );
}
