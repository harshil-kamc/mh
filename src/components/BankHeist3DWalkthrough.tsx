import { useEffect, useRef, useState } from "react";
import { ChevronRight, ChevronLeft, MapPin } from "lucide-react";
import { heistAudio } from "@/lib/sound";
import { phases, type EventPhase } from "@/lib/event-config";

interface SketchfabApiInstance {
  start: () => void;
  addEventListener: (event: string, callback: (...args: unknown[]) => void) => void;
  gotoAnnotation: (index: number, callback?: (err: Error | null, index?: number) => void) => void;
  getAnnotationList: (callback: (err: Error | null, annotations: unknown[]) => void) => void;
  hideAnnotationTooltip: (index: number, callback?: (err: Error | null) => void) => void;
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
const PERMANENT_EMBED_URL = `https://sketchfab.com/models/${MODEL_ID}/embed?autostart=1&transparent=1&annotations_tooltips_visible=0&ui_annotations=0&ui_infos=0&ui_stop=0&ui_inspector=0&ui_watermark_link=0&ui_watermark=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_controls=0&ui_hint=0&ui_general_controls=0&scrollwheel=0&camera=0&preload=1`;

export function BankHeist3DWalkthrough({
  activePhase,
  onPhaseChange,
}: BankHeist3DWalkthroughProps) {
  const [internalPhase, setInternalPhase] = useState<number>(0);
  const [apiReady, setApiReady] = useState(false);
  const [annotationsCount, setAnnotationsCount] = useState<number>(4);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const apiRef = useRef<SketchfabApiInstance | null>(null);

  const currentPhaseIndex = activePhase !== undefined ? activePhase : internalPhase;
  const pendingPhaseRef = useRef<number>(currentPhaseIndex);

  const flyToAnnotation = (index: number) => {
    if (!apiRef.current) return;
    const maxIdx = annotationsCount > 0 ? annotationsCount - 1 : 3;
    const targetIdx = Math.max(0, Math.min(index, maxIdx));
    try {
      apiRef.current.gotoAnnotation(targetIdx, () => {
        try {
          apiRef.current?.hideAnnotationTooltip(targetIdx);
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    }
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

              // Query all annotations and hide all tooltips
              try {
                typedApi.getAnnotationList((err, list) => {
                  if (!err && list && Array.isArray(list)) {
                    if (list.length > 0) {
                      setAnnotationsCount(list.length);
                    }
                    for (let i = 0; i < list.length; i++) {
                      try {
                        typedApi.hideAnnotationTooltip(i);
                      } catch {
                        // ignore
                      }
                    }
                  }
                });
              } catch {
                // ignore
              }

              // Fly to target annotation without reloading
              const maxIdx = annotationsCount > 0 ? annotationsCount - 1 : 3;
              const targetIdx = Math.max(0, Math.min(pendingPhaseRef.current, maxIdx));
              typedApi.gotoAnnotation(targetIdx, () => {
                try {
                  typedApi.hideAnnotationTooltip(targetIdx);
                } catch {
                  // ignore
                }
              });
            });

            // Listen to number pin click inside the 3D model itself and sync with phases
            typedApi.addEventListener("annotationSelect", (info: unknown) => {
              if (!isMounted) return;
              const idx = typeof info === "number" ? info : (info as { index?: number })?.index;
              if (typeof idx === "number" && idx >= 0 && idx < phases.length) {
                try {
                  typedApi.hideAnnotationTooltip(idx);
                } catch {
                  // ignore
                }
                setInternalPhase(idx);
                pendingPhaseRef.current = idx;
                onPhaseChange?.(idx);
              }
            });
          },
          error: () => {
            setApiReady(false);
          },
          autostart: 1,
          transparent: 1,
          annotations_tooltips_visible: 0,
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
  }, []);

  // When activePhase changes, fly camera in the same model without reloading
  useEffect(() => {
    pendingPhaseRef.current = currentPhaseIndex;
    if (apiRef.current && apiReady) {
      flyToAnnotation(currentPhaseIndex);
    }
  }, [currentPhaseIndex, apiReady, annotationsCount]);

  const handleSelectPhase = (index: number) => {
    heistAudio.playClick();
    setInternalPhase(index);
    pendingPhaseRef.current = index;
    onPhaseChange?.(index);

    if (apiRef.current && apiReady) {
      flyToAnnotation(index);
    }
  };

  const handleNextPhase = () => {
    const nextIdx = (currentPhaseIndex + 1) % phases.length;
    handleSelectPhase(nextIdx);
  };

  const handlePrevPhase = () => {
    const prevIdx = (currentPhaseIndex - 1 + phases.length) % phases.length;
    handleSelectPhase(prevIdx);
  };

  return (
    <section className="bank-walkthrough-section" id="blueprint" data-scroll-reveal>
      <div className="section-wrap">
        {/* Section Header */}
        <div className="section-head mb-6">
          <div>
            <p className="mono-label eyebrow">
              02 // 3D BANK RECONNAISSANCE{" "}
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
            <strong>(1, 2, 3, 4, 5)</strong> correspond to each hackathon phase. Select any number
            to glide smoothly into that sector inside the 3D model.
          </p>
        </div>

        {/* =========================================================================
            CINEMATIC FULL-WIDTH 3D VAULT MODEL WITH IN-MODEL HEADINGS
            ========================================================================= */}
        <div className="bank-cinema-wrap">
          {/* ALL NUMBERS AS PHASES: Top Bar Headings for Phase 01 to 05 */}
          <div className="in-model-headings-bar">
            {phases.map((phase, idx) => {
              const isActive = currentPhaseIndex === idx;
              return (
                <button
                  key={phase.number}
                  type="button"
                  onClick={() => handleSelectPhase(idx)}
                  className={`in-model-heading-btn ${isActive ? "active" : ""}`}
                  aria-pressed={isActive}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`in-model-number ${
                        isActive ? "bg-primary text-white" : "bg-neutral-800 text-gold"
                      }`}
                    >
                      {phase.number}
                    </span>
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="in-model-tag mono-label">PHASE {phase.number}</span>
                        {isActive && <span className="status-pulse" />}
                      </div>
                      <strong className="in-model-title font-display block truncate">
                        {phase.title}
                      </strong>
                      <span className="in-model-sub text-[10px] mono-label text-muted-foreground block truncate">
                        {phase.location.split("&")[0]}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Full-width 3D Canvas Viewport (100% CLEAN - NO TEXT OCCURRING IN 3D MODEL) */}
          <div className="bank-cinema-canvas-container">
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
          <div className="p-3 bg-panel/95 border-t border-border flex flex-wrap items-center justify-between gap-3">
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
                      className={`px-2.5 py-1.5 text-xs font-mono font-bold transition-all border ${
                        isActive
                          ? "bg-primary text-white border-primary shadow-sm shadow-primary/30"
                          : "bg-surface text-muted-foreground border-border hover:text-foreground hover:border-gold/50"
                      }`}
                      title={`Jump to Phase ${phase.number}: ${phase.title}`}
                    >
                      {phase.number} // {phase.tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPhaseIndex === 0}
                onClick={handlePrevPhase}
                className="mono-label text-xs px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1"
              >
                <ChevronLeft size={13} /> PREV
              </button>
              <button
                type="button"
                disabled={currentPhaseIndex === phases.length - 1}
                onClick={handleNextPhase}
                className="mono-label text-xs px-3 py-1.5 bg-primary/20 border border-primary text-foreground hover:bg-primary/30 transition-colors flex items-center gap-1 font-bold"
              >
                NEXT PHASE <ChevronRight size={13} className="text-primary" />
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
