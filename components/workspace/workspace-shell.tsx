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

import { QuickDump } from "@/components/notes/quick-dump";
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

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function WorkspaceShell({
  user,
  geminiReady,
  initialMessages,
  dumpSubjects,
  children,
}: {
  user: User;
  geminiReady: boolean;
  initialMessages: CopilotMessage[];
  dumpSubjects: Array<{ id: string; name: string }>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const {
    copilotOpen,
    setCopilotOpen,
    dumpOpen,
    setDumpOpen,
    remaining,
    isPaused,
  } = useWorkspaceState();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCopilotOpen(!copilotOpen);
      }
      if (
        (event.metaKey || event.ctrlKey) &&
        (event.key.toLowerCase() === "n" ||
          (event.shiftKey && event.key.toLowerCase() === "d"))
      ) {
        event.preventDefault();
        setDumpOpen(!dumpOpen);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copilotOpen, dumpOpen, setCopilotOpen, setDumpOpen]);

  useEffect(() => {
    const base = "Chillmate";
    if (isPaused) {
      document.title = base;
      return;
    }
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    document.title = `${pad(minutes)}:${pad(seconds)} · ${base}`;
  }, [isPaused, remaining]);

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <Brand />
        <Nav pathname={pathname} remaining={remaining} isPaused={isPaused} />
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
              <Nav pathname={pathname} remaining={remaining} isPaused={isPaused} />
              <UserFooter user={user} />
            </SheetContent>
          </Sheet>
          <span className="font-semibold">Chillmate</span>
          <Button variant="accent" size="sm" onClick={() => setDumpOpen(true)}>
            Dump
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCopilotOpen(true)}
            aria-label="Open copilot"
          >
            <PanelRight className="size-4" />
          </Button>
        </header>
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-auto p-4 md:p-8">
            <div className="mx-auto w-full max-w-4xl">{children}</div>
          </main>
          <CopilotPanel
            open={copilotOpen}
            onOpenChange={setCopilotOpen}
            geminiReady={geminiReady}
            initialMessages={initialMessages}
          />
        </div>
        <nav className="grid grid-cols-5 border-t border-sidebar-border bg-sidebar md:hidden">
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
      <div className="fixed right-4 bottom-20 z-30 hidden md:block">
        <Button
          type="button"
          variant="accent"
          size="icon"
          className="rounded-full shadow"
          onClick={() => setCopilotOpen(!copilotOpen)}
          aria-label="Toggle copilot"
          aria-pressed={copilotOpen}
        >
          <PanelRight className="size-4" />
        </Button>
      </div>
      <Sheet open={dumpOpen} onOpenChange={setDumpOpen}>
        <SheetContent side="right" className="w-full overflow-auto p-4 sm:max-w-md">
          <p className="mb-3 text-sm font-semibold">Dump · Ctrl+N</p>
          <QuickDump compact subjects={dumpSubjects} autoFocus={dumpOpen} />
        </SheetContent>
      </Sheet>
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

function Nav({
  pathname,
  remaining,
  isPaused,
}: {
  pathname: string;
  remaining: number;
  isPaused: boolean;
}) {
  const { setDumpOpen } = useWorkspaceState();
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {APP_NAV.map((item) => {
        const Icon = ICONS[item.label];
        const active =
          item.href === "/app"
            ? pathname === "/app"
            : pathname.startsWith(item.href);
        const focusTime =
          item.href === "/app/focus" && !isPaused
            ? ` ${pad(Math.floor(remaining / 60))}:${pad(remaining % 60)}`
            : "";
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "hover:bg-sidebar-accent",
            )}
          >
            <Icon className="size-4" />
            {item.label}
            {focusTime}
          </Link>
        );
      })}
      <Button
        type="button"
        variant="accent"
        size="sm"
        className="mt-2 justify-start"
        onClick={() => setDumpOpen(true)}
      >
        Dump
      </Button>
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
