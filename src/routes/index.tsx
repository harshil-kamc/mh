import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, lazy, Suspense } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  LockKeyhole,
  Radio,
  Shield,
  CircleHelp,
  Volume2,
  VolumeX,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Award,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { eventConfig, phases, teamRoles, missions } from "@/lib/event-config";
import { heistAudio } from "@/lib/sound";
import { DaliMaskHero } from "@/components/DaliMaskHero";
import { BankHeist3DWalkthrough } from "@/components/BankHeist3DWalkthrough";

// High-resolution local Money Heist wallpapers
import heroImage from "@/assets/images/money_heist_hero_bg_1790930918948.jpg";
import crewImage from "@/assets/images/money_heist_crew_action_1790930929592.jpg";
import vaultGoldImage from "@/assets/images/money_heist_vault_gold_1790930941661.jpg";
import maskImage from "@/assets/mask.jpg";

// Client-only Three.js fallback / secondary scene
const VaultScene = lazy(() =>
  import("@/components/VaultScene").then((m) => ({ default: m.VaultScene })),
);

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "The Mystery Vault | Tech Heist Hackathon" },
      {
        name: "description",
        content:
          "The Mystery Vault: An immersive 24-hour Money Heist-inspired technology heist hackathon. 32 crews, AI, Machine Learning & Cybersecurity, hint auctions, and vault extraction.",
      },
      { property: "og:title", content: "The Mystery Vault | Tech Heist Hackathon" },
      {
        property: "og:description",
        content: "A 24-hour technology heist. Recruit. Infiltrate. Breach. Extract. Escape.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const nav = [
  ["Operation", "operation"],
  ["3D Bank", "blueprint"],
  ["Missions", "missions"],
  ["Crew of 4", "team"],
  ["The Mask", "mask"],
  ["Control", "control"],
  ["Vault", "vault"],
  ["Rules", "rules"],
  ["FAQ", "faq"],
] as const;

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
  });

const faq = [
  [
    "What is The Mystery Vault?",
    "A proposed 24-hour technology competition built around a high-stakes Money Heist narrative. 32 crews assemble, select problem statements, react to mid-heist missions, bid for intelligence, and extract their completed solutions.",
  ],
  [
    "Which domains can crews compete in?",
    "The proposed domains are AI, Machine Learning and Cybersecurity. There are four proposed problem statements in total; the actual briefs will be announced by the organizers.",
  ],
  [
    "How does the Mission Point (MP) auction work?",
    "Each team is allotted 5,000 Mission Points to strategically bid for hints and tactical intelligence during high-pressure missions. Auction rules and hint tiers are proposed, not final.",
  ],
  [
    "How do I build my crew and register?",
    "In this event, participants build their own team of exactly 4 members. One member must be the Team Leader (The Professor) who guides strategy, manages hint points, and directs the timeline. The official registration portal will open soon.",
  ],
  [
    "Are the missions already announced?",
    "No. The mission archive currently shows proposed mission categories, not live briefs or finalized challenges. All briefs remain strictly encrypted.",
  ],
];

