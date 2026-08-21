"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Layers,
  Clock,
  ShoppingCart,
  ClipboardCopy,
  TrendingDown,
  Repeat,
  Search,
  Store,
  ArrowRight,
  Download,
  Apple,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const FADE_UP = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const SHOWCASE = [
  {
    icon: Layers,
    title: "Track it, however it actually comes",
    body: "Add what you buy in whatever unit makes sense. Cut a watermelon into containers? Convert it — pull out just what you sliced, the rest stays whole. Used half of something? Larder splits the leftover into its own form automatically.",
    image: "/screenshots/home.jpg",
  },
  {
    icon: Clock,
    title: "See what's about to turn, before it does",
    body: "One dashboard, every location. Fridge, freezer, pantry, counter — everything sorted by what's closest to its shelf-life, so \"what should I cook tonight\" has an answer.",
    image: "/screenshots/use-soon.jpg",
  },
  {
    icon: ShoppingCart,
    title: "A grocery list that knows what's already on hand",
    body: "Build the list, check things off while you're actually in the store, or bulk-add an online order straight into your pantry in one action.",
    image: "/screenshots/grocery.jpg",
  },
] as const;

// Captured once the app's actual mobile (bottom-tab-bar) layout is
// screenshotted at a real narrow viewport — see docs/07-screens-mobile.
const MOBILE_SHOTS = ["/screenshots/mobile-home.jpg", "/screenshots/mobile-use-soon.jpg"] as const;

const GRID_FEATURES = [
  { icon: TrendingDown, title: "Running-low alerts", body: "Set a threshold per item, per unit — get flagged before you're actually out." },
  { icon: Repeat, title: "Repeat your usual order", body: "Save a list as a template, drop it into a new grocery run in one tap." },
  { icon: Search, title: "Typo-tolerant search", body: "Search a shared catalog first, your own next, manual entry as the fallback." },
  { icon: Store, title: "Store-aware shopping", body: "Tag list items to the store you'll actually buy them at." },
  { icon: ClipboardCopy, title: "Export for recipe ideas", body: "Copy your whole pantry as plain text, paste it into your favorite LLM." },
] as const;

export function LandingPage() {
  return (
    <div className="relative">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Button variant="ghost" nativeButton={false} render={<Link href="/login">Sign in</Link>} />
          <Button nativeButton={false} render={<Link href="/signup">Get started</Link>} />
        </nav>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 pt-12 pb-16 text-center md:pt-20">
        <motion.h1
          {...FADE_UP}
          className="font-display text-5xl leading-tight md:text-7xl"
        >
          Know what&apos;s in your kitchen. <br className="hidden md:block" />
          Before it&apos;s too late.
        </motion.h1>
        <motion.p
          {...FADE_UP}
          transition={{ ...FADE_UP.transition, delay: 0.1 }}
          className="max-w-xl text-lg text-muted-foreground"
        >
          Things rot in the back of the fridge because it&apos;s hard to track what&apos;s stored where, and for how
          long. Larder tracks pantry stock by location, with a real freshness countdown — plus a grocery list that
          already knows what you have.
        </motion.p>
        <motion.div {...FADE_UP} transition={{ ...FADE_UP.transition, delay: 0.2 }} className="flex gap-3">
          <Button size="lg" nativeButton={false} render={<Link href="/signup">Get started free <ArrowRight /></Link>} />
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/login">Sign in</Link>} />
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-8">
        <motion.div
          {...FADE_UP}
          className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-foreground/10"
        >
          <BrowserFrameHeader />
          <img src="/screenshots/home.jpg" alt="Larder's Home screen, showing pantry items grouped with freshness gauges" className="block w-full" />
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl space-y-24 px-6 py-24">
        {SHOWCASE.map((feature, i) => (
          <ShowcaseRow key={feature.title} feature={feature} reversed={i % 2 === 1} />
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <motion.h2 {...FADE_UP} className="mb-10 text-center font-display text-4xl">
          And everything else that keeps a kitchen running
        </motion.h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GRID_FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              {...FADE_UP}
              transition={{ ...FADE_UP.transition, delay: (i % 3) * 0.05 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <f.icon className="mb-3 size-5 text-primary" />
              <h3 className="mb-1 font-medium">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-24 md:grid-cols-2">
        <motion.div {...FADE_UP} className="flex justify-center gap-4">
          <PhoneFrame src={MOBILE_SHOTS[0]} alt="Larder's Home screen on mobile" className="rotate-[-4deg]" />
          <PhoneFrame src={MOBILE_SHOTS[1]} alt="Larder's Use Soon screen on mobile" className="mt-10 rotate-[4deg]" />
        </motion.div>
        <motion.div {...FADE_UP} transition={{ ...FADE_UP.transition, delay: 0.1 }}>
          <h2 className="mb-3 font-display text-4xl">Take it to the kitchen</h2>
          <p className="mb-6 text-muted-foreground">
            The pantry&apos;s not next to your laptop. Get the native app and add, consume, and check your list from
            your phone.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              className="gap-2"
              render={
                <a href="/downloads/larder.apk" download>
                  <Download /> Android (APK)
                </a>
              }
            />
            <Button size="lg" variant="outline" disabled className="gap-2">
              <Apple /> iOS
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Coming soon</span>
            </Button>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <motion.h2 {...FADE_UP} className="mb-4 font-display text-4xl md:text-5xl">
          Stop guessing what&apos;s in there.
        </motion.h2>
        <motion.p {...FADE_UP} transition={{ ...FADE_UP.transition, delay: 0.1 }} className="mb-8 text-muted-foreground">
          Free to start. Takes a minute to set up your first shelf.
        </motion.p>
        <motion.div {...FADE_UP} transition={{ ...FADE_UP.transition, delay: 0.2 }}>
          <Button size="lg" nativeButton={false} render={<Link href="/signup">Get started free <ArrowRight /></Link>} />
        </motion.div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col items-center gap-2 border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        <p>Made with 💖</p>
        <p>
          Created by{" "}
          <a href="https://adityasawant.dev" target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">
            Aditya Sawant
          </a>
        </p>
      </footer>
    </div>
  );
}

function ShowcaseRow({
  feature,
  reversed,
}: {
  feature: (typeof SHOWCASE)[number];
  reversed: boolean;
}) {
  return (
    <div className={`grid grid-cols-1 items-center gap-10 md:grid-cols-2 ${reversed ? "md:[&>*:first-child]:order-2" : ""}`}>
      <motion.div {...FADE_UP}>
        <feature.icon className="mb-4 size-8 text-primary" />
        <h3 className="mb-3 font-display text-3xl">{feature.title}</h3>
        <p className="text-muted-foreground">{feature.body}</p>
      </motion.div>
      <motion.div {...FADE_UP} className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-foreground/5">
        <BrowserFrameHeader />
        <img src={feature.image} alt={feature.title} className="block w-full" />
      </motion.div>
    </div>
  );
}

function PhoneFrame({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`w-40 shrink-0 rounded-[2rem] border-4 border-foreground/80 bg-card p-1.5 shadow-xl shadow-foreground/10 sm:w-48 ${className ?? ""}`}>
      <div className="overflow-hidden rounded-[1.5rem]">
        <img src={src} alt={alt} className="block w-full" />
      </div>
    </div>
  );
}

function BrowserFrameHeader() {
  return (
    <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-3 py-2">
      <span className="size-2.5 rounded-full bg-danger/60" />
      <span className="size-2.5 rounded-full bg-warning/60" />
      <span className="size-2.5 rounded-full bg-fresh/60" />
    </div>
  );
}
