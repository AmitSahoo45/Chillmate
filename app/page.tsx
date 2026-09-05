import Image from "next/image";
import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { isGoogleAuthConfigured } from "@/lib/env";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.72.13-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
      />
    </svg>
  );
}

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/app");
  }

  const googleReady = isGoogleAuthConfigured();

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-theme-forest-green text-theme-ecru-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-16 size-[28rem] rounded-full bg-theme-orange/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-6rem] bottom-[-4rem] size-[22rem] rounded-full bg-theme-ferrari-red/20 blur-3xl"
        />
        <div className="relative z-10 flex flex-1 flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/images/logo.png"
              alt=""
              width={40}
              height={40}
              className="rounded-md ring-2 ring-theme-ecru-white/40"
            />
            <span className="text-xl font-semibold tracking-wide">
              Chillmate
            </span>
          </div>
          <div>
            <p className="flex flex-col text-6xl font-semibold leading-[0.95] tracking-tight xl:text-7xl">
              <span className="text-theme-orange">Code.</span>
              <span className="mt-1 text-theme-ferrari-red">Relax.</span>
              <span className="mt-1">Innovate.</span>
            </p>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-theme-ecru-white/85">
              The workspace for people who study, apply, and ship — without
              bouncing between five tabs.
            </p>
          </div>
          <div className="relative h-56">
            <Image
              src="/assets/images/developer_activity.svg"
              alt=""
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col bg-theme-ecru-white text-theme-forest-green">
        <header className="flex items-center gap-3 p-6 lg:hidden">
          <Image
            src="/assets/images/logo.png"
            alt="Chillmate"
            width={36}
            height={36}
            className="rounded-md"
          />
          <span className="text-lg font-semibold tracking-wide">Chillmate</span>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            <p className="text-xs font-semibold tracking-[0.22em] text-theme-ferrari-red uppercase">
              Sign in
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-base leading-relaxed text-theme-forest-green/75">
              Continue with Google to open notes, interviews, jobs, and focus.
            </p>
            {googleReady ? (
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/app" });
                }}
              >
                <Button
                  type="submit"
                  size="lg"
                  className="mt-8 h-12 w-full gap-2 rounded-xl border border-[#dadce0] bg-white text-base font-medium text-[#3c4043] hover:bg-white"
                >
                  <GoogleMark />
                  Continue with Google
                </Button>
              </form>
            ) : (
              <Button
                size="lg"
                disabled
                className="mt-8 h-12 w-full gap-2 rounded-xl border border-[#dadce0] bg-white text-base font-medium text-[#3c4043] disabled:opacity-100 disabled:shadow-sm"
                title="Add AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in .env.local"
              >
                <GoogleMark />
                Continue with Google
              </Button>
            )}
            <p className="mt-4 text-center text-xs text-theme-forest-green/55">
              One account. Your work stays private.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
