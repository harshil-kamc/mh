/**
 * Sound Engine for The Mystery Vault
 * Plays the official Money Heist theme ("My Life Is Going On") at 70% volume on site load.
 * Supports toggle mute/unmute and tactical heist sound effects.
 */

class HeistAudio {
  private ctx: AudioContext | null = null;
  private bgMusic: HTMLAudioElement | null = null;
  public isMuted: boolean = false;
  private initialized: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Initializes and plays the theme song at 70% volume when website opens
   */
  public initBackgroundMusic() {
    if (typeof window === "undefined") return;
    if (this.bgMusic) {
      if (this.bgMusic.paused && !this.isMuted) {
        this.bgMusic.volume = 0.7;
        this.bgMusic.play().catch(() => {});
      }
      return;
    }
    this.initialized = true;

    try {
      this.bgMusic = new Audio("/audio/heist-theme.mp3");
      this.bgMusic.loop = true;
      this.bgMusic.volume = 0.7; // exactly 70% volume
      this.isMuted = false;

      const playPromise = this.bgMusic.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isMuted = false;
          })
          .catch(() => {
            // Browser autoplay restrictions: start playing upon first user interaction
            const startOnInteraction = () => {
              if (this.bgMusic && !this.isMuted) {
                this.bgMusic.volume = 0.7;
                this.bgMusic.play().catch(() => {});
              }
              window.removeEventListener("click", startOnInteraction);
              window.removeEventListener("keydown", startOnInteraction);
              window.removeEventListener("scroll", startOnInteraction);
              window.removeEventListener("touchstart", startOnInteraction);
            };

            window.addEventListener("click", startOnInteraction, { once: true, passive: true });
            window.addEventListener("keydown", startOnInteraction, { once: true, passive: true });
            window.addEventListener("scroll", startOnInteraction, { once: true, passive: true });
            window.addEventListener("touchstart", startOnInteraction, {
              once: true,
              passive: true,
            });
          });
      }
    } catch {
      // ignore
    }
  }

  public toggleMute(): boolean {
    if (!this.bgMusic) {
      this.initBackgroundMusic();
      this.isMuted = false;
      return this.isMuted;
    }

    this.isMuted = !this.isMuted;

    if (this.bgMusic) {
      if (this.isMuted) {
        this.bgMusic.pause();
      } else {
        this.bgMusic.volume = 0.7; // exactly 70% volume
        this.bgMusic.play().catch(() => {});
        this.playAccessGranted();
      }
    }

    return this.isMuted;
  }

  public playClick() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // ignore
    }
  }

  public playVaultClank() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // ignore
    }
  }

  public playAccessGranted() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.07, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.15);
      });
    } catch {
      // ignore
    }
  }
}

export const heistAudio = new HeistAudio();
