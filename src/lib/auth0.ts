import { Auth0Client } from "@auth0/nextjs-auth0/server";
import type { User as Auth0User } from "@auth0/nextjs-auth0/types";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function generateUniqueUsername(base: string) {
  const normalized = base.toLowerCase().replace(/[^a-z0-9_]/g, "") || "user";

  let candidate = normalized;
  let suffix = 0;
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    suffix += 1;
    candidate = `${normalized}${suffix}`;
  }
  return candidate;
}

async function syncUserFromAuth0(user: Auth0User) {
  if (!user.email) return;

  const displayName = user.name ?? user.nickname ?? user.email;

  const existing = await prisma.user.findUnique({ where: { auth0Id: user.sub } });
  if (existing) {
    await prisma.user.update({
      where: { auth0Id: user.sub },
      data: { email: user.email, displayName },
    });
    return;
  }

  const username = await generateUniqueUsername(user.nickname ?? user.email.split("@")[0]);
  await prisma.user.create({
    data: { auth0Id: user.sub, email: user.email, username, displayName },
  });
}

export const auth0 = new Auth0Client({
  async onCallback(error, ctx, session) {
    if (error) {
      return new NextResponse(error.message, { status: 500 });
    }

    if (session?.user) {
      await syncUserFromAuth0(session.user);
    }

    return NextResponse.redirect(new URL(ctx.returnTo || "/", ctx.appBaseUrl));
  },
});
