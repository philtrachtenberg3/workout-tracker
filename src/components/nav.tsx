"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Mic, History, MessageCircleQuestion } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Record", icon: Mic },
  { href: "/history", label: "History", icon: History },
  { href: "/ask", label: "Ask", icon: MessageCircleQuestion },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-0.5 py-1 text-xs font-medium"
            >
              <span
                className={cn(
                  "flex items-center justify-center rounded-full px-4 py-1 transition-colors",
                  active ? "bg-primary/12 text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className={cn("transition-colors", active ? "text-primary" : "text-muted-foreground")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
