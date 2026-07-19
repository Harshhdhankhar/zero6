"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  ArrowRight, ChevronRight, MapPin, Route, Clock,
  Menu, X as XIcon, Users, Zap, QrCode, Bell,
  ArrowUpRight, ChevronLeft,
} from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

const LandingMapComponent = dynamic(
  () => import("@/components/landing/landing-map").then((m) => ({ default: m.LandingMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full flex items-center justify-center bg-card/10" style={{ minHeight: "560px" }}>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="animate-spin w-5 h-5 border border-primary border-t-transparent rounded-full" />
          <span className="tracking-widest text-xs uppercase">Loading map</span>
        </div>
      </div>
    ),
  }
);

// ─── DATA ─────────────────────────────────────────────────────────────────────

const MARQUEE_CITIES = [
  "DELHI NCR", "MUMBAI", "BENGALURU", "HYDERABAD", "PUNE",
  "CHANDIGARH", "KOLKATA", "CHENNAI", "JAIPUR", "AHMEDABAD",
  "LUCKNOW", "GOA", "KOCHI", "BHOPAL", "SURAT",
];

const COMMUNITIES = [
  { id: "c1", name: "Delhi Run Collective",    city: "DELHI NCR", location: "Lodhi Garden",    pace: "5:30 /km", members: 340, image: "/image copy 2.png", position: "center",       grad: "from-orange-950/55 via-stone-950/50 to-stone-950", accent: "#FF5A1F" },
  { id: "c2", name: "Marine Drive Runners",   city: "MUMBAI",    location: "Queen's Necklace", pace: "5:45 /km", members: 218, image: "/image copy.png",   position: "50% 42%",      grad: "from-sky-950/40 via-stone-950/55 to-stone-950",    accent: "#38BDF8" },
  { id: "c3", name: "Cubbon Park Crew",        city: "BENGALURU", location: "Cubbon Park",      pace: "6:00 /km", members: 175, image: "/image.png",        position: "68% center",   grad: "from-emerald-950/40 via-stone-950/50 to-stone-950", accent: "#34D399" },
  { id: "c4", name: "Hyderabad Trail Society", city: "HYDERABAD", location: "KBR Park",         pace: "5:15 /km", members: 142, image: "/image copy 2.png", position: "58% center",   grad: "from-amber-950/45 via-stone-950/50 to-stone-950",  accent: "#FBBF24" },
  { id: "c5", name: "Pune Pacemakers",         city: "PUNE",      location: "Koregaon Park",    pace: "5:50 /km", members: 196, image: "/image copy.png",   position: "center",       grad: "from-violet-950/40 via-stone-950/55 to-stone-950", accent: "#A78BFA" },
  { id: "c6", name: "Chandigarh Runners",      city: "CHANDIGARH",location: "Sector 1",         pace: "5:20 /km", members: 88,  image: "/image.png",        position: "38% center",   grad: "from-cyan-950/40 via-stone-950/50 to-stone-950",   accent: "#22D3EE" },
];

const EVENTS = [
  { id: "e1", title: "Sunday Social 5K",   date: "21", month: "JUL", time: "06:00 IST", location: "Lodhi Garden, Delhi",       dist: "5K",  type: "Social Run" },
  { id: "e2", title: "Sunrise Long Run",   date: "27", month: "JUL", time: "05:30 IST", location: "Marine Drive, Mumbai",      dist: "16K", type: "Endurance"  },
  { id: "e3", title: "Beginner Pace Run",  date: "03", month: "AUG", time: "06:00 IST", location: "Cubbon Park, Bengaluru",    dist: "5K",  type: "Beginner"   },
  { id: "e4", title: "KBR Park Loop",      date: "10", month: "AUG", time: "05:45 IST", location: "KBR Park, Hyderabad",       dist: "10K", type: "Trail"      },
];

const NAV_LINKS = [
  { label: "Communities", href: "#communities" },
  { label: "Events",      href: "#events"      },
  { label: "Map",         href: "#map"         },
  { label: "Explore",     href: "/communities" },
];

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];
const noAnim = { duration: 0 };
const LandingAuthContext = createContext(false);

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function WordReveal({
  text, className = "", delay = 0, reduce = false,
}: { text: string; className?: string; delay?: number; reduce?: boolean }) {
  return (
    <span className={className} aria-label={text}>
      {text.split(" ").map((word, i) => (
        <span key={i} className="z6-word mr-[0.22em]">
          <motion.span
            className="z6-word-inner"
            initial={reduce ? false : { y: "110%", skewY: 8, opacity: 0 }}
            whileInView={{ y: 0, skewY: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.75, delay: delay + i * 0.07, ease, ...(reduce ? noAnim : {}) }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function MagneticLink({
  href, children, className, reduce, style,
}: { href: string; children: React.ReactNode; className?: string; reduce?: boolean; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 280, damping: 18 });
  const sy = useSpring(y, { stiffness: 280, damping: 18 });

  const onMove = (e: React.MouseEvent) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.28);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.28);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div ref={ref} style={{ x: sx, y: sy }} onMouseMove={onMove} onMouseLeave={onLeave}>
      <Link href={href} className={className} style={style} prefetch={false}>
        {children}
      </Link>
    </motion.div>
  );
}

function AuthLink({
  href, children, className, style, ...rest
}: Omit<React.ComponentProps<typeof Link>, "href"> & { href: string }) {
  const isAuthenticated = useContext(LandingAuthContext);
  const destination = href.startsWith("#") || isAuthenticated
    ? href
    : `/login?redirect=${encodeURIComponent(href)}`;

  return (
    <Link href={destination}
      className={className} style={style} prefetch={false} {...rest}>
      {children}
    </Link>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function Zero6PremiumLanding() {
  const reduce = useReducedMotion();
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen]     = useState(false);
  const [navSolid, setNavSolid]     = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Hero parallax refs / motion
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY       = useTransform(heroScroll, [0, 1], [0, 180]);
  const heroOpacity = useTransform(heroScroll, [0, 0.7], [1, 0]);

  // Organizer parallax
  const organizerRef = useRef<HTMLElement>(null);
  const organizerTextRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = organizerTextRef.current;
    if (!el || reduce) return;
    let raf: number;
    const onScroll = () => {
      raf = requestAnimationFrame(() => {
        const rect = organizerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const viewportH = window.innerHeight;
        const progress = 1 - rect.top / (rect.height + viewportH);
        const pct = progress * 50;
        el.style.backgroundPosition = `center ${pct}%`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  // Communities native-scroll strip ref
  const commStripRef = useRef<HTMLDivElement>(null);

  // Communities strip scroll helpers
  const scrollComm = useCallback((dir: "l" | "r") => {
    if (!commStripRef.current) return;
    commStripRef.current.scrollBy({ left: dir === "r" ? 380 : -380, behavior: "smooth" });
  }, []);

  // Nav transparency + scroll progress
  useEffect(() => {
    const fn = () => {
      setNavSolid(window.scrollY > 40);
      const docEl = document.documentElement;
      const scrollable = Math.max(1, docEl.scrollHeight - docEl.clientHeight);
      setScrollProgress(Math.min(1, window.scrollY / scrollable));
    };
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const scrollToTop = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [reduce]);

  const primaryHref = isAuthenticated ? "/dashboard" : "/signup";

  return (
    <LandingAuthContext.Provider value={isAuthenticated}>
    <div className="z6-landing min-h-screen bg-background text-white overflow-x-hidden selection:bg-primary/30">
      <div className="z6-grain" aria-hidden="true" />

      {/* ── NAV ── */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        navSolid || menuOpen
          ? "bg-background/75 backdrop-blur-xl border-b border-white/[0.05] shadow-[0_1px_0_rgba(255,255,255,0.03)]"
          : "bg-transparent"
      }`}>
        {!reduce && (
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/[0.03]">
            <motion.div className="h-full bg-primary/70 origin-left" style={{ scaleX: scrollProgress }} />
          </div>
        )}
        <div className="max-w-[1380px] mx-auto px-6 h-16 sm:h-[72px] flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <div className="relative w-32 h-[60px] sm:w-40 sm:h-[68px]">
              <Image src="/logo.png" alt="ZERO6" fill className="object-contain object-left" sizes="160px" />
            </div>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-6 text-[10.5px] font-bold tracking-[0.14em] uppercase">
            {NAV_LINKS.map((l) => (
              <AuthLink key={l.href} href={l.href}
                className="relative text-white/40 hover:text-white/90 transition-colors duration-250 group py-1">
                {l.label}
                <span className="absolute bottom-0 left-0 h-px w-0 bg-primary/70 group-hover:w-full transition-all duration-300 ease-out" />
              </AuthLink>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-1.5">
            <Link href={isAuthenticated ? "/dashboard" : "/login"}
              className="text-[10.5px] font-bold text-white/38 hover:text-white/80 transition-colors duration-250 px-4 py-2 tracking-[0.12em] uppercase">
              {isAuthenticated ? "Dashboard" : "Login"}
            </Link>
            <MagneticLink href={primaryHref} reduce={!!reduce}
              className="relative overflow-hidden rounded-full px-5 py-2.5 text-[10.5px] font-black bg-primary text-white flex items-center gap-1.5 tracking-[0.12em] uppercase transition-all duration-300 group">
              {/* Sweep shimmer */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-500 ease-out" />
              <span className="relative z-10 flex items-center gap-1.5">
                {isAuthenticated ? "Open ZERO6" : "Start Running"} <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" />
              </span>
            </MagneticLink>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/[0.05] transition-colors"
            onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" aria-expanded={menuOpen} aria-controls="mobile-navigation">
            <AnimatePresence mode="wait">
              {menuOpen
                ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><XIcon className="w-5 h-5" /></motion.span>
                : <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="w-5 h-5" /></motion.span>
              }
            </AnimatePresence>
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.4, ease }}
            id="mobile-navigation"
            className="fixed inset-0 z-40 bg-background/98 backdrop-blur-3xl pt-20 flex flex-col"
          >
            <nav aria-label="Mobile navigation" className="flex flex-col px-6">
              {NAV_LINKS.map((l, i) => (
                <motion.div key={l.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + i * 0.06, ...(reduce ? noAnim : {}) }}>
                  <AuthLink href={l.href} onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between py-5 border-b border-white/[0.06] hover:text-primary transition-colors group">
                    <span className="flex items-center gap-5">
                      <span className="text-[10px] text-white/20 font-mono w-5">0{i + 1}</span>
                      <span className="text-2xl font-black tracking-[-0.04em]">{l.label}</span>
                    </span>
                    <ArrowUpRight className="w-5 h-5 text-white/15 group-hover:text-primary transition-colors" />
                  </AuthLink>
                </motion.div>
              ))}
              <div className="flex flex-col gap-3 mt-10">
                <Link href={isAuthenticated ? "/dashboard" : "/login"} onClick={() => setMenuOpen(false)} className="text-center py-4 text-sm font-bold text-white/50 border border-white/10 rounded-2xl hover:border-white/25 transition-colors tracking-widest uppercase">{isAuthenticated ? "Dashboard" : "Login"}</Link>
                <Link href={primaryHref} onClick={() => setMenuOpen(false)} className="text-center py-4 text-sm font-black bg-primary text-white rounded-2xl hover:shadow-[0_0_40px_hsl(18_100%_60%/0.4)] transition-all tracking-widest uppercase">{isAuthenticated ? "Open ZERO6" : "Start Running"} →</Link>
              </div>
            </nav>
            <div className="px-6 mt-auto pb-10">
              <p className="text-[9px] text-white/12 tracking-[0.4em] uppercase font-bold">India Running Network</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-dvh flex flex-col overflow-hidden bg-[#080808]">

        {/* ── Background image with cinematic grading ── */}
        <motion.div style={{ y: heroY }} className="absolute inset-0 scale-[1.08] origin-center">
          <Image
            src="/image.png"
            alt="Runners at dawn"
            fill priority sizes="100vw"
            className="object-cover object-[65%_50%]"
          />
          {/* Primary: strong left-to-right dark veil — keeps text readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808] from-[30%] via-[#080808]/75 via-[55%] to-[#080808]/10" />
          {/* Secondary: bottom veil for ticker area */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/40" />
          {/* Subtle warm tone — replaces the muddy red burn */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950/20 via-transparent to-transparent" />
        </motion.div>

        {/* ── Layered route line: glow + sharp + animated pulse dot ── */}
        {!reduce && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              {/* Soft glow filter */}
              <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              {/* Gradient along route — starts invisible on left, sharp orange on right */}
              <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="hsl(18 100% 60%)" stopOpacity="0" />
                <stop offset="35%"  stopColor="hsl(18 100% 60%)" stopOpacity="0.3" />
                <stop offset="75%"  stopColor="hsl(18 100% 60%)" stopOpacity="0.55" />
                <stop offset="100%" stopColor="hsl(18 100% 60%)" stopOpacity="0.75" />
              </linearGradient>
              {/* Wide ambient glow gradient */}
              <linearGradient id="routeGlow2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="hsl(18 100% 60%)" stopOpacity="0" />
                <stop offset="50%"  stopColor="hsl(18 100% 60%)" stopOpacity="0.12" />
                <stop offset="100%" stopColor="hsl(18 100% 60%)" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Layer 1: wide ambient glow (painted first, behind) */}
            <motion.path
              d="M0 860 C 90 740, 220 790, 350 690 T 600 540 T 860 400 T 1120 260 T 1440 120"
              fill="none" stroke="url(#routeGlow2)" strokeWidth="18"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 4, ease: "easeOut", delay: 1 }} />

            {/* Layer 2: mid glow (filter applied) */}
            <motion.path
              d="M0 860 C 90 740, 220 790, 350 690 T 600 540 T 860 400 T 1120 260 T 1440 120"
              fill="none" stroke="url(#routeGrad)" strokeWidth="4"
              filter="url(#routeGlow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 3.5, ease: "easeOut", delay: 0.9 }} />

            {/* Layer 3: crisp sharp route on top */}
            <motion.path
              d="M0 860 C 90 740, 220 790, 350 690 T 600 540 T 860 400 T 1120 260 T 1440 120"
              fill="none" stroke="url(#routeGrad)" strokeWidth="1.2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 3.5, ease: "easeOut", delay: 0.9 }} />

            {/* Animated runner pulse dot */}
            <foreignObject x="0" y="0" width="1440" height="900" style={{ overflow: "visible" }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "hsl(18 100% 65%)",
                boxShadow: "0 0 0 3px hsl(18 100% 60% / 0.25), 0 0 14px hsl(18 100% 60% / 0.6)",
                position: "absolute",
                offsetPath: "path('M0 860 C 90 740, 220 790, 350 690 T 600 540 T 860 400 T 1120 260 T 1440 120')",
                animation: "z6-route-runner 8s linear 4s infinite",
              } as React.CSSProperties} />
            </foreignObject>
          </svg>
        )}

        {/* ── Hero content ── */}
        <motion.div style={{ opacity: heroOpacity }}
          className="relative z-10 flex flex-col justify-center flex-1 max-w-[1380px] mx-auto px-6 pt-28 sm:pt-36 pb-20 sm:pb-28">

          {/* Eyebrow label */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ...(reduce ? noAnim : {}) }}
            className="flex items-center gap-2.5 mb-7 sm:mb-10">
            <span className="z6-live-dot" />
            <span className="text-[9.5px] font-black tracking-[0.45em] text-white/50 uppercase">India Running Network</span>
          </motion.div>

          {/* Headline — editorial weight contrast */}
          <h1 className="font-black leading-[0.82] tracking-[-0.05em] mb-6 sm:mb-8"
            style={{ fontSize: "clamp(3.25rem, 11vw, 11rem)" }}>
            {/* "Run with" — slightly dimmed for visual contrast */}
            <span className="block overflow-hidden">
              <motion.span
                className="block text-white/75"
                initial={reduce ? false : { y: "108%", skewY: 6 }}
                animate={{ y: 0, skewY: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease }}
              >
                Run with
              </motion.span>
            </span>
            {/* "India." — full brightness warm white + orange */}
            <span className="block overflow-hidden">
              <motion.span
                className="block"
                initial={reduce ? false : { y: "108%", skewY: 6 }}
                animate={{ y: 0, skewY: 0 }}
                transition={{ duration: 0.8, delay: 0.44, ease }}
                style={{ color: "hsl(18 100% 60%)" }}
              >
                India.
              </motion.span>
            </span>
          </h1>

          {/* Supporting copy — warm off-white, tighter gap */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65, ease, ...(reduce ? noAnim : {}) }}
            className="text-[14px] sm:text-[16px] leading-[1.75] font-medium mb-9 sm:mb-10"
            style={{ color: "rgba(255,248,235,0.45)", maxWidth: 320 }}>
            Find your crew. Discover routes.<br />
            Every city. Every pace. Every morning.
          </motion.p>

          {/* CTA buttons — coherent group */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.82, ease, ...(reduce ? noAnim : {}) }}
            className="flex flex-col sm:flex-row items-start gap-3">

            {/* Primary CTA */}
            <MagneticLink href={primaryHref} reduce={!!reduce}
              className="relative overflow-hidden rounded-full px-8 py-[13px] text-[11.5px] font-black bg-primary text-white flex items-center gap-2 tracking-[0.14em] uppercase transition-all duration-300 group shadow-[0_0_0_1px_hsl(18_100%_60%/0.3)]">
              {/* Light-sweep shimmer on hover */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 ease-out" />
              {/* Soft glow on hover */}
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ boxShadow: "inset 0 0 30px hsl(18 100% 60% / 0.25)" }} />
              <span className="relative z-10 flex items-center gap-2">
                {isAuthenticated ? "Open ZERO6" : "Join ZERO6"}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
              </span>
            </MagneticLink>

            {/* Secondary CTA */}
            <AuthLink href="/communities"
              className="group relative rounded-full px-8 py-[13px] text-[11.5px] font-bold flex items-center gap-2 tracking-[0.14em] uppercase transition-all duration-300 overflow-hidden"
              style={{
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,248,235,0.5)",
              }}>
              {/* Soft fill on hover */}
              <span className="absolute inset-0 bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center gap-2 group-hover:text-white/80 transition-colors duration-300">
                Explore communities
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
              </span>
            </AuthLink>
          </motion.div>
        </motion.div>

        {/* ── Scroll indicator ── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 2.2, ...(reduce ? noAnim : {}) }}
          className="absolute bottom-[4.5rem] left-6 z-10 hidden sm:flex flex-col items-center gap-2">
          <span className="text-[7.5px] tracking-[0.45em] uppercase font-black" style={{ color: "rgba(255,255,255,0.15)" }}>Scroll</span>
          <div className="w-px h-9 bg-gradient-to-b from-primary/40 to-transparent" style={{ animation: "z6-scroll-pulse 2s ease-in-out infinite" }} />
        </motion.div>

        {/* ── City ticker — slightly more readable, one city highlighted ── */}
        <div className="absolute bottom-0 inset-x-0 overflow-hidden py-3 border-t z-10"
          style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          <div className="flex whitespace-nowrap marquee-track">
            {[...MARQUEE_CITIES, ...MARQUEE_CITIES].map((city, i) => {
              const isHighlight = city === "DELHI NCR" && i < MARQUEE_CITIES.length;
              return (
                <span key={i}
                  className="flex items-center gap-4 mx-3 text-[8.5px] font-black tracking-[0.38em] uppercase"
                  style={{ color: isHighlight ? "hsl(18 100% 60% / 0.7)" : "rgba(255,255,255,0.13)" }}>
                  {city}
                  <span className="w-[3px] h-[3px] rounded-full flex-shrink-0"
                    style={{ background: isHighlight ? "hsl(18 100% 60% / 0.5)" : "rgba(255,255,255,0.12)" }} />
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── MANIFESTO ── */}
      <section className="relative flex flex-col justify-center overflow-hidden py-16 sm:py-20 lg:py-24">
        <div className="z6-noise absolute inset-0" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-[55%] bg-[radial-gradient(ellipse_65%_50%_at_50%_0%,hsl(18_100%_60%/0.055)_0%,transparent_100%)] pointer-events-none" />

        {!reduce && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.09]" viewBox="0 0 1440 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            {[
              { d: "M-100,520 C200,420 420,580 720,430 C1020,280 1240,340 1540,190", w: "1",   delay: 0    },
              { d: "M-100,580 C250,470 470,640 760,490 C1060,340 1280,410 1540,260", w: "0.4", delay: 0.25 },
            ].map((p, i) => (
              <motion.path key={i} d={p.d} fill="none" stroke="hsl(18 100% 60%)" strokeWidth={p.w}
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: i === 0 ? 0.6 : 0.28 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 2.6 + i * 0.4, ease: "easeOut", delay: p.delay }} />
            ))}
          </svg>
        )}

        <div className="absolute top-6 left-8 hidden lg:block text-[8.5px] font-mono tracking-widest text-white/[0.05] pointer-events-none select-none">28.6139° N</div>
        <div className="absolute bottom-8 right-8 hidden lg:block text-[8.5px] font-mono tracking-widest text-white/[0.05] text-right pointer-events-none select-none">19.0760° N</div>

        <div className="relative z-10 max-w-[1380px] mx-auto px-6">

          {/* Eyebrow */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4 mb-5">
            <span className="w-8 h-px bg-primary/50" />
            <span className="text-[9px] font-black tracking-[0.4em] text-primary/55 uppercase">What ZERO6 is for</span>
          </motion.div>

          {/* Editorial headline — per-line reveal, no per-word clipping */}
          <div className="z6-manifesto-type mb-5">
            {([
              { text: "Running alone",    cls: "text-white/38",  delay: 0.05 },
              { text: "is the old way.",  cls: "text-white/38",  delay: 0.18 },
              { text: "Find the others",  cls: "text-white",     delay: 0.38 },
              { text: "who show up.",     cls: "text-primary",   delay: 0.52 },
            ] as { text: string; cls: string; delay: number }[]).map((line, i) => (
              <div key={i} className="overflow-hidden" style={{ paddingBottom: "0.2em", marginBottom: "-0.2em" }}>
                <motion.div
                  className={`block ${line.cls}`}
                  initial={reduce ? false : { y: "102%", skewY: 3 }}
                  whileInView={{ y: 0, skewY: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.75, delay: line.delay, ease }}
                >
                  {line.text}
                </motion.div>
              </div>
            ))}
          </div>

          {/* Body copy — compact */}
          <div className="grid md:grid-cols-2 gap-5 max-w-3xl mb-7">
            {[
              "ZERO6 connects runners in the same city so they never have to run alone. Discover communities already running your routes — and join them.",
              "Group runs build accountability and consistency, turning strangers into the people you look forward to seeing every morning.",
            ].map((p, i) => (
              <motion.p key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, delay: 0.1 + i * 0.12, ease, ...(reduce ? noAnim : {}) }}
                className="text-[13px] sm:text-[13.5px] leading-[1.8] font-medium"
                style={{ color: "rgba(255,248,235,0.52)" }}>
                {p}
              </motion.p>
            ))}
          </div>

          {/* Premium pillar strip — horizontal flex, thin dividers, sliding accent on hover */}
          <div className="border-t border-white/[0.06]">
            <div className="flex flex-col sm:flex-row">
              {[
                { n: "01", title: "Discover runners",  body: "See who is running your routes and neighbourhood."          },
                { n: "02", title: "Join group runs",   body: "Real daily runs organised by leaders in your city."        },
                { n: "03", title: "Stay consistent",   body: "Community keeps you lacing up even when motivation dips."  },
                { n: "04", title: "Make it social",    body: "Miles feel shorter with the right people beside you."      },
              ].map((item, i) => (
                <motion.div
                  key={item.n}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.07, ease, ...(reduce ? noAnim : {}) }}
                  className={`group relative flex-1 py-5 cursor-default
                    border-b sm:border-b-0 border-white/[0.06]
                    ${ i > 0 ? "sm:border-l sm:border-white/[0.06] sm:pl-5" : "" }
                    ${ i < 3 ? "sm:pr-5" : "" }`}>
                  {/* Sliding orange top accent */}
                  <span className="absolute top-0 left-0 right-0 h-px bg-primary/65 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />

                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="text-[7.5px] font-mono font-black tracking-[0.3em] text-primary/35 group-hover:text-primary/65 transition-colors duration-250 select-none">
                      {item.n}
                    </span>
                    <span className="text-[12.5px] font-black tracking-[-0.01em] text-white/65 group-hover:text-white/95 transition-colors duration-250">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[11px] leading-[1.6] font-medium sm:pl-[1.55rem]"
                    style={{ color: "rgba(255,248,235,0.42)" }}>
                    {item.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.45, ease }}
            className="mt-6 flex flex-wrap items-center gap-7">
            <Link href={primaryHref}
              className="group flex items-center gap-2 text-[11.5px] font-black text-primary hover:gap-3 transition-all duration-300 tracking-[0.15em] uppercase">
              {isAuthenticated ? "Open your dashboard" : "Find your crew"} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <AuthLink href="/communities"
              className="text-[10.5px] font-bold text-white/42 hover:text-white/75 transition-colors duration-300 tracking-[0.15em] uppercase">
              Browse communities →
            </AuthLink>
          </motion.div>

        </div>
      </section>

      {/* ── COMMUNITIES ── */}
      {/* Natural document-flow section — native CSS scroll, no height tricks */}
      <section id="communities" className="relative z6-section overflow-hidden">
        <div className="z6-noise absolute inset-0" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,hsl(18_100%_60%/0.03)_0%,transparent_100%)] pointer-events-none" />

        <div className="relative z-10">
          {/* Header row */}
          <div className="max-w-[1380px] mx-auto px-6 mb-10">
            <div className="flex items-end justify-between gap-8">
              <div>
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                  className="flex items-center gap-3 mb-5">
                  <span className="w-8 h-px bg-primary/50" />
                  <span className="text-[9px] font-black tracking-[0.4em] text-primary/55 uppercase">Local Communities</span>
                </motion.div>
                <h2 className="text-[clamp(2.5rem,6vw,5.5rem)] font-black leading-[0.85] tracking-[-0.05em]">
                  <WordReveal text="Your city." delay={0.05} reduce={!!reduce} className="block" />
                  <WordReveal text="Your morning." delay={0.15} reduce={!!reduce} className="block text-primary" />
                </h2>
              </div>
              {/* Desktop: scroll buttons + link */}
              <div className="hidden sm:flex items-center gap-3 shrink-0">
                <button onClick={() => scrollComm("l")}
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/30 hover:border-white/30 hover:text-white transition-all duration-300"
                  aria-label="Scroll left">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => scrollComm("r")}
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/30 hover:border-white/30 hover:text-white transition-all duration-300"
                  aria-label="Scroll right">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
                  <AuthLink href="/communities"
                    className="flex items-center gap-1.5 text-[11px] font-black text-white/45 hover:text-primary transition-colors group tracking-[0.15em] uppercase">
                    All communities <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </AuthLink>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Native-scroll strip — no height manipulation, no translateX */}
          <div
            ref={commStripRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none pb-2"
            style={{
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              paddingLeft: "max(1.5rem, calc((100vw - 1380px) / 2 + 1.5rem))",
              paddingRight: "max(1.5rem, calc((100vw - 1380px) / 2 + 1.5rem))",
            }}
          >
            {COMMUNITIES.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: Math.min(i * 0.07, 0.28), ease, ...(reduce ? noAnim : {}) }}
                style={{
                  scrollSnapAlign: "start",
                  flexShrink: 0,
                  width: "clamp(270px, 78vw, 360px)",
                  height: "clamp(390px, 105vw, 500px)",
                  marginTop: i % 2 === 1 ? "1.5rem" : "0",
                }}
              >
                <AuthLink href="/communities" className="z6-community-card block h-full group/c">
                  <Image
                    src={c.image}
                    alt={`${c.name} runners`}
                    fill
                    sizes="(max-width: 640px) 78vw, (max-width: 1200px) 34vw, 360px"
                    className="z6-community-image object-cover"
                    style={{ objectPosition: c.position }}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-b ${c.grad} transition-opacity duration-700 group-hover/c:opacity-90`} />
                  {/* Accent top border */}
                  <div className="absolute top-0 inset-x-0 h-px opacity-50"
                    style={{ background: `linear-gradient(to right, transparent, ${c.accent}, transparent)` }} />
                  {/* City watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
                    <span className="font-black text-white/[0.022] leading-none tracking-[-0.06em] group-hover/c:text-white/[0.04] transition-all duration-700"
                      style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}>
                      {c.city}
                    </span>
                  </div>
                  {/* Join badge */}
                  <div className="absolute top-4 right-4 z-10 opacity-0 -translate-y-2 group-hover/c:opacity-100 group-hover/c:translate-y-0 transition-all duration-300">
                    <span className="text-[9px] font-black px-4 py-2 rounded-full bg-primary text-white tracking-[0.2em] uppercase shadow-[0_0_24px_hsl(18_100%_60%/0.5)]">
                      Join →
                    </span>
                  </div>
                  {/* Card info */}
                  <div className="absolute bottom-0 inset-x-0 z-[2] p-5 translate-y-1.5 group-hover/c:translate-y-0 transition-transform duration-500">
                    <div className="text-[9px] font-black tracking-[0.3em] uppercase mb-2" style={{ color: c.accent }}>
                      {c.city}
                    </div>
                    <div className="text-[16px] font-black text-white mb-3 leading-tight">{c.name}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-white/60 mb-4">
                      <MapPin className="w-3 h-3" />{c.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="z6-stat-pill"><Users className="w-3 h-3" />{c.members} runners</span>
                      <span className="z6-stat-pill"><Route className="w-3 h-3" />{c.pace}</span>
                    </div>
                  </div>
                </AuthLink>
              </motion.div>
            ))}
          </div>

          {/* Mobile: see all link */}
          <div className="sm:hidden flex justify-center mt-8 px-6">
            <AuthLink href="/communities"
              className="flex items-center gap-1.5 text-[11px] font-black text-white/45 hover:text-primary transition-colors group tracking-[0.15em] uppercase">
              All communities <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </AuthLink>
          </div>
        </div>
      </section>

      {/* ── MAP ── */}
      <section id="map" className="relative z6-section overflow-hidden">
        <div className="z6-noise absolute inset-0" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,hsl(18_100%_60%/0.04)_0%,transparent_100%)] pointer-events-none" />

        <div className="max-w-[1380px] mx-auto px-6">
          <div className="flex items-end justify-between gap-8 mb-12">
            <div>
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="flex items-center gap-3 mb-5">
                <span className="w-8 h-px bg-primary/50" />
                <span className="text-[9px] font-black tracking-[0.4em] text-primary/55 uppercase">Running Map</span>
              </motion.div>
              <h2 className="text-[clamp(2.5rem,6vw,5.5rem)] font-black leading-[0.85] tracking-[-0.05em]">
                <WordReveal text="Every route." delay={0.05} reduce={!!reduce} className="block" />
                <WordReveal text="Every city." delay={0.15} reduce={!!reduce} className="block text-primary" />
              </h2>
            </div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <AuthLink href="/map" className="hidden sm:flex items-center gap-1.5 text-[11px] font-black text-white/45 hover:text-primary transition-colors group tracking-[0.15em] uppercase shrink-0">
                Open full map <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </AuthLink>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease, ...(reduce ? noAnim : {}) }}
            className="relative rounded-[24px] overflow-hidden"
            style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 48px 130px rgba(0,0,0,0.65)" }}>
            <div className="absolute top-4 left-4 z-10 flex gap-2 sm:gap-3 pointer-events-none">
              {[
                { label: "Live Track", val: "14.2", unit: "km" },
                { label: "Avg Pace",   val: "5:12",  unit: "/km" },
                { label: "Nearby",     val: "24",    unit: "runners" },
              ].map((chip, i) => (
                <div key={i} className={`z6-glass-panel rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 flex flex-col ${i === 2 ? "hidden lg:flex" : i === 1 ? "hidden sm:flex" : "flex"}`}>
                  <span className="text-[7px] sm:text-[8px] font-black tracking-[0.25em] text-primary/75 uppercase mb-0.5 sm:mb-1">{chip.label}</span>
                  <span className="text-[16px] sm:text-[20px] font-black font-mono leading-none whitespace-nowrap">
                    {chip.val}<span className="text-[10px] text-white/35 ml-0.5 font-bold">{chip.unit}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="relative h-[480px] sm:h-[560px] lg:h-[630px]">
              <LandingMapComponent isAuthenticated={isAuthenticated} />
              <div className="absolute inset-0 shadow-[inset_0_0_90px_rgba(0,0,0,0.75)] pointer-events-none" />
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-background/70 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── EVENTS ── */}
      <section id="events" className="relative z6-section overflow-hidden">
        <div className="z6-noise absolute inset-0" aria-hidden="true" />

        <div className="max-w-[1380px] mx-auto px-6">
          <div className="flex items-end justify-between gap-8 mb-14">
            <div>
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="flex items-center gap-3 mb-5">
                <span className="w-8 h-px bg-primary/50" />
                <span className="text-[9px] font-black tracking-[0.4em] text-primary/55 uppercase">Upcoming Events</span>
              </motion.div>
              <h2 className="text-[clamp(2.5rem,6vw,5.5rem)] font-black leading-[0.85] tracking-[-0.05em]">
                <WordReveal text="Lace up." delay={0.05} reduce={!!reduce} className="block" />
                <WordReveal text="Show up." delay={0.15} reduce={!!reduce} className="block text-primary" />
              </h2>
            </div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <AuthLink href="/events" className="hidden sm:flex items-center gap-1.5 text-[11px] font-black text-white/45 hover:text-primary transition-colors group tracking-[0.15em] uppercase shrink-0">
                All events <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </AuthLink>
            </motion.div>
          </div>

          <div className="z6-divider mb-0" />
          {EVENTS.map((ev, i) => (
            <motion.div key={ev.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease, ...(reduce ? noAnim : {}) }}
              className="z6-ticker-item group/ev">
              <AuthLink href="/events"
                className="flex items-center gap-2.5 sm:gap-6 py-5 sm:py-6 rounded-xl hover:bg-white/[0.025] transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.07] to-transparent -translate-x-full group-hover/ev:translate-x-0 transition-transform duration-500 ease-out pointer-events-none" />

                <div className="text-center w-12 sm:w-16 shrink-0 relative z-10">
                  <div className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-black text-primary tabular-nums leading-none">{ev.date}</div>
                  <div className="text-[8px] tracking-[0.3em] text-white/45 uppercase mt-0.5 font-black">{ev.month}</div>
                </div>

                <div className="z6-line-accent h-12 shrink-0 relative z-10" />

                <div className="flex-1 min-w-0 relative z-10">
                  <div className="text-[9px] font-black tracking-[0.25em] text-white/45 uppercase mb-1">{ev.type}</div>
                  <div className="text-[15px] sm:text-[18px] font-black leading-tight group-hover/ev:text-primary transition-colors duration-300">{ev.title}</div>
                  <div className="flex items-center gap-4 mt-1 text-[10px] sm:text-[11px] text-white/50 min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0"><MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{ev.location}</span></span>
                    <span className="hidden sm:flex items-center gap-1.5"><Clock className="w-3 h-3" />{ev.time}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3 sm:gap-4 relative z-10">
                  <span className="text-[14px] sm:text-[18px] font-black font-mono text-primary">{ev.dist}</span>
                  <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-black px-3 py-1.5 rounded-full border border-emerald-500/25 text-emerald-400 bg-emerald-500/[0.06] tracking-widest uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Open
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/12 group-hover/ev:text-primary group-hover/ev:translate-x-1.5 transition-all duration-300 hidden sm:block" />
                </div>
              </AuthLink>
            </motion.div>
          ))}
          <div className="z6-divider" />
        </div>
      </section>

      {/* ── COMMUNITY HUB ── */}
      <section className="relative z6-section z6-dark-section overflow-hidden">
        <div className="z6-noise absolute inset-0" aria-hidden="true" />

        <div className="max-w-[1380px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="flex items-center gap-3 mb-8">
                <span className="w-8 h-px bg-primary/50" />
                <span className="text-[9px] font-black tracking-[0.4em] text-primary/55 uppercase">Community Hub</span>
              </motion.div>

              <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-[0.85] tracking-[-0.05em] mb-8">
                <WordReveal text="Inside a" delay={0.05} reduce={!!reduce} className="block" />
                <WordReveal text="ZERO6 crew." delay={0.15} reduce={!!reduce} className="block text-primary" />
              </h2>

              <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.35, ease, ...(reduce ? noAnim : {}) }}
                className="text-[15px] text-white/58 leading-relaxed max-w-md mb-10 font-medium">
                Every crew has a home. Channels for announcements, routes shared before every run,
                and a leaderboard that actually matters.
              </motion.p>

              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }}>
                <AuthLink href="/communities"
                  className="group flex items-center gap-2 text-[12px] font-black text-primary hover:gap-3 transition-all duration-300 tracking-[0.15em] uppercase">
                  Find your crew <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </AuthLink>
              </motion.div>
            </div>

            <div className="space-y-5">
              {/* Scene 1: Announcements */}
              <motion.div
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, ease, ...(reduce ? noAnim : {}) }}
                className="z6-scene relative">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/20 rounded-full blur-[60px] pointer-events-none" />
                <div className="flex border-b border-white/[0.06] overflow-hidden">
                  <div className="w-36 sm:w-44 border-r border-white/[0.06] p-3 sm:p-3.5 space-y-2 sm:space-y-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[9px] font-black">Z6</div>
                      <span className="text-[11px] font-black truncate">City Run Crew</span>
                    </div>
                    <div className="space-y-0.5">
                      {["# announcements", "# upcoming-run", "# members", "# leaderboard"].map((ch, ci) => (
                        <div key={ch} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] ${ci === 0 ? "bg-primary/10 text-primary font-black" : "text-white/28"}`}>
                          <Bell className="w-3 h-3 shrink-0" />
                          <span className="truncate font-semibold">{ch}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 p-4 sm:p-5 min-w-0">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
                      <Bell className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[12px] font-black"># announcements</span>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-[10px] font-black shrink-0">AC</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-black">Community Captain</span>
                          <span className="text-[9px] text-white/22">Today · 05:30</span>
                        </div>
                        <p className="text-[12px] font-bold text-white mb-1.5">Sunday&apos;s sunrise loop is confirmed. ☀️</p>
                        <p className="text-[11px] text-white/42 leading-relaxed">
                          Meet at the east gate before first light. Easy 8K with a coffee stop. New runners welcome.
                        </p>
                        <div className="flex items-center gap-2 mt-2.5">
                          <span className="z6-stat-pill"><MapPin className="w-3 h-3" />East Gate · 05:45</span>
                          <span className="z6-stat-pill"><Route className="w-3 h-3" />8K</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-primary/[0.04]">
                  <div className="text-center shrink-0">
                    <div className="text-2xl font-black text-primary leading-none">21</div>
                    <div className="text-[8px] tracking-widest text-white/28 uppercase font-black">Sun Jul</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[8px] text-primary font-black tracking-widest uppercase mb-0.5">Upcoming Group Run</div>
                    <div className="text-[13px] font-black">Easy City Loop</div>
                    <div className="flex items-center gap-1 text-[10px] text-white/32 mt-0.5"><MapPin className="w-3 h-3" />East Gate · 05:45 IST</div>
                  </div>
                  <AuthLink href="/events" className="shrink-0 text-[10px] font-black px-4 py-2 rounded-full bg-primary text-white hover:shadow-[0_0_20px_hsl(18_100%_60%/0.4)] transition-all tracking-widest uppercase">
                    View Run
                  </AuthLink>
                </div>
              </motion.div>

              {/* Scene 2: QR check-in */}
              <motion.div
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: 0.1, ease, ...(reduce ? noAnim : {}) }}
                className="z6-scene p-5 sm:p-6 relative">
                <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-16 h-16 rounded-2xl border border-primary/20 bg-primary/[0.06] flex items-center justify-center shrink-0">
                    <QrCode className="w-8 h-8 text-primary/65" />
                  </div>
                  <div>
                    <div className="text-[9px] font-black tracking-[0.3em] text-primary/65 uppercase mb-1.5">QR Check-in</div>
                    <div className="text-[17px] font-black mb-2">One scan. You&apos;re in.</div>
                    <p className="text-[12px] text-white/38 leading-relaxed">
                      No spreadsheets. No forms. Scan the QR at the start line — attendance auto-recorded.
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-3 relative z-10">
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <motion.div className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: "72%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, delay: 0.4, ease, ...(reduce ? noAnim : {}) }} />
                  </div>
                  <span className="text-[11px] text-primary font-mono font-black shrink-0">72% checked in</span>
                </div>
              </motion.div>

              {/* Scene 3: Leaderboard */}
              <motion.div
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: 0.2, ease, ...(reduce ? noAnim : {}) }}
                className="z6-scene p-5 sm:p-6 relative">
                <div className="absolute top-1/2 -right-8 w-32 h-32 bg-primary/[0.08] rounded-full blur-[50px] pointer-events-none" />
                <div className="flex items-center justify-between mb-5 relative z-10">
                  <div>
                    <div className="text-[9px] font-black tracking-[0.3em] text-primary/65 uppercase mb-0.5">Monthly Leaderboard</div>
                    <div className="text-[16px] font-black">Crew Rankings</div>
                  </div>
                  <div className="text-[10px] text-white/22 font-mono font-bold">Jul 2026</div>
                </div>
                <div className="space-y-2 relative z-10">
                  {[
                    { rank: "01", name: "Priya K.",  runs: 14, km: 98 },
                    { rank: "02", name: "Arjun M.",  runs: 12, km: 84 },
                    { rank: "03", name: "Sneha R.",  runs: 11, km: 77 },
                  ].map((runner, ri) => (
                    <motion.div key={runner.rank}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${ri === 0 ? "bg-primary/[0.07] border border-primary/15" : "border border-transparent"}`}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + ri * 0.08, ...(reduce ? noAnim : {}) }}>
                      <span className={`text-[11px] font-black font-mono w-5 ${ri === 0 ? "text-primary" : "text-white/18"}`}>{runner.rank}</span>
                      <div className="w-7 h-7 rounded-full bg-card/80 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                        {runner.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-[12px] font-bold flex-1">{runner.name}</span>
                      <span className="text-[10px] text-white/28 font-mono">{runner.runs} runs</span>
                      <span className="text-[12px] font-black text-primary font-mono">{runner.km}K</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ORGANIZER ── */}
      <section ref={organizerRef} className="relative min-h-[60vh] sm:min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-[0.22] mix-blend-luminosity"
          style={{ backgroundImage: "url('/image%20copy.png')" }} />
        <div className="absolute inset-0 bg-background/90" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-[radial-gradient(ellipse,hsl(18_100%_60%/0.06)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-10 w-full px-6 py-16 sm:py-20 flex flex-col items-center text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease, ...(reduce ? noAnim : {}) }}>
            <div className="flex items-center justify-center gap-4 mb-10">
              <span className="w-10 h-px bg-primary/50" />
              <span className="text-[9px] font-black tracking-[0.4em] text-primary/55 uppercase">For Organizers</span>
              <span className="w-10 h-px bg-primary/50" />
            </div>

            <motion.div ref={organizerTextRef} className="z6-text-mask font-black leading-[0.78] tracking-[-0.07em] mb-8 sm:mb-10 select-none"
              style={{
                fontSize: "clamp(5.5rem, 22vw, 20rem)",
                backgroundImage: "url('/image%20copy.png')",
                backgroundSize: "cover",
                willChange: "background-position",
              }}
              aria-label="Lead">
              LEAD
            </motion.div>

            <p className="text-[16px] sm:text-[18px] text-white/48 max-w-xl mx-auto leading-relaxed mb-12 font-medium">
              Every running club in India started with one person who showed up
              and said —<em className="text-white/80 not-italic font-black"> let&apos;s do this together</em>.
              Be that person.
            </p>

            <MagneticLink href={isAuthenticated ? "/communities?create=true" : "/signup"} reduce={!!reduce}
              className="group relative inline-flex items-center justify-center gap-2.5 rounded-full px-12 py-5 text-[12px] font-black bg-primary text-white hover:shadow-[0_0_80px_hsl(18_100%_60%/0.55)] transition-all duration-[400ms] overflow-hidden tracking-[0.2em] uppercase">
              <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full" />
              <span className="relative z-10 flex items-center gap-2.5">
                Start your community
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </span>
            </MagneticLink>

            <div className="mt-8 flex items-center justify-center gap-2.5 text-[9px] text-white/22 tracking-[0.35em] uppercase font-black">
              <Zap className="w-3 h-3 text-primary/50" />
              Free forever for organizers
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative overflow-hidden flex items-center min-h-[55vh] sm:min-h-[60vh]">
        <div className="absolute inset-0">
          <Image src="/image copy.png" alt="Runners at sunrise" fill sizes="100vw" className="object-cover object-center" priority={false} />
          <div className="absolute inset-0 bg-gradient-to-r from-background/98 via-background/75 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute inset-0 mix-blend-multiply opacity-50 bg-stone-950" />
        </div>

        {!reduce && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-45" viewBox="0 0 1440 600" preserveAspectRatio="none" aria-hidden="true">
            <motion.path d="M-40 520 C 120 420, 200 460, 360 380 C 520 290, 600 340, 760 260 C 920 180, 1020 220, 1240 140 C 1340 100, 1420 80, 1480 60"
              fill="none" stroke="hsl(18 100% 60%)" strokeWidth="1.5"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 3, ease: "easeOut" }} />
          </svg>
        )}

        <div className="relative z-10 w-full max-w-[1380px] mx-auto px-6 py-20 sm:py-28">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="flex items-center gap-3 mb-8 sm:mb-12">
            <span className="w-8 h-px bg-primary/50" />
            <span className="text-[9px] font-black tracking-[0.4em] text-primary/55 uppercase">Your City · Your Crew · Your Next Start</span>
          </motion.div>

          <h2 className="text-[clamp(2.75rem,9.5vw,9rem)] font-black leading-[0.83] tracking-[-0.05em] mb-10 sm:mb-14">
            <WordReveal text="Your next run" delay={0.05} reduce={!!reduce} className="block" />
            <WordReveal text="starts now." delay={0.2} reduce={!!reduce} className="block text-primary" />
          </h2>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5, ease, ...(reduce ? noAnim : {}) }}
            className="flex flex-col sm:flex-row items-start gap-4">
            <MagneticLink href={primaryHref} reduce={!!reduce}
              className="group relative overflow-hidden rounded-full px-8 sm:px-10 py-4 text-[12px] font-black bg-primary text-white hover:shadow-[0_0_80px_hsl(18_100%_60%/0.5)] transition-all duration-[400ms] flex items-center gap-2 tracking-[0.15em] uppercase z6-btn-squish">
              <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 flex items-center gap-2">
                {isAuthenticated ? "Open your dashboard" : "Join ZERO6 — Free"} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </MagneticLink>
            <AuthLink href="/communities"
              className="group rounded-full px-8 sm:px-10 py-4 text-[12px] font-bold border border-white/12 text-white/50 hover:bg-white/[0.04] hover:border-white/25 hover:text-white transition-all duration-[400ms] flex items-center gap-2 tracking-[0.15em] uppercase z6-btn-squish">
              Explore communities <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </AuthLink>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative border-t border-white/[0.05] bg-stone-950 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none" />
        <div className="z6-noise absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="max-w-[1380px] mx-auto px-6 py-10 sm:py-14 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 mb-10 sm:mb-12">
            <div className="col-span-2 lg:col-span-5">
              <Link href="/" className="flex items-center gap-2.5 mb-4 group">
                <div className="relative w-32 h-12 group-hover:scale-[1.02] transition-transform"><Image src="/logo.png" alt="ZERO6" fill className="object-contain object-left" sizes="128px" /></div>
              </Link>
              <p className="text-[12px] text-white/50 leading-relaxed max-w-xs mb-5 font-medium">
                India&apos;s running community platform. Find your crew, discover routes, and make every city a running city.
              </p>
              <div className="text-[8px] text-white/30 tracking-[0.35em] uppercase font-bold">Designed for India · Built to Move</div>
            </div>

            {[
              { label: "Product",   links: [{ href: "#communities", text: "Communities" }, { href: "#events", text: "Events" }, { href: "#map", text: "Running Map" }, { href: isAuthenticated ? "/communities" : "/login?redirect=%2Fcommunities", text: "Explore" }] },
              { label: "Community", links: [{ href: primaryHref, text: isAuthenticated ? "Dashboard" : "Create Account" }, { href: isAuthenticated ? "/communities" : "/login?redirect=%2Fcommunities", text: "Browse Crews" }, { href: isAuthenticated ? "/dashboard" : "/login", text: isAuthenticated ? "Member Home" : "Member Login" }] },
              { label: "Connect",   links: [{ href: primaryHref, text: isAuthenticated ? "Open ZERO6" : "Get Started" }] },
            ].map((col, i) => (
              <div key={col.label} className={`col-span-1 lg:col-span-2 ${i === 0 ? "lg:col-start-7" : ""}`}>
                <div className="text-[8px] font-black tracking-[0.3em] text-white/35 uppercase mb-5">{col.label}</div>
                <div className="space-y-2.5">
                  {col.links.map((l) => (
                    <Link key={l.text} href={l.href} className="group/link block text-[12px] text-white/50 hover:text-white transition-colors duration-300 font-medium">
                      <span className="relative inline-block">
                        {l.text}
                        <span className="absolute -bottom-px left-0 h-px w-0 bg-primary/60 group-hover/link:w-full transition-all duration-300 ease-out" />
                      </span>
                    </Link>
                  ))}
                  {col.label === "Connect" && (
                    <>
                      <span className="flex items-center gap-2 text-[12px] text-white/25 font-medium">Social <span className="text-[7px] px-1.5 py-0.5 rounded-full border border-white/10 text-white/30 tracking-widest uppercase bg-white/[0.03]">Soon</span></span>
                      <span className="flex items-center gap-2 text-[12px] text-white/25 font-medium">Contact <span className="text-[7px] px-1.5 py-0.5 rounded-full border border-white/10 text-white/30 tracking-widest uppercase bg-white/[0.03]">In App</span></span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/[0.04]">
            <span className="text-[10px] text-white/15 font-medium">© {new Date().getFullYear()} ZERO6</span>
            <span className="text-[8px] text-white/08 tracking-[0.4em] uppercase font-bold">India Running Network</span>
            <button onClick={scrollToTop} aria-label="Back to top" className="text-[10px] text-white/40 hover:text-primary transition-colors cursor-pointer font-medium group">
              Back to top <span className="inline-block group-hover:-translate-y-0.5 transition-transform duration-200">↑</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
    </LandingAuthContext.Provider>
  );
}
