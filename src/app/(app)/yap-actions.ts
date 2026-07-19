"use server";

import { revalidatePath } from "next/cache";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";
import { YAP_MAX_LENGTH, yapSchema } from "@/lib/validations/yap";

async function getCurrentUserId() {
  const session = await auth0.getSession();
  if (!session) throw new Error("Not signed in.");

  const user = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: { id: true },
  });
  if (!user) throw new Error("Not signed in.");

  return user.id;
}

export async function createYapThread(contents: string[], parentId?: string) {
  const authorId = await getCurrentUserId();
  if (contents.length === 0) throw new Error("Nothing to post.");

  const parsedContents = contents.map((content) => {
    const submission = yapSchema.safeParse({ content, parentId });
    if (!submission.success) {
      throw new Error(submission.error.issues[0]?.message ?? "Invalid yap.");
    }
    return submission.data.content;
  });

  const yaps = await prisma.$transaction(async (tx) => {
    const created = [];
    let currentParentId = parentId;
    for (const content of parsedContents) {
      const yap = await tx.yap.create({
        data: {
          content,
          parentId: currentParentId,
          authorId,
          status: "PUBLISHED",
        },
      });
      created.push(yap);
      currentParentId = yap.id;
    }
    return created;
  });

  revalidatePath("/");
  return yaps;
}

export async function createYap(content: string, parentId?: string) {
  const [yap] = await createYapThread([content], parentId);
  return yap;
}

export async function saveDraft(
  content: string,
  draftId?: string,
  parentId?: string,
) {
  const authorId = await getCurrentUserId();
  const trimmed = content.trim().slice(0, YAP_MAX_LENGTH);
  if (!trimmed) throw new Error("Nothing to save.");

  if (draftId) {
    const existing = await prisma.yap.findUnique({ where: { id: draftId } });
    if (
      !existing ||
      existing.authorId !== authorId ||
      existing.status !== "DRAFT"
    ) {
      throw new Error("Draft not found.");
    }

    return prisma.yap.update({
      where: { id: draftId },
      data: { content: trimmed },
    });
  }

  return prisma.yap.create({
    data: { content: trimmed, parentId, authorId, status: "DRAFT" },
  });
}

export async function deleteDraft(draftId: string) {
  const authorId = await getCurrentUserId();

  const existing = await prisma.yap.findUnique({ where: { id: draftId } });
  if (
    !existing ||
    existing.authorId !== authorId ||
    existing.status !== "DRAFT"
  ) {
    return;
  }

  await prisma.yap.delete({ where: { id: draftId } });
}

/**
 * Removes a single draft from the middle of a thread chain, reparenting its
 * child (if any) so the rest of the chain stays intact instead of cascading.
 */
export async function removeDraftFromThread(draftId: string) {
  const authorId = await getCurrentUserId();

  const existing = await prisma.yap.findUnique({ where: { id: draftId } });
  if (
    !existing ||
    existing.authorId !== authorId ||
    existing.status !== "DRAFT"
  ) {
    return;
  }

  const child = await prisma.yap.findFirst({
    where: { parentId: draftId, authorId, status: "DRAFT" },
  });

  if (child) {
    await prisma.yap.update({
      where: { id: child.id },
      data: { parentId: existing.parentId },
    });
  }

  await prisma.yap.delete({ where: { id: draftId } });
}

export async function listDrafts(parentId?: string) {
  const authorId = await getCurrentUserId();

  return prisma.yap.findMany({
    where: { authorId, status: "DRAFT", parentId: parentId ?? null },
    select: { id: true, content: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listDraftChain(rootId: string) {
  const authorId = await getCurrentUserId();

  const chain: { id: string; content: string }[] = [];
  let currentId: string | undefined = rootId;

  while (currentId) {
    const node: Awaited<ReturnType<typeof prisma.yap.findUnique>> =
      await prisma.yap.findUnique({ where: { id: currentId } });
    if (!node || node.authorId !== authorId || node.status !== "DRAFT") break;
    chain.push({ id: node.id, content: node.content });

    const child: { id: string } | null = await prisma.yap.findFirst({
      where: { parentId: node.id, authorId, status: "DRAFT" },
      select: { id: true },
    });
    currentId = child?.id;
  }

  return chain;
}
