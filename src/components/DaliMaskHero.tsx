export function DaliMaskHero() {
  // Clean, transparent Sketchfab 3D embed URL without ui_theme=dark to prevent background shading
  // Model: https://sketchfab.com/3d-models/salvador-dali-mask-money-heist-363930600ee5400dbf4ea85284ca9a23
  const sketchfabUrl =
    "https://sketchfab.com/models/363930600ee5400dbf4ea85284ca9a23/embed?autostart=1&transparent=1&ui_animations=0&ui_infos=0&ui_stop=0&ui_inspector=0&ui_watermark_link=0&ui_watermark=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_annotations=0&ui_controls=0&ui_hint=0&ui_general_controls=0&scrollwheel=0&camera=0&preload=1";

  return (
    <div className="dali-mask-hero-container" aria-label="Salvador Dalí 3D Mask">
      {/* Precision crop viewport with soft feathered edge mask: removes any rectangular box, border, or shady background */}
      <div className="dali-mask-crop-viewport">
        <iframe
          title="Salvador Dalí Mask - Money Heist"
          src={sketchfabUrl}
          className="dali-mask-iframe"
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
  );
}
