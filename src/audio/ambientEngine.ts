// Background ambient — plays /audio/ambient.mp3 in a seamless loop.
// Routed through WebAudio (decode -> BufferSource(loop=true) -> gain -> out)
// so we get clean fade in/out and gapless looping that <audio loop> can't
// guarantee with MP3 encoder padding.

const SRC = "/audio/ambient.mp3";
const TARGET_GAIN = 0.07; // intentionally quiet — pure background presence

class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private loading: Promise<void> | null = null;
  private started = false;
  private intensity = 0.5;

  // True only when audio is actually flowing (source playing + ctx running).
  // Listeners use this to know whether to keep retrying on user gestures.
  get isStarted() {
    return this.started && this.ctx?.state === "running";
  }

  // Preload + decode the buffer ahead of time, without trying to play.
  // Lets us prime the audio asset while the user is still on the splash so
  // that the moment a gesture (or autoplay) succeeds, playback is instant.
  async preload() {
    this.ensureCtx();
    if (!this.ctx) return;
    await this.load();
  }

  private ensureCtx() {
    if (this.ctx) return;
    const AC =
      (window as unknown as { AudioContext: typeof AudioContext }).AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
  }

  private async load() {
    if (this.buffer || !this.ctx) return;
    if (this.loading) return this.loading;
    this.loading = (async () => {
      try {
        const res = await fetch(SRC, { cache: "force-cache" });
        const arr = await res.arrayBuffer();
        this.buffer = await this.ctx!.decodeAudioData(arr);
      } catch {
        this.buffer = null;
      } finally {
        this.loading = null;
      }
    })();
    return this.loading;
  }

  async start() {
    this.ensureCtx();
    if (!this.ctx || !this.master) return;
    if (this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
      } catch {
        return;
      }
    }
    await this.load();
    if (!this.buffer) return;

    if (!this.started) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.buffer;
      src.loop = true;
      src.connect(this.master);
      src.start(0);
      this.started = true;
    }

    const now = this.ctx.currentTime;
    const target = TARGET_GAIN * (0.85 + this.intensity * 0.3);
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(target, now + 3.5);
  }

  stop() {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + 1.5);
  }

  // 0..1 — gently nudges volume by ±15% across the page; the bridge feeds
  // a bell-shaped curve here so the bed is fullest mid-page, quietest at edges.
  setIntensity(t: number) {
    const clamped = Math.max(0, Math.min(1, t));
    if (Math.abs(clamped - this.intensity) < 0.02) return;
    this.intensity = clamped;
    if (!this.ctx || !this.master || !this.started) return;
    const target = TARGET_GAIN * (0.85 + clamped * 0.3);
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(target, now + 1.2);
  }
}

export const ambient = new AmbientEngine();
