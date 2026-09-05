"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Briefcase,
  ClipboardList,
  Home,
  NotebookPen,
  PanelRight,
  Timer,
} from "lucide-react";

import { CopilotPanel } from "@/components/workspace/copilot-panel";
import { APP_NAV } from "@/components/workspace/nav";
import { useWorkspaceState } from "@/components/workspace/workspace-state";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import type { CopilotMessage } from "@/lib/db/schema";

const ICONS = {
  Home,
  Notes: NotebookPen,
  Interview: ClipboardList,
  Jobs: Briefcase,
  Focus: Timer,
};

type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function WorkspaceShell({
  user,
  geminiReady,
  initialMessages,
  children,
}: {
  user: User;
  geminiReady: boolean;
  initialMessages: CopilotMessage[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { copilotOpen, setCopilotOpen } = useWorkspaceState();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCopilotOpen(!copilotOpen);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copilotOpen, setCopilotOpen]);

  return (
    <div className="flex min-h-svh bg-theme-ecru-white text-theme-forest-green">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
        <Brand />
        <Nav pathname={pathname} />
        <UserFooter user={user} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <Sheet>
            <SheetTrigger
              render={<Button variant="outline" size="sm" />}
            >
              Menu
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <Brand />
              <Nav pathname={pathname} />
              <UserFooter user={user} />
            </SheetContent>
          </Sheet>
          <span className="font-semibold">Chillmate</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCopilotOpen(true)}
          >
            <PanelRight className="size-4" />
          </Button>
        </header>
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-auto p-4 md:p-8">
            {children}
          </main>
          <CopilotPanel
            open={copilotOpen}
            onOpenChange={setCopilotOpen}
            geminiReady={geminiReady}
            initialMessages={initialMessages}
          />
        </div>
        <nav className="grid grid-cols-5 border-t border-border bg-card md:hidden">
          {APP_NAV.map((item) => {
            const Icon = ICONS[item.label];
            const active =
              item.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[11px]",
                  active ? "text-theme-forest-green" : "text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <button
        type="button"
        className="fixed right-4 bottom-20 z-30 hidden size-10 items-center justify-center rounded-full bg-theme-orange text-theme-forest-green shadow md:flex"
        onClick={() => setCopilotOpen(!copilotOpen)}
        aria-label="Toggle copilot"
      >
        <PanelRight className="size-4" />
      </button>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-4 py-4">
      <Image
        src="/assets/images/logo.png"
        alt=""
        width={28}
        height={28}
        className="rounded"
      />
      <span className="font-semibold tracking-wide">Chillmate</span>
    </div>
  );
}

function Nav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {APP_NAV.map((item) => {
        const Icon = ICONS[item.label];
        const active =
          item.href === "/app"
            ? pathname === "/app"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
              active
                ? "bg-theme-forest-green text-theme-ecru-white"
                : "hover:bg-muted",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter({ user }: { user: User }) {
  return (
    <div className="mt-auto border-t border-border p-3">
      <div className="mb-2 flex items-center gap-2 px-1">
        {user.image ? (
          <Image
            src={user.image}
            alt=""
            width={28}
            height={28}
            className="rounded-full"
          />
        ) : (
          <div className="size-7 rounded-full bg-muted" />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user.name ?? "You"}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <form action={signOutAction}>
        <Button type="submit" variant="ghost" size="sm" className="w-full">
          Sign out
        </Button>
      </form>
    </div>
  );
}
