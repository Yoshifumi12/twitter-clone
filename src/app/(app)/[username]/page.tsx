import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

type ProfilePageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: { displayName: true },
  });

  return {
    title: `${user?.displayName ?? username} (@${username})`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  return <p>@{username}</p>;
}
