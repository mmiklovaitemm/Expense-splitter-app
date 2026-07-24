"use client";

import { useActionState, useLayoutEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import gsap from "gsap";
import { loginAction, signupAction, guestAction } from "./actions";
import { Split, ArrowRight } from "lucide-react";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginFormAction] = useActionState(loginAction, undefined);
  const [signupState, signupFormAction] = useActionState(signupAction, undefined);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestPending, setGuestPending] = useState(false);

  const error = mode === "login" ? loginState?.error : signupState?.error;

  const glowRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(glowRef.current, { opacity: 0, scale: 0.6 });
      gsap.set(logoRef.current, { opacity: 0, y: -24, scale: 0.4, rotate: -20 });
      gsap.set([headingRef.current, subRef.current], { opacity: 0, y: 16 });
      gsap.set(cardRef.current, { opacity: 0, y: 36, scale: 0.94 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(glowRef.current, { opacity: 1, scale: 1, duration: 1.1, ease: "power2.out" }, 0)
        .to(logoRef.current, { opacity: 1, y: 0, scale: 1, rotate: 0, duration: 0.75, ease: "back.out(1.9)" }, 0.05)
        .to(headingRef.current, { opacity: 1, y: 0, duration: 0.55 }, 0.35)
        .to(subRef.current, { opacity: 1, y: 0, duration: 0.55 }, 0.45)
        .to(cardRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "back.out(1.4)" }, 0.5);

      gsap.to(glowRef.current, {
        y: 18,
        duration: 4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.1,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div
        ref={glowRef}
        className="pointer-events-none absolute -top-24 h-96 w-96 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div ref={logoRef} className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]">
            <Split className="h-5 w-5 text-white" />
          </div>
          <h1 ref={headingRef} className="text-xl font-semibold">Expense Splitter</h1>
          <p ref={subRef} className="text-sm text-[var(--muted)]">
            Split shared costs, track balances, settle up.
          </p>
        </div>

        <div ref={cardRef} className="card p-6">
          <div className="mb-5 flex rounded-[var(--radius-sm)] bg-[var(--background)] p-1 text-sm">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-[6px] py-1.5 font-medium transition-colors ${
                mode === "login" ? "bg-[var(--surface-hover)] text-white" : "text-[var(--muted)]"
              }`}
            >
              Log in
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-[6px] py-1.5 font-medium transition-colors ${
                mode === "signup" ? "bg-[var(--surface-hover)] text-white" : "text-[var(--muted)]"
              }`}
            >
              Sign up
            </button>
          </div>

          {mode === "login" ? (
            <form action={loginFormAction} className="flex flex-col gap-3">
              <input
                name="email"
                type="email"
                required
                placeholder="Email"
                className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
              <input
                name="password"
                type="password"
                required
                placeholder="Password"
                className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
              <SubmitButton>Log in</SubmitButton>
            </form>
          ) : (
            <form action={signupFormAction} className="flex flex-col gap-3">
              <input
                name="name"
                required
                placeholder="Name"
                className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="Email"
                className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
              <input
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="Password (min 8 characters)"
                className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
              <SubmitButton>Create account</SubmitButton>
            </form>
          )}

          {error && <p className="mt-3 text-sm text-[var(--negative)]">{error}</p>}

          <div className="my-5 flex items-center gap-3 text-xs text-[var(--muted-2)]">
            <div className="h-px flex-1 bg-[var(--border)]" />
            or
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <button
            disabled={guestPending}
            onClick={async () => {
              setGuestPending(true);
              setGuestError(null);
              const res = await guestAction();
              if (res?.error) {
                setGuestError(res.error);
                setGuestPending(false);
              }
            }}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-60"
          >
            {guestPending ? "Loading demo…" : "Continue as guest"}
            <ArrowRight className="h-4 w-4" />
          </button>
          {guestError && <p className="mt-2 text-sm text-[var(--negative)]">{guestError}</p>}
          <p className="mt-2 text-center text-xs text-[var(--muted-2)]">
            Explore with pre-loaded groups and expenses, no account needed.
          </p>
        </div>
      </div>
    </div>
  );
}
