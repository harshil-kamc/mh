/**
 * Sound Engine for The Mystery Vault
 * Plays the official Money Heist theme ("My Life Is Going On") at 70% volume on site load.
 * Supports infinite looping, fresh autoplay on every open/visit, toggle mute/unmute,
 * and tactical heist sound effects.
 */

class HeistAudio {
  private ctx: AudioContext | null = null;
  private bgMusic: HTMLAudioElement | null = null;
  public isMuted: boolean = false;
  private subscribers: Set<(isMuted: boolean) => void> = new Set();
  private unlockListenersAttached: boolean = false;

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

  public subscribe(cb: (isMuted: boolean) => void): () => void {
    this.subscribers.add(cb);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  private notify() {
    this.subscribers.forEach((cb) => cb(this.isMuted));
  }

  /**
   * Sets up interaction unlockers on mobile and desktop
   */
  private setupInteractionUnlock() {
    if (typeof window === "undefined" || this.unlockListenersAttached) return;
    this.unlockListenersAttached = true;

    const events = ["touchstart", "touchend", "pointerdown", "click", "keydown"] as const;

    const unlockAndPlay = () => {
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      if (this.bgMusic && !this.isMuted) {
        this.bgMusic.volume = 0.7;
        const p = this.bgMusic.play();
        if (p !== undefined) {
          p.then(() => {
            // Audio successfully playing! Remove listeners now.
            events.forEach((ev) => {
              window.removeEventListener(ev, unlockAndPlay);
              document.removeEventListener(ev, unlockAndPlay);
            });
            this.unlockListenersAttached = false;
          }).catch(() => {
            // Still waiting for qualifying user interaction
          });
        }
      }
    };

    events.forEach((ev) => {
      window.addEventListener(ev, unlockAndPlay, { passive: true });
      document.addEventListener(ev, unlockAndPlay, { passive: true });
    });
  }

  /**
   * Initializes and plays the theme song at 70% volume on site load.
   * Every time the site is opened/visited, it always starts unmuted and plays in an infinite loop.
   */
  public initBackgroundMusic() {
    if (typeof window === "undefined") return;

    // Reset to unmuted on every open/visit as requested
    this.isMuted = false;
    this.notify();

    if (this.bgMusic) {
      this.bgMusic.volume = 0.7;
      if (this.bgMusic.paused) {
        const playPromise = this.bgMusic.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            this.setupInteractionUnlock();
          });
        }
      }
      return;
    }

    try {
      this.bgMusic = new Audio("/audio/heist-theme.mp3");
      this.bgMusic.loop = true; // HTML5 native loop
      this.bgMusic.volume = 0.7; // exactly 70% volume

      // Fallback loop safeguard: restart track when it reaches the end across all mobile browsers
      this.bgMusic.addEventListener("ended", () => {
        if (!this.isMuted && this.bgMusic) {
          this.bgMusic.currentTime = 0;
          this.bgMusic.play().catch(() => {});
        }
      });

      // Handle pause or stall recovery to keep loop continuous
      this.bgMusic.addEventListener("pause", () => {
        if (
          !this.isMuted &&
          this.bgMusic &&
          this.bgMusic.currentTime > 0 &&
          this.bgMusic.currentTime >= this.bgMusic.duration - 0.5
        ) {
          this.bgMusic.currentTime = 0;
          this.bgMusic.play().catch(() => {});
        }
      });

      const playPromise = this.bgMusic.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isMuted = false;
            this.notify();
          })
          .catch(() => {
            // Browser autoplay blocked: unlock immediately upon first user touch/click anywhere
            this.setupInteractionUnlock();
          });
      }
    } catch {
      // ignore
    }
  }

  /**
   * Toggles mute/unmute.
   * If sound was held back by mobile autoplay restriction, single-tap immediately plays!
   */
  public toggleMute(): boolean {
    if (!this.bgMusic) {
      this.initBackgroundMusic();
      return false;
    }

    // If currently muted, unmute and play
    if (this.isMuted) {
      this.isMuted = false;
      this.notify();
      this.bgMusic.volume = 0.7;
      this.bgMusic
        .play()
        .then(() => {
          this.playAccessGranted();
        })
        .catch(() => {});
      return false;
    }

    // If unmuted in state but paused due to mobile browser autoplay restriction,
    // tapping the sound button is an intention to hear sound, NOT mute!
    if (this.bgMusic.paused) {
      this.isMuted = false;
      this.notify();
      this.bgMusic.volume = 0.7;
      this.bgMusic
        .play()
        .then(() => {
          this.playAccessGranted();
        })
        .catch(() => {});
      return false;
    }

    // Currently playing -> mute it
    this.isMuted = true;
    this.notify();
    this.bgMusic.pause();
    return true;
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
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
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
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.15);
      });
    } catch {
      // ignore
    }
  }
}

export const heistAudio = new HeistAudio();