function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [activePhase, setActivePhase] = useState(0);
  const [mission, setMission] = useState<number | null>(null);
  const [dialog, setDialog] = useState<"registration" | "identity" | null>(null);
  const [balance, setBalance] = useState(eventConfig.missionPoints);
  const [bid, setBid] = useState("2000");
  const [auctionResult, setAuctionResult] = useState("");
  const [vaultResponse, setVaultResponse] = useState("SELECT AN OBJECT TO INSPECT THE VAULT.");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Play background song at 70% volume on site load
  useEffect(() => {
    heistAudio.initBackgroundMusic();
    setIsMuted(heistAudio.isMuted);
  }, []);

  // Scroll listener for progress line and compact nav
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        setScrollPercent(Math.min(100, Math.round((window.scrollY / total) * 100)));
      }
      setScrolled(window.scrollY > 45);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll Reveal Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    const elements = document.querySelectorAll("[data-scroll-reveal]");
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!eventConfig.date) return;
    const update = () =>
      setRemaining(Math.max(0, new Date(eventConfig.date as string).getTime() - Date.now()));
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Close modals on Escape
  useEffect(() => {
    if (mission === null && !dialog) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMission(null);
        setDialog(null);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [mission, dialog]);

  function handleAudioToggle() {
    const muted = heistAudio.toggleMute();
    setIsMuted(muted);
  }

  function enterVault() {
    heistAudio.playVaultClank();
    setVaultOpen(true);
    window.setTimeout(() => scrollTo("vault"), 800);
  }

  function placeBid() {
    const amount = Number(bid);
    if (!Number.isInteger(amount) || amount < 500) {
      setAuctionResult("MINIMUM DEMO BID: 500 MP.");
      heistAudio.playClick();
      return;
    }
    if (amount > balance) {
      setAuctionResult("INSUFFICIENT MISSION POINTS.");
      heistAudio.playClick();
      return;
    }
    setBalance(balance - amount);
    heistAudio.playAccessGranted();
    const tier =
      amount >= 2000
        ? "TIER 3 (CRITICAL)"
        : amount >= 1500
          ? "TIER 2 (ADVANCED)"
          : amount >= 1000
            ? "TIER 1"
            : "BASIC";
    setAuctionResult(`ACCESS GRANTED — ${tier} INTELLIGENCE UNLOCKED. DEMO SIMULATION.`);
  }

  return (
    <div className="site-shell">
      {/* Scroll Progress Bar */}
      <div className="scroll-progress-line" style={{ width: `${scrollPercent}%` }} />

      {/* Top Danger Bar Strip */}
      <div className="mh-danger-tape" />

      {/* Navigation */}
      <header className={`site-nav ${scrolled ? "compact" : ""}`}>
        <a href="#top" className="brand" aria-label="The Mystery Vault home">
          THE MYSTERY <b className="mh-stamp-box">VAULT.</b>
        </a>
        <nav className="nav-links desktop-links" aria-label="Primary navigation">
          {nav.map(([label, id]) => (
            <a
              key={id}
              className="nav-link mono-label hover:text-primary transition-colors"
              href={`#${id}`}
              onClick={() => heistAudio.playClick()}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Sound Toggle Button — Icon only, no text */}
          <button
            type="button"
            onClick={handleAudioToggle}
            className="h-9 w-9 inline-flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-all duration-200 active:scale-95 cursor-pointer"
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            title={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted ? (
              <VolumeX size={16} />
            ) : (
              <Volume2 size={16} className="text-primary animate-pulse" />
            )}
          </button>

          <Button variant="heist" className="nav-action" onClick={enterVault}>
            Enter the vault <ArrowUpRight />
          </Button>

          <Button
            variant="heistGhost"
            size="icon"
            className="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {menuOpen && (
          <nav className="mobile-links" aria-label="Mobile navigation">
            {nav.map(([label, id]) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => {
                  setMenuOpen(false);
                  heistAudio.playClick();
                }}
                className="nav-link mono-label"
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main>
        {/* =========================================================================
            HERO SECTION — 3D SALVADOR DALÍ MASK CENTERPIECE
            Transparent embed viewer with NO borders, NO boxes, and NO background!
            ========================================================================= */}
        <section className="hero" id="top">
          {/* Authentic Local Money Heist Vault Entrance Wallpaper */}
          <img
            className="hero-image"
            src={heroImage}
            width={1920}
            height={1080}
            alt="Atmospheric underground bank vault with crimson lighting and volumetric smoke"
          />

          <div className="hero-inner">
            <h1 className="display-title hero-title">
              THE
              <br />
              MYSTERY
              <span className="mh-stamp-box">VAULT.</span>
            </h1>

            {/* Middle row: on mobile, 3D Dali mask sits on the left side of text; on desktop, it sits absolute on the right */}
            <div className="hero-mid-row">
              <DaliMaskHero />

              <div className="hero-copy-wrap">
                <p className="hero-sub font-display tracking-wider text-primary">
                  THE NEXT HEIST BEGINS HERE.
                </p>

                <p className="hero-copy">
                  The system is secure.{" "}
                  <strong className="text-foreground">Until you break it.</strong> Thirty-two crews,
                  two domains, high-stakes tactical missions, and live hint bidding.
                </p>
              </div>
            </div>

            <div className="hero-actions">
              <Button variant="heist" onClick={enterVault}>
                ENTER THE VAULT <ArrowUpRight />
              </Button>
              <Button
                variant="heistOutline"
                onClick={() => {
                  heistAudio.playClick();
                  scrollTo("operation");
                }}
              >
                VIEW THE MISSION <ArrowRight />
              </Button>
              <Button
                variant="heistGhost"
                onClick={() => {
                  heistAudio.playClick();
                  setDialog("identity");
                }}
                className="text-gold border border-gold/30 hover:border-gold"
              >
                <ShieldCheck size={14} className="mr-1.5 text-primary" /> VERIFY MASK
              </Button>
            </div>
          </div>

          <p className="hero-side mono-label">
            CLEARANCE: LEVEL RED · ENCRYPTION: ACTIVE · 40.4168°N 3.7038°W
          </p>

          <div className="hero-bottom">
            <button
              className="mono-label flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors ml-auto"
              onClick={() => {
                heistAudio.playClick();
                scrollTo("operation");
              }}
            >
              SCROLL TO DECRYPT <ArrowDown size={15} className="animate-bounce" />
            </button>
          </div>
        </section>

        {/* Laser security beam divider */}
        <div className="mh-laser-beam" />

        {/* STATS BAND */}
        <div className="stat-band" aria-label="Proposed event facts" data-scroll-reveal>
          {[
            ["24", "HOURS BUILD"],
            ["32", "ELITE CREWS"],
            ["02", "DOMAINS (AI & CYBER)"],
            ["04", "PROBLEMS"],
            ["5K", "MISSION POINTS"],
          ].map(([value, label]) => (
            <div className="stat-item" key={label}>
              <div className="stat-value">{value}</div>
              <div className="mono-label stat-name">{label}</div>
            </div>
          ))}
        </div>

        {/* =========================================================================
            SECTION 01: THE OPERATION
            ========================================================================= */}
        <section className="story" id="operation">
          <div className="section-wrap" data-scroll-reveal>
            <div className="story-layout">
              <h2 className="story-quote">
                EVERY VAULT HAS A SECRET.
                <br />
                <em>EVERY CREW HAS A PLAN.</em>
              </h2>
              <div className="story-body">
                <p>
                  The world's most secure vault has one weakness.{" "}
                  <strong className="text-primary text-xl">You.</strong>
                </p>
                <p>
                  Thirty-two crews. Twenty-four hours. Unpredictable mid-heist missions. Limited
                  resources. One final extraction.
                </p>
                <p>
                  You are not here to simply register, code, and submit. You are here to infiltrate
                  the problem, breach its architecture, bid on live hints, adapt when the alarms
                  trigger, and escape with a solution powerful enough to survive.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-8">
                  <span className="mono-label text-gold border border-gold/30 px-3 py-1.5">
                    AI & MACHINE LEARNING
                  </span>
                  <span className="mono-label text-primary border border-primary/30 px-3 py-1.5">
                    CYBERSECURITY & DEFENSE
                  </span>
                  <span className="mono-label text-muted-foreground border border-border px-3 py-1.5">
                    ONE EXTRACTION
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3D UNION BANK WALKTHROUGH & HACKATHON BLUEPRINT
            Interactive 3D model with 1, 2, 3, 4 sector zoom and synchronized hackathon process guide
            ========================================================================= */}
        <BankHeist3DWalkthrough activePhase={activePhase} onPhaseChange={setActivePhase} />

        {/* =========================================================================
            SECTION 02: OPERATIONAL BLUEPRINT (FIVE PHASES)
            ========================================================================= */}
        <section className="phase-section" id="missions">
          <div className="section-wrap" data-scroll-reveal>
            <div className="section-head">
              <div>
                <h2 className="display-title section-title">
                  FIVE PHASES.
                  <br />
                  <span className="text-primary">ONE ESCAPE.</span>
                </h2>
              </div>
              <p className="section-intro">
                This isn't register, code, submit. Every step is a calculated move in an underground
                heist. Select a phase to uncover the blueprint and sync the 3D model.
              </p>
            </div>
            <div className="phase-layout">
              <div className="phase-list">
                {phases.map((phase, i) => (
                  <button
                    key={phase.number}
                    className={`phase-button ${activePhase === i ? "active" : ""}`}
                    onClick={() => {
                      heistAudio.playClick();
                      setActivePhase(i);
                    }}
                    aria-pressed={activePhase === i}
                  >
                    <span className="mono-label">{phase.number}</span>
                    <strong>{phase.title}</strong>
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
              <div className="phase-detail" data-number={phases[activePhase]?.number || "01"}>
                <span className="mono-label text-gold">
                  OPERATION PHASE {phases[activePhase]?.number || "01"} OF 05 ·{" "}
                  {phases[activePhase]?.timeframe}
                </span>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="mh-stamp-box text-[10px]">{phases[activePhase]?.tag}</span>
                    <span className="mono-label text-xs text-primary">
                      {phases[activePhase]?.location}
                    </span>
                  </div>
                  <h3>{phases[activePhase]?.title}</h3>
                  <p className="mono-label mt-3 text-gold text-xs">
                    {phases[activePhase]?.subtitle}
                  </p>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {phases[activePhase]?.detail}
                </p>

                {/* Tactical Phase Navigation: Seamlessly glides camera in the same 3D model */}
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => {
                      heistAudio.playClick();
                      setActivePhase((activePhase - 1 + phases.length) % phases.length);
                    }}
                    className="mono-label text-xs px-3 py-2 border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Glide to previous phase in 3D model"
                  >
                    <ChevronLeft size={14} /> PREV PHASE
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      heistAudio.playClick();
                      setActivePhase((activePhase + 1) % phases.length);
                    }}
                    className="mono-label text-xs px-4 py-2 bg-primary/20 border border-primary text-foreground hover:bg-primary/30 transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
                    title="Glide to next phase in 3D model"
                  >
                    NEXT PHASE <ArrowRight size={14} className="text-primary" />
                  </button>
                  <span className="mono-label text-[10px] text-gold ml-auto hidden sm:inline">
                    PHASE 0{activePhase + 1} OF 05 SYNCHRONIZED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Laser security beam */}
        <div className="mh-laser-beam" />

        {/* =========================================================================
            SECTION 03: ASSEMBLE YOUR CREW OF 4
            Participants build their own squad of 4 led by The Professor
            ========================================================================= */}
        <section className="crew-section" id="team">
          <div className="section-wrap" data-scroll-reveal>
            <div className="section-head">
              <div>
                <p className="mono-label eyebrow">
                  03 — CREW FORMATION PROTOCOL{" "}
                  <span className="mh-stamp-box text-xs">MANDATORY RULE</span>
                </p>
                <h2 className="display-title section-title">
                  ASSEMBLE YOUR <span className="text-primary">CREW OF 4.</span>
                </h2>
              </div>
              <p className="section-intro">
                In this hackathon, participants must build their own team of exactly 4 members. One
                of them must be chosen as the Team Leader — just like The Professor in Money Heist —
                who guides the strategy, commands hint bidding, coordinates the operations, and
                orchestrates the final extraction.
              </p>
            </div>

            {/* Authentic Crew Lineup Wallpaper */}
            <div className="crew-feature">
              <img
                src={crewImage}
                loading="lazy"
                width={1920}
                height={1080}
                alt="Money Heist crew in iconic red jumpsuits and Salvador Dalí masks"
              />
              <div className="crew-caption">
                <h3>
                  NO ONE
                  <br />
                  WORKS ALONE.
                </h3>
              </div>
            </div>

            {/* The 4 Roles Every Participant Team Builds */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {teamRoles.map((role) => {
                const isLeader = role.number === "01";
                return (
                  <div
                    key={role.number}
                    className={`p-5 bg-panel border transition-all flex flex-col justify-between ${
                      isLeader
                        ? "border-primary/80 bg-neutral-900/90 shadow-xl shadow-primary/20 ring-1 ring-primary/40"
                        : "border-border hover:border-gold/50 bg-neutral-950/80"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded ${
                            isLeader
                              ? "bg-primary text-white shadow-sm"
                              : "bg-neutral-800 text-gold"
                          }`}
                        >
                          MEMBER 0{role.number}
                        </span>
                        <span className="mono-label text-[10px] text-gold font-bold">
                          {role.badge}
                        </span>
                      </div>

                      <h3 className="font-display text-lg uppercase text-foreground leading-snug">
                        {role.name}
                      </h3>

                      <p className="mono-label text-xs text-primary font-bold mt-2">{role.role}</p>

                      <p className="text-xs text-neutral-300 leading-relaxed mt-3">
                        {role.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-border/80 mono-label text-[10px] text-muted-foreground">
                      <span className="text-gold font-bold block mb-1">KEY RESPONSIBILITY:</span>
                      <span>{role.specialty}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Crew Assembly Callout Banner */}
            <div className="mt-6 p-4 bg-primary/10 border border-primary/50 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="mh-stamp-box text-xs">TEAM DIRECTIVE</span>
                <p className="text-xs text-neutral-200">
                  Form your squad of 4 prior to registration. Appoint your Professor, select your
                  tech domain, and prepare for the 24-hour breach.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  heistAudio.playClick();
                  setDialog("registration");
                }}
                className="px-4 py-2 bg-primary text-white text-xs font-mono font-bold hover:bg-primary/90 transition-colors uppercase whitespace-nowrap shadow-md cursor-pointer shrink-0"
              >
                REGISTER SQUAD OF 4
              </button>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION: THE MASKS & IDENTITY VERIFICATION
            ========================================================================= */}
        <section className="mask-banner" id="mask">
          <img
            className="mask-image"
            src={maskImage}
            loading="lazy"
            width={1024}
            height={1024}
            alt="Salvador Dalí mask with arched eyebrows and upturned mustache"
            onClick={() => {
              heistAudio.playClick();
              setDialog("identity");
            }}
          />
          <div className="mask-copy" data-scroll-reveal>
            <h2 className="display-title mt-7 text-white">
              THE
              <br />
              <span className="bg-black text-white px-2 py-0.5 inline-block">MASKS.</span>
            </h2>
            <p className="text-white/90">
              Every crew has a face. Every face hides a plan. Don the mask, synchronize your
              strategy, and prepare for the breach.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <Button
                variant="heist"
                className="bg-black hover:bg-neutral-900 text-white border border-white/20"
                onClick={() => {
                  heistAudio.playAccessGranted();
                  setDialog("identity");
                }}
              >
                VERIFY IDENTITY <ArrowRight />
              </Button>
              <Button
                variant="heistOutline"
                className="border-white text-white hover:bg-white/10"
                onClick={() => {
                  heistAudio.playClick();
                  scrollTo("top");
                }}
              >
                INTERACT WITH 3D MASK <Eye size={14} className="ml-1" />
              </Button>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 04: MISSION CONTROL & LIVE SYSTEM SIMULATION
            ========================================================================= */}
        <section className="control-section" id="control">
          <div className="section-wrap" data-scroll-reveal>
            <div className="section-head">
              <div>
                <h2 className="display-title section-title">
                  MISSION
                  <br />
                  <span className="text-primary">CONTROL.</span>
                </h2>
              </div>
              <p className="section-intro">
                An advance look inside the Professor's operations center. Simulated telemetry, live
                terminal logs, and encrypted communications.
              </p>
            </div>
            <div className="control-grid">
              <div className="control-main">
                <div className="flex justify-between mono-label text-gold">
                  <span>
                    <span className="status-pulse" /> SYSTEM ONLINE
                  </span>
                  <span>COMMAND TELEMETRY 001</span>
                </div>
                <h3>
                  CURRENT OPERATION:
                  <br />
                  <span className="text-primary">SECURITY BREACH</span>
                </h3>
                <div className="progress-track">
                  <div className="progress-fill" />
                </div>
                <div className="control-metrics">
                  <div className="control-metric">
                    <span className="mono-label text-muted-foreground">STATUS</span>
                    <strong>82%</strong>
                  </div>
                  <div className="control-metric">
                    <span className="mono-label text-muted-foreground">CREWS ACTIVE</span>
                    <strong>32</strong>
                  </div>
                  <div className="control-metric">
                    <span className="mono-label text-muted-foreground">MP RESERVE</span>
                    <strong>160K</strong>
                  </div>
                </div>
              </div>
              <div className="control-side">
                <div className="mono-label text-primary">
                  <Radio size={15} className="inline mr-2 animate-pulse" /> ENCRYPTED RADAR FEED
                </div>
                <div className="terminal">
                  {[
                    "SYSTEM INITIALIZED [PORT: 40.4168°N]",
                    "32 CREWS RECRUITED AND VERIFIED",
                    "VAULT SECURITY COUNTERMEASURES ONLINE",
                    "MISSION AUCTION CHANNEL OPEN",
                    "ENCRYPTION KEY ACTIVE: DALI-MV01",
                    "AWAITING NEXT DIRECTIVE...",
                  ].map((log, i) => (
                    <div key={log}>
                      <span className="text-muted-foreground">0{i + 1}: </span>&gt; {log}
                    </div>
                  ))}
                </div>
                <div className="mt-10 border-t pt-5">
                  <p className="mono-label text-muted-foreground">ALERT BROADCAST</p>
                  <p className="font-display text-2xl uppercase mt-3 text-primary">
                    MISSION UNLOCK IMMINENT
                  </p>
                  <Link
                    to="/mission-control"
                    className="mono-label inline-flex items-center gap-2 text-gold mt-6 hover:text-foreground transition-colors"
                  >
                    OPEN MISSION CONTROL ROOM <ArrowUpRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 05: MISSION POINTS & HINT AUCTION
            ========================================================================= */}
        <section id="points">
          <div className="section-wrap auction-layout" data-scroll-reveal>
            <div>
              <h2 className="display-title section-title">
                MISSION
                <br />
                <span className="text-primary">POINTS.</span>
              </h2>
              <p className="section-intro mt-8">
                Information has a price. Spend strategically. Buy intelligence. Protect your
                advantage. Every team receives an initial allocation of 5,000 MP.
              </p>
              <p className="mono-label text-muted-foreground mt-12">YOUR DEMO BALANCE</p>
              <div className="big-balance">
                {balance.toLocaleString()}
                <span className="text-3xl ml-2">MP</span>
              </div>
            </div>
            <div className="auction-panel">
              <div className="auction-header">
                <h3 className="font-display font-bold text-4xl uppercase mt-5">
                  UNKNOWN VARIABLE DETECTED
                </h3>
                <p className="mono-label text-muted-foreground mt-3">
                  MISSION #04 &nbsp;·&nbsp; STRATEGIC BIDDING ACTIVE
                </p>
              </div>
              <p className="mono-label text-muted-foreground mt-6">PROPOSED INTELLIGENCE TIERS</p>
              <div className="tier-grid">
                {(
                  [
                    ["500+", "BASIC"],
                    ["1000+", "TIER 1"],
                    ["1500+", "TIER 2"],
                    ["2000+", "TIER 3"],
                  ] as const
                ).map(([amount, tier]) => (
                  <button
                    key={tier}
                    className="tier"
                    onClick={() => {
                      heistAudio.playClick();
                      setBid(amount.replace("+", ""));
                    }}
                  >
                    {amount}
                    <br />
                    <span className="text-gold">{tier}</span>
                  </button>
                ))}
              </div>
              <input
                id="bid"
                className="auction-amount"
                type="number"
                aria-label="Your bid in mission points"
                placeholder="Enter bid"
                min="500"
                max={balance}
                step="100"
                value={bid}
                onChange={(e) => setBid(e.target.value)}
              />
              <Button variant="heist" className="w-full h-12" onClick={placeBid}>
                PLACE DEMO BID <ArrowRight />
              </Button>
              <p className="mono-label text-gold min-h-9 mt-5" role="status">
                {auctionResult || "SIMULATION ONLY — TEST THE AUCTION TIERS"}
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 06: MISSION ARCHIVE
            ========================================================================= */}
        <section className="control-section" id="archive">
          <div className="section-wrap" data-scroll-reveal>
            <div className="section-head">
              <div>
                <h2 className="display-title section-title">
                  MISSION
                  <br />
                  <span className="text-primary">ARCHIVE.</span>
                </h2>
              </div>
              <p className="section-intro">
                Proposed mission categories. Objectives and release timing remain classified until
                official deployment by the organizers.
              </p>
            </div>
            <div className="archive-grid">
              {missions.map((name, i) => (
                <button
                  className="archive-file"
                  key={name}
                  onClick={() => {
                    heistAudio.playClick();
                    setMission(i);
                  }}
                >
                  <div className="flex justify-between mono-label text-muted-foreground">
                    <span>FILE {String(i + 1).padStart(2, "0")}</span>
                    <LockKeyhole size={14} className="text-primary" />
                  </div>
                  <h3>{name}</h3>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 07: RESTRICTED ACCESS // THE VAULT CHAMBER
            With authentic gold bullion & laser grid wallpaper
            ========================================================================= */}
        <section className="vault-section" id="vault">
          <img
            className="vault-section-image"
            src={vaultGoldImage}
            loading="lazy"
            width={1920}
            height={1080}
            alt="Towering stacks of gold bars inside the impenetrable bank vault chamber with red lasers"
          />
          <div className="section-wrap" data-scroll-reveal>
            <h2 className="display-title section-title">
              THE
              <br />
              <span className="text-primary">VAULT.</span>
            </h2>
            <p className="section-intro mt-7">
              What's hidden inside? Explore the chamber. Every object tells a part of the heist
              story.
            </p>
            <div className="vault-actions">
              {(
                [
                  ["GOLD BAR", "VALUE EXTRACTED — YOUR COMPLETED SOLUTION IS THE REAL GOLD."],
                  ["MISSION FILE", "MISSION DATA CLASSIFIED — BRIEFINGS UNLOCK DURING THE BUILD."],
                  ["TERMINAL", "SECURITY CLEARANCE VERIFIED — ENCRYPTION ACTIVE."],
                  ["CENTRAL CORE", "FINAL EXTRACTION PROTOCOL READY FOR ESCAPE."],
                ] as const
              ).map(([label, response]) => (
                <Button
                  key={label}
                  variant="heistOutline"
                  onClick={() => {
                    heistAudio.playVaultClank();
                    setVaultResponse(response);
                  }}
                >
                  {label} <ArrowUpRight />
                </Button>
              ))}
            </div>
            <p className="vault-response mono-label" role="status">
              {vaultResponse}
            </p>
          </div>
        </section>

        {/* =========================================================================
            SECTION 08: THE HEIST CODE (RULES & FLOW)
            ========================================================================= */}
        <section className="info-section" id="rules">
          <div className="section-wrap" data-scroll-reveal>
            <div className="section-head">
              <div>
                <h2 className="display-title section-title">
                  THE HEIST
                  <br />
                  <span className="text-primary">CODE.</span>
                </h2>
              </div>
              <p className="section-intro">
                Everything you need to know about the proposed operation. Final rules, detailed
                schedules, and venue will be officially published.
              </p>
            </div>
            <div className="info-grid">
              <div className="info-block">
                <h3>24 HOURS. ONE PLAN.</h3>
                <p>
                  Teams compete in a continuous 24-hour sprint, responding to real-time challenges
                  and refining their system under high pressure.
                </p>
              </div>
              <div className="info-block">
                <h3>AI, MACHINE LEARNING & CYBERSECURITY.</h3>
                <p>
                  Two dedicated domains, with 16 crews per domain and four deep, industry-level
                  problem statements overall.
                </p>
              </div>
              <div className="info-block">
                <h3>RULES: CLASSIFIED.</h3>
                <p>
                  Detailed eligibility, jury metrics, hint auction dynamics, and code repositories
                  are finalized in the official rulebook.
                </p>
              </div>
            </div>

            <p className="mono-label text-muted-foreground mt-16">PROPOSED OPERATION FLOW</p>
            <div className="flow-line">
              {[
                "Recruitment",
                "Problem Selection",
                "Infiltration",
                "Continuous Build",
                "Mission Unlocks",
                "Hint Auctions",
                "Adapt & Harden",
                "Final Extraction",
                "Jury Verdict",
              ].map((step, i) => (
                <span className="flow-step mono-label" key={step}>
                  {String(i + 1).padStart(2, "0")} · {step}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 09: FREQUENT TRANSMISSIONS (FAQ)
            ========================================================================= */}
        <section id="faq">
          <div className="section-wrap" data-scroll-reveal>
            <div className="section-head">
              <div>
                <h2 className="display-title section-title">
                  INTELLIGENCE
                  <br />
                  <span className="text-primary">BRIEFING.</span>
                </h2>
              </div>
              <CircleHelp className="text-gold" size={34} />
            </div>
            {faq.map(([question, answer]) => (
              <details className="faq-row" key={question}>
                <summary onClick={() => heistAudio.playClick()}>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* =========================================================================
            FINAL EXTRACTION & RECRUITMENT CALL
            ========================================================================= */}
        <section className="final-section" data-scroll-reveal>
          <h2 className="display-title">
            THE VAULT
            <br />
            WILL <span className="mh-stamp-box">OPEN.</span>
          </h2>
          <p className="font-display uppercase text-3xl mb-9 tracking-wider">
            WHAT WILL YOU TAKE OUT?
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="heist"
              className="h-12 px-8 text-sm"
              onClick={() => {
                heistAudio.playAccessGranted();
                setDialog("registration");
              }}
            >
              JOIN THE HEIST <ArrowUpRight />
            </Button>
            <Button
              variant="heistOutline"
              className="h-12 px-8 text-sm"
              onClick={() => {
                heistAudio.playClick();
                scrollTo("rules");
              }}
            >
              VIEW EVENT CODE <ArrowRight />
            </Button>
          </div>
          <p className="mono-label text-muted-foreground mt-10">
            {remaining === null
              ? "DATES & OFFICIAL REGISTRATION: TO BE ANNOUNCED"
              : `THE HEIST BEGINS IN ${Math.floor(remaining / 86400000)}D ${Math.floor(remaining / 3600000) % 24}H ${Math.floor(remaining / 60000) % 60}M ${Math.floor(remaining / 1000) % 60}S`}
          </p>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div>
          <div className="brand text-3xl">
            THE MYSTERY <b className="mh-stamp-box">VAULT.</b>
          </div>
          <p className="mono-label mt-5 text-gold">PLAN. INFILTRATE. ADAPT. EXTRACT.</p>
        </div>
        <div className="flex flex-wrap gap-5 mono-label">
          {nav.map(([label, id]) => (
            <a key={id} href={`#${id}`} onClick={() => heistAudio.playClick()}>
              {label}
            </a>
          ))}
          <button
            className="mono-label hover:text-foreground transition-colors"
            onClick={() => {
              heistAudio.playClick();
              setDialog("registration");
            }}
          >
            CONTACT
          </button>
        </div>
        <div className="mono-label">
          MISSIONATHON © 2026
          <br />
          THIS SYSTEM IS ACTIVELY MONITORED.
        </div>

        {/* CREDITS & ACKNOWLEDGMENTS */}
        <div className="w-full col-span-full mt-10 pt-8 border-t border-border/80">
          <p className="mono-label text-xs text-gold font-bold mb-4 tracking-wider">
            CREDITS & ACKNOWLEDGMENTS
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-neutral-400 leading-relaxed">
            {/* 3D Models Authors */}
            <div className="p-3.5 rounded bg-neutral-950/70 border border-border/70">
              <p className="mono-label text-[10px] text-primary font-bold mb-2 uppercase">
                3D Models (Sketchfab)
              </p>
              <ul className="space-y-1.5">
                <li>
                  <strong className="text-foreground">Salvador Dalí Mask</strong> by{" "}
                  <a
                    href="https://sketchfab.com/3d-models/salvador-dali-mask-money-heist-363930600ee5400dbf4ea85284ca9a23"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:underline"
                  >
                    h3ydari96 (Nima)
                  </a>
                </li>
                <li>
                  <strong className="text-foreground">MC Union Bank Vault</strong> by{" "}
                  <a
                    href="https://sketchfab.com/3d-models/heist-mc-union-bank-10a21127e14d43adaf37f150fb3cafca"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:underline"
                  >
                    santirodero7 (SoftGrooveDesign)
                  </a>
                </li>
              </ul>
            </div>

            {/* Original Soundtrack */}
            <div className="p-3.5 rounded bg-neutral-950/70 border border-border/70">
              <p className="mono-label text-[10px] text-primary font-bold mb-2 uppercase">
                Original Theme Song
              </p>
              <p className="text-foreground font-semibold mb-1">"My Life Is Going On"</p>
              <p>
                Music composed by <strong className="text-foreground">Manel Santisteban</strong>
                <br />
                Lyrics & vocals by <strong className="text-foreground">Cecilia Krull</strong>
              </p>
            </div>

            {/* Netflix & Creators */}
            <div className="p-3.5 rounded bg-neutral-950/70 border border-border/70">
              <p className="mono-label text-[10px] text-primary font-bold mb-2 uppercase">
                Franchise & Production
              </p>
              <p className="text-foreground font-semibold mb-1">Money Heist (La Casa de Papel)</p>
              <p>
                Created by <strong className="text-foreground">Álex Pina</strong>
                <br />
                Vancouver Media · Atresmedia ·{" "}
                <strong className="text-primary font-bold">Netflix</strong>
              </p>
            </div>
          </div>
        </div>
{/* STYLISH SIGNATURE BADGE */}
<div className="w-full col-span-full mt-6 pt-6 border-t border-primary/20 flex items-center justify-center">
  <p className="font-display tracking-[0.2em] text-sm sm:text-base uppercase text-neutral-400">
    Developed by{" "}
    <span className="mh-signature font-semibold text-neutral-200 transition-all duration-300 cursor-default hover:text-primary hover:[text-shadow:0_0_8px_rgba(225,38,32,0.9),0_0_20px_rgba(225,38,32,0.6),0_0_40px_rgba(225,38,32,0.35)]">
      Harshil
    </span>
  </p>
</div>
      </footer>

      {/* MODAL DIALOGS */}
      {(mission !== null || dialog) && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setMission(null);
              setDialog(null);
            }
          }}
        >
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label={mission !== null ? `${missions[mission]} file` : "System message"}
          >
            <Button
              variant="heistGhost"
              size="icon"
              className="modal-close"
              aria-label="Close dialog"
              onClick={() => {
                setMission(null);
                setDialog(null);
              }}
            >
              <X />
            </Button>

            {mission !== null ? (
              <>
                <h2>{missions[mission]}</h2>
                <p className="mono-label text-gold">CLASSIFICATION: TOP SECRET</p>
                <p className="mt-8">
                  This is a proposed mission category. The actual problem objective, injection
                  schedule, and evaluation metrics remain classified until official announcement.
                </p>
              </>
            ) : dialog === "identity" ? (
              <>
                <h2>YOU ARE PART OF THE CREW.</h2>
                <p>
                  Identity confirmed. The Salvador Dalí mask is your symbol of resistance and
                  precision. Keep your strategy confidential.
                </p>
                <Button
                  variant="heist"
                  className="mt-8"
                  onClick={() => {
                    heistAudio.playAccessGranted();
                    setDialog(null);
                  }}
                >
                  CONTINUE OPERATION <ArrowRight />
                </Button>
              </>
            ) : (
              <>
                <h2>THE CREW IS FORMING.</h2>
                <p>
                  Official registration dates, venue coordinates, and registration links will be
                  released by the organizers shortly. Prepare your squad.
                </p>
                <Button
                  variant="heist"
                  className="mt-8"
                  onClick={() => {
                    heistAudio.playClick();
                    setDialog(null);
                  }}
                >
                  ACKNOWLEDGE <ArrowRight />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
