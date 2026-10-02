import { useEffect, useRef, useState, useCallback } from "react";
import {
  ChevronRight,
  ChevronLeft,
  MapPin,
  Maximize2,
  Minimize2,
  X,
  Clock,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { heistAudio } from "@/lib/sound";
import { phases, type EventPhase } from "@/lib/event-config";

interface AnnotationObject {
  eye?: [number, number, number];
  target?: [number, number, number];
  name?: string;
  [key: string]: unknown;
}

interface SketchfabApiInstance {
  start: () => void;
  addEventListener: (event: string, callback: (...args: unknown[]) => void) => void;
  gotoAnnotation: (index: number, callback?: (err: Error | null, index?: number) => void) => void;
  getAnnotationList: (
    callback: (err: Error | null, annotations: AnnotationObject[]) => void,
  ) => void;
  hideAnnotationTooltip: (index: number, callback?: (err: Error | null) => void) => void;
  setCameraLookAt?: (
    eye: [number, number, number],
    target: [number, number, number],
    duration?: number,
    callback?: (err: Error | null) => void,
  ) => void;
}

interface SketchfabClientConstructor {
  new (iframe: HTMLIFrameElement): {
    init: (modelId: string, options: Record<string, unknown>) => void;
  };
}

declare global {
  interface Window {
    Sketchfab?: SketchfabClientConstructor;
  }
}

interface BankHeist3DWalkthroughProps {
  activePhase?: number; // 0-indexed (0 to 4)
  onPhaseChange?: (phaseIndex: number) => void;
}

// Model ID: heist-mc-union-bank-10a21127e14d43adaf37f150fb3cafca
const MODEL_ID = "10a21127e14d43adaf37f150fb3cafca";

// Clean permanent embed URL: hides all text, tooltips, UI overlays, hints, info boxes inside 3D model
const PERMANENT_EMBED_URL = `https://sketchfab.com/models/${MODEL_ID}/embed?autostart=1&transparent=1&annotations_visible=0&annotation_tooltip_visible=0&annotations_tooltips_visible=0&ui_annotations=0&ui_infos=0&ui_stop=0&ui_inspector=0&ui_watermark_link=0&ui_watermark=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_controls=0&ui_hint=0&ui_general_controls=0&scrollwheel=0&preload=1`;

export function BankHeist3DWalkthrough({
  activePhase,
  onPhaseChange,
}: BankHeist3DWalkthroughProps) {
  const [internalPhase, setInternalPhase] = useState<number>(0);
  const [apiReady, setApiReady] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState<
    "overview" | "steps" | "deliverables" | "intel"
  >("overview");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Movable circular logo button coordinates
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });
  const hasMovedRef = useRef(false);
  const isFirstMountRef = useRef(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const apiRef = useRef<SketchfabApiInstance | null>(null);
  const annotationsRef = useRef<AnnotationObject[]>([]);

  const currentPhaseIndex = activePhase !== undefined ? activePhase : internalPhase;
  const currentPhase: EventPhase = phases[currentPhaseIndex] || phases[0]!;

  // Proactively hide all annotation tooltips/textboxes inside the 3D viewer
  const hideAllTooltips = useCallback(() => {
    if (!apiRef.current) return;
    for (let i = 0; i < 20; i++) {
      try {
        apiRef.current.hideAnnotationTooltip(i);
      } catch {
        // ignore
      }
    }
  }, []);

  // Smoothly move the 3D camera to the corresponding sector without showing any textbox
  const flyToPhase = useCallback(
    (index: number) => {
      if (!apiRef.current) return;
      const list = annotationsRef.current;
      const maxIdx = list.length > 0 ? list.length - 1 : 4;
      const safeIdx = Math.max(0, Math.min(index, maxIdx));

      const ann = list[safeIdx];
      // If the model provided exact eye/target coordinates, use setCameraLookAt to eliminate tooltips completely
      if (ann && ann.eye && ann.target && apiRef.current.setCameraLookAt) {
        try {
          apiRef.current.setCameraLookAt(ann.eye, ann.target, 2.0, () => {
            hideAllTooltips();
          });
          hideAllTooltips();
          return;
        } catch {
          // fallback to gotoAnnotation
        }
      }

      // Fallback to gotoAnnotation with immediate tooltip suppression
      try {
        apiRef.current.gotoAnnotation(safeIdx, () => {
          hideAllTooltips();
        });
        hideAllTooltips();
        setTimeout(hideAllTooltips, 150);
        setTimeout(hideAllTooltips, 450);
      } catch {
        // ignore
      }
    },
    [hideAllTooltips],
  );

  // Fullscreen handler (supports both native browser fullscreen & CSS full-window fallback)
  const toggleFullscreen = async () => {
    heistAudio.playClick();
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      try {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
          setIsFullscreen(true);
          return;
        }
      } catch {
        // Fallback to full-window state
      }
      setIsFullscreen(true);
    } else {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch {
        // ignore
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFullscreen]);

  // Pointer drag event handlers for the circular logo button
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: dragPos.x,
      initY: dragPos.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    if (Math.hypot(dx, dy) > 8) {
      hasMovedRef.current = true;
      const container = containerRef.current;
      const bounds = container ? container.getBoundingClientRect() : null;
      const maxX = bounds ? Math.max(0, bounds.width - 70) : 600;
      const maxY = bounds ? Math.max(0, bounds.height - 70) : 450;

      const nextX = Math.max(0, Math.min(dragStartRef.current.initX + dx, maxX));
      const nextY = Math.max(0, Math.min(dragStartRef.current.initY + dy, maxY));

      setDragPos({ x: nextX, y: nextY });
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Click handler that works reliably and exclusively controls opening/closing
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }
    heistAudio.playClick();
    setInfoOpen((prev) => !prev);
  };

  // Initialize Sketchfab Viewer API once to control smooth 3D camera transitions
  useEffect(() => {
    let isMounted = true;

    const initSketchfab = () => {
      const Sketchfab = window.Sketchfab;
      if (!Sketchfab || !iframeRef.current) return;

      try {
        const client = new Sketchfab(iframeRef.current);
        client.init(MODEL_ID, {
          success: (api: unknown) => {
            if (!isMounted) return;
            const typedApi = api as SketchfabApiInstance;
            apiRef.current = typedApi;
            typedApi.start();
            typedApi.addEventListener("viewerready", () => {
              if (!isMounted) return;
              setApiReady(true);

              // Retrieve annotation list for camera points
              try {
                typedApi.getAnnotationList((err, list) => {
                  if (!err && list && Array.isArray(list)) {
                    annotationsRef.current = list;
                  }
                  hideAllTooltips();
                });
              } catch {
                hideAllTooltips();
              }
            });

            // Suppress tooltips on any annotation selection or focus
            typedApi.addEventListener("annotationSelect", () => {
              hideAllTooltips();
            });

            typedApi.addEventListener("annotationFocus", () => {
              hideAllTooltips();
            });
          },
          error: () => {
            setApiReady(false);
          },
          autostart: 1,
          transparent: 1,
          annotations_visible: 0,
          annotation_tooltip_visible: 0,
          annotations_tooltips_visible: 0,
          ui_annotations: 0,
          ui_controls: 0,
          ui_infos: 0,
          ui_watermark: 0,
          ui_stop: 0,
          ui_hint: 0,
          scrollwheel: 0,
          preload: 1,
        });
      } catch {
        setApiReady(false);
      }
    };

    // Load Sketchfab Viewer API script dynamically if not present
    if (!window.Sketchfab) {
      const script = document.createElement("script");
      script.src = "https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js";
      script.async = true;
      script.onload = () => {
        if (isMounted) initSketchfab();
      };
      document.body.appendChild(script);
    } else {
      initSketchfab();
    }

    return () => {
      isMounted = false;
    };
  }, [hideAllTooltips]);

  // When activePhase changes after mount, glide camera to that phase
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    if (apiRef.current && apiReady) {
      flyToPhase(currentPhaseIndex);
    }
  }, [currentPhaseIndex, apiReady, flyToPhase]);

  const handleSelectPhase = (index: number) => {
    heistAudio.playClick();
    setInternalPhase(index);
    onPhaseChange?.(index);
    if (apiRef.current && apiReady) {
      flyToPhase(index);
    }
  };

  // Smooth cycling for NEXT PHASE — always advances without getting disabled
  const handleNextPhase = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    heistAudio.playClick();
    const nextIdx = (currentPhaseIndex + 1) % phases.length;
    setInternalPhase(nextIdx);
    onPhaseChange?.(nextIdx);
    if (apiRef.current && apiReady) {
      flyToPhase(nextIdx);
    }
  };

  // Smooth cycling for PREV PHASE
  const handlePrevPhase = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    heistAudio.playClick();
    const prevIdx = (currentPhaseIndex - 1 + phases.length) % phases.length;
    setInternalPhase(prevIdx);
    onPhaseChange?.(prevIdx);
    if (apiRef.current && apiReady) {
      flyToPhase(prevIdx);
    }
  };

  return (
    <section className="bank-walkthrough-section" id="blueprint" data-scroll-reveal>
      <div className="section-wrap">
        {/* Section Header */}
        <div className="section-head mb-6">
          <div>
            <p className="mono-label eyebrow">
              02 — 3D BANK RECONNAISSANCE{" "}
              <span className="mh-stamp-box text-xs">FACILITY SCAN</span>
            </p>
            <h2 className="display-title section-title">
              THE UNION BANK
              <br />
              <span className="text-primary">HEIST BLUEPRINT.</span>
            </h2>
          </div>
          <p className="section-intro">
            Expansive 3D architectural model of the Union Bank heist. All numbers{" "}
            <strong>(1, 2, 3, 4, 5)</strong> correspond to each hackathon phase. Click NEXT PHASE to
            advance or click the floating logo emblem to inspect all phase headings and tactical
            briefings.
          </p>
        </div>

        {/* =========================================================================
            CINEMATIC FULL-WIDTH 3D VAULT MODEL
            Clean top — no in-model headings bar! No textboxes inside 3D model!
            ========================================================================= */}
        <div
          className={`bank-cinema-wrap ${
            isFullscreen
              ? "fixed inset-0 z-[9999] w-screen h-screen bg-[#070506] flex flex-col m-0 p-0"
              : ""
          }`}
          ref={containerRef}
        >
          {/* =========================================================================
              FIXED FULLSCREEN BUTTON ON THE RIGHT SIDE
              ========================================================================= */}
          <div className="absolute top-4 right-4 z-40">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="h-10 px-3.5 rounded bg-neutral-950/95 backdrop-blur-xl border border-primary/60 text-foreground hover:text-white hover:border-gold hover:bg-neutral-900 transition-all shadow-xl flex items-center gap-2 mono-label text-xs font-bold cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen 3D Viewer"}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen 3D Viewer"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 size={15} className="text-primary" />
                  <span>EXIT FULLSCREEN</span>
                </>
              ) : (
                <>
                  <Maximize2 size={15} className="text-primary" />
                  <span>FULLSCREEN</span>
                </>
              )}
            </button>
          </div>

          {/* =========================================================================
              CIRCULAR LOGO TYPE FLOATING AND MOVABLE BUTTON
              Uses /favicon.ico as requested! Drag to reposition · Click to view headings & info
              ========================================================================= */}
          <div
            className="absolute top-4 left-4 z-40 flex flex-col items-center select-none touch-none"
            style={{
              transform: `translate3d(${dragPos.x}px, ${dragPos.y}px, 0)`,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <button
              type="button"
              onClick={handleLogoClick}
              className={`relative w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all p-2.5 ${
                infoOpen
                  ? "ring-4 ring-gold bg-neutral-900 scale-105 shadow-2xl shadow-primary/80"
                  : "bg-neutral-950/95 border-2 border-gold/90 shadow-2xl shadow-primary/50 hover:scale-105 hover:border-white"
              }`}
              title="Click to view all phase headings and intelligence · Drag to reposition"
              aria-label="Toggle phase headings and tactical intelligence"
            >
              {/* Authentic Favicon Emblem */}
              <img
                src="/favicon.ico"
                alt="Mystery Vault Emblem"
                className="w-8 h-8 object-contain pointer-events-none drop-shadow"
                draggable={false}
              />

              {/* Red Badge for Current Phase Number */}
              <span className="absolute -top-1 -right-1 bg-primary text-white font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ring-2 ring-neutral-950 shadow-md">
                0{currentPhase.number}
              </span>
            </button>

            {/* Small helper caption underneath logo */}
            <span className="mt-1 px-1.5 py-0.5 rounded bg-black/85 text-[9px] mono-label text-gold pointer-events-none font-bold shadow border border-gold/30">
              PHASE INTEL
            </span>
          </div>

          {/* =========================================================================
              PHASE HEADINGS & INTELLIGENCE HUD (SHOWN WHEN LOGO BUTTON IS CLICKED)
              ========================================================================= */}
          {infoOpen && (
            <div
              className="absolute top-16 left-4 z-50 w-[94%] sm:w-[500px] max-w-[calc(100%-32px)] max-h-[calc(100%-80px)] bg-neutral-950/98 backdrop-blur-2xl border border-primary/70 shadow-2xl rounded-sm flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              role="region"
              aria-label="Phase tactical intelligence"
            >
              {/* Header */}
              <div className="p-3.5 bg-neutral-900/90 border-b border-border flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="mh-stamp-box text-[9px]">PHASE {currentPhase.number}</span>
                    <span className="mono-label text-[10px] text-gold font-bold">
                      {currentPhase.tag}
                    </span>
                  </div>
                  <h3 className="font-display text-base uppercase text-foreground truncate mt-0.5">
                    {currentPhase.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setInfoOpen(false)}
                    className="p-1.5 rounded hover:bg-neutral-800 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    title="Close intelligence drawer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Tab Navigation for Current Phase Info */}
              <div className="flex border-b border-border bg-neutral-900/80 mono-label text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    heistAudio.playClick();
                    setActiveInfoTab("overview");
                  }}
                  className={`flex-1 py-2 text-center transition-colors border-b-2 font-bold cursor-pointer ${
                    activeInfoTab === "overview"
                      ? "border-primary text-primary bg-primary/10"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  OVERVIEW
                </button>
                <button
                  type="button"
                  onClick={() => {
                    heistAudio.playClick();
                    setActiveInfoTab("steps");
                  }}
                  className={`flex-1 py-2 text-center transition-colors border-b-2 font-bold cursor-pointer ${
                    activeInfoTab === "steps"
                      ? "border-primary text-primary bg-primary/10"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  STEPS ({currentPhase.steps.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    heistAudio.playClick();
                    setActiveInfoTab("deliverables");
                  }}
                  className={`flex-1 py-2 text-center transition-colors border-b-2 font-bold cursor-pointer ${
                    activeInfoTab === "deliverables"
                      ? "border-primary text-primary bg-primary/10"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  CHECKPOINTS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    heistAudio.playClick();
                    setActiveInfoTab("intel");
                  }}
                  className={`flex-1 py-2 text-center transition-colors border-b-2 font-bold cursor-pointer ${
                    activeInfoTab === "intel"
                      ? "border-primary text-primary bg-primary/10"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  INTEL
                </button>
              </div>

              {/* Tab Content Body for Active Phase */}
              <div className="p-4 overflow-y-auto flex-1 text-sm leading-relaxed space-y-3 max-h-60">
                {activeInfoTab === "overview" && (
                  <div>
                    <div className="flex flex-wrap items-center gap-3 text-xs mb-3 pb-2 border-b border-border/60">
                      <span className="text-gold flex items-center gap-1 font-mono">
                        <MapPin size={12} /> {currentPhase.location}
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1 font-mono">
                        <Clock size={12} /> {currentPhase.timeframe}
                      </span>
                    </div>

                    <h4 className="font-display text-base text-foreground tracking-wide uppercase">
                      {currentPhase.subtitle}
                    </h4>

                    <p className="text-xs text-neutral-300 leading-relaxed mt-2.5">
                      {currentPhase.detail}
                    </p>
                  </div>
                )}

                {activeInfoTab === "steps" && (
                  <div className="space-y-2">
                    <p className="mono-label text-[10px] text-muted-foreground mb-2">
                      OPERATIONAL PROTOCOL EXECUTION:
                    </p>
                    {currentPhase.steps.map((step, idx) => (
                      <div
                        key={step}
                        className="p-2.5 rounded-sm bg-neutral-900/90 border border-border/80 flex items-start gap-2.5 text-xs text-neutral-200"
                      >
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/20 border border-primary/40 px-1.5 py-0.5 rounded-sm shrink-0">
                          0{idx + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeInfoTab === "deliverables" && (
                  <div className="space-y-2">
                    <p className="mono-label text-[10px] text-gold mb-2">
                      REQUIRED SECTOR DELIVERABLES:
                    </p>
                    {currentPhase.deliverables.map((item) => (
                      <div
                        key={item}
                        className="p-2.5 rounded-sm bg-neutral-900/90 border border-border/80 flex items-center gap-2.5 text-xs text-neutral-200"
                      >
                        <CheckCircle2 size={14} className="text-primary shrink-0" />
                        <span className="font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeInfoTab === "intel" && (
                  <div className="space-y-3">
                    <div className="p-3 bg-primary/10 border border-primary/40 rounded-sm">
                      <div className="flex items-center gap-1.5 text-primary mono-label text-[10px] font-bold mb-1">
                        <Shield size={12} /> PROFESSOR'S DIRECTIVE
                      </div>
                      <p className="text-xs italic text-neutral-200">
                        "{currentPhase.tacticalNote}"
                      </p>
                    </div>

                    <div className="p-2.5 bg-neutral-900 border border-border text-xs text-muted-foreground space-y-1">
                      <p className="font-bold text-foreground mono-label text-[10px]">
                        SECTOR TIMEFRAME:
                      </p>
                      <p>{currentPhase.timeframe}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer with Prev & Next shortcuts */}
              <div className="p-2.5 bg-neutral-900/90 border-t border-border flex items-center justify-between text-xs mono-label">
                <button
                  type="button"
                  onClick={handlePrevPhase}
                  className="px-2.5 py-1 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft size={13} /> PREV
                </button>
                <span className="text-[10px] text-gold">SECTOR 0{currentPhaseIndex + 1} OF 05</span>
                <button
                  type="button"
                  onClick={handleNextPhase}
                  className="px-2.5 py-1 text-primary hover:text-white transition-colors flex items-center gap-1 font-bold cursor-pointer"
                >
                  NEXT <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Full-width 3D Canvas Viewport (100% CLEAN - NO TEXT OCCURRING IN 3D MODEL) */}
          <div
            className={`bank-cinema-canvas-container ${
              isFullscreen ? "!h-[calc(100vh-58px)] !min-h-0 flex-1" : ""
            }`}
          >
            <div className="bank-3d-crop-viewport">
              <iframe
                ref={iframeRef}
                title="Heist MC Union Bank - 3D Hackathon Walkthrough"
                src={PERMANENT_EMBED_URL}
                className="bank-3d-iframe"
                allow="autoplay; fullscreen; xr-spatial-tracking"
                xr-spatial-tracking="true"
                execution-while-out-of-viewport="true"
                execution-while-not-rendered="true"
                web-share="true"
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  boxShadow: "none",
                }}
              />
            </div>
          </div>

          {/* Bottom Phase Navigation Strip with all 5 numbers and Next/Prev controls */}
          <div className="relative z-30 p-3 bg-panel/95 border-t border-border flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="mono-label text-[11px] text-gold font-bold">ALL PHASES:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {phases.map((phase, idx) => {
                  const isActive = currentPhaseIndex === idx;
                  return (
                    <button
                      key={phase.number}
                      type="button"
                      onClick={() => handleSelectPhase(idx)}
                      className={`px-2.5 py-1.5 text-xs font-mono font-bold transition-all border cursor-pointer ${
                        isActive
                          ? "bg-primary text-white border-primary shadow-sm shadow-primary/30"
                          : "bg-surface text-muted-foreground border-border hover:text-foreground hover:border-gold/50"
                      }`}
                      title={`Jump to Phase ${phase.number}: ${phase.title}`}
                    >
                      {phase.number} · {phase.tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="mono-label text-xs px-2.5 py-1.5 border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen 3D Viewer"}
              >
                {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                <span className="hidden sm:inline">
                  {isFullscreen ? "EXIT FULLSCREEN" : "FULLSCREEN"}
                </span>
              </button>

              <button
                type="button"
                onClick={handlePrevPhase}
                className="mono-label text-xs px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={13} /> PREV
              </button>
              <button
                type="button"
                onClick={handleNextPhase}
                className="mono-label text-xs px-3.5 py-1.5 bg-primary text-white hover:bg-primary/80 transition-colors flex items-center gap-1.5 font-bold cursor-pointer shadow-sm shadow-primary/20"
              >
                NEXT PHASE <ChevronRight size={13} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Detailed 5-Phase Roadmap Cards directly below the clean 3D model */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mt-6">
          {phases.map((phase, idx) => {
            const isSelected = currentPhaseIndex === idx;
            return (
              <div
                key={phase.number}
                onClick={() => handleSelectPhase(idx)}
                className={`p-4 bg-panel border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-primary bg-surface shadow-lg shadow-primary/10"
                    : "border-border hover:border-border/80 hover:bg-surface/50"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="mono-label text-primary font-bold text-xs">
                      PHASE {phase.number}
                    </span>
                    <span className="mono-label text-[9px] text-gold border border-gold/30 px-1.5 py-0.5">
                      {phase.timeframe.split(" ")[1]}
                    </span>
                  </div>
                  <h4 className="font-display text-base uppercase text-foreground leading-snug">
                    {phase.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                    {phase.detail}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border flex justify-between items-center mono-label text-[10px]">
                  <span className="text-gold flex items-center gap-1 truncate max-w-[120px]">
                    <MapPin size={10} /> {phase.location.split("&")[0]}
                  </span>
                  <span className="text-primary hover:text-foreground inline-flex items-center gap-1 shrink-0">
                    ZOOM IN <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
