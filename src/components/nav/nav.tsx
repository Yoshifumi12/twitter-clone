"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Bell,
  UserPlus,
  MessageCircle,
  Bookmark,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/explore", icon: Search },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Connect", href: "/connect", icon: UserPlus },
  { label: "Chat", href: "/chat", icon: MessageCircle },
  { label: "Bookmarks", href: "/bookmarks", icon: Bookmark },
];

type NavProps = {
  displayName: string;
  username: string;
};

export function Nav({ displayName, username }: NavProps) {
  const pathname = usePathname();
  const items = [
    ...NAV_ITEMS,
    { label: "Profile", href: `/${username}`, icon: User },
  ];

  return (
    <nav className="flex w-64 shrink-0 flex-col justify-between border-r border-zinc-200 py-4 dark:border-zinc-800">
      <div className="flex flex-col gap-1">
        {items.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex items-center gap-6 rounded-full px-4 py-3 text-xl hover:bg-zinc-100 dark:hover:bg-zinc-900",
                isActive && "font-bold",
              )}
            >
              <Icon className="size-6" />
              {label}
            </Link>
          );
        })}

        <Button className="mt-4 !h-12 w-6/7 rounded-full font-bold" size="lg">
          <p className="items-center text-lg">Post</p>
        </Button>
      </div>

      <div className="flex items-center gap-3 rounded-full p-3 hover:bg-zinc-100 dark:hover:bg-zinc-900">
        <div className="size-10 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold">{displayName}</span>
          <span className="truncate text-sm text-zinc-500 dark:text-zinc-400">
            @{username}
          </span>
        </div>
      </div>
    </nav>
  );
}
