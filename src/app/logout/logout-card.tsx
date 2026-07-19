"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export function LogoutCard() {
  const router = useRouter();

  return (
    <div className="bg-background flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-border p-8 text-center shadow-lg">
      <Logo className="size-10" />
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold">Log out of Yapper?</h1>
        <p className="text-muted-foreground text-sm">
          You can always log back in at any time.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <Button asChild className="w-full rounded-full font-bold">
          <Link href="/auth/logout">Log out</Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-full font-bold"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
