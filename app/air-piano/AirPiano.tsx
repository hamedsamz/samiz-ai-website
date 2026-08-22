"use client";

import type { HandLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./air-piano.module.css";

type Phase = "idle" | "loading" | "ready" | "error";
type TipState = { y: number; time: number; armed: boolean; note: number; anchorY: number; triggerY: number };

const NOTES = [
  { fa: "دو", latin: "C", key: "A", frequency: 261.63, color: "#ff6b7a" },
  { fa: "رِ", latin: "D", key: "S", frequency: 293.66, color: "#ffad5a" },
  { fa: "می", latin: "E", key: "D", frequency: 329.63, color: "#ffe36a" },
  { fa: "فا", latin: "F", key: "F", frequency: 349.23, color: "#69e39c" },
  { fa: "سُل", latin: "G", key: "J", frequency: 392, color: "#54d9f5" },
  { fa: "لا", latin: "A", key: "K", frequency: 440, color: "#8f8bff" },
  { fa: "سی", latin: "B", key: "L", frequency: 493.88, color: "#e782ff" },
] as const;

const DRUMS = [
  { fa: "کیک", latin: "KICK", key: "1", kind: "kick", color: "#ff7657" },
  { fa: "اسنیر", latin: "SNARE", key: "2", kind: "snare", color: "#ffc857" },
  { fa: "های‌هت", latin: "HI-HAT", key: "3", kind: "hihat", color: "#5fe1dd" },
  { fa: "تام", latin: "TOM", key: "4", kind: "tom", color: "#b68cff" },
] as const;

const FINGER_TIPS = [4, 8, 12, 16, 20] as const;
const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15],
  [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

function getCoverMapper(video: HTMLVideoElement, width: number, height: number) {
  const sourceWidth = video.videoWidth || width;
  const sourceHeight = video.videoHeight || height;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const renderedWidth = sourceWidth * scale;
  const renderedHeight = sourceHeight * scale;
  return (point: NormalizedLandmark) => ({
    x: (width - renderedWidth) / 2 + (1 - point.x) * renderedWidth,
    y: (height - renderedHeight) / 2 + point.y * renderedHeight,
  });
}

export default function AirPiano() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const audioRef = useRef<AudioContext | null>(null);
  const tipStatesRef = useRef<Map<string, TipState>>(new Map());
  const lastStrikeRef = useRef<Map<string, number>>(new Map());
  const activeTimersRef = useRef<Map<number, number>>(new Map());
  const drumTimersRef = useRef<Map<number, number>>(new Map());
  const handsCountRef = useRef(0);
  const playNoteRef = useRef<(index: number) => void>(() => undefined);
  const playDrumRef = useRef<(index: number) => void>(() => undefined);

  const [phase, setPhase] = useState<Phase>("idle");
  const [cameraVisible, setCameraVisible] = useState(false);
  const [handsCount, setHandsCount] = useState(0);
  const [lastSound, setLastSound] = useState("—");
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [activeDrums, setActiveDrums] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const ensureAudio = useCallback(async () => {
    if (!audioRef.current) audioRef.current = new AudioContext();
    if (audioRef.current.state === "suspended") await audioRef.current.resume();
    return audioRef.current;
  }, []);

  const flashNote = useCallback((index: number) => {
    setActiveNotes((current) => current.includes(index) ? current : [...current, index]);
    const existing = activeTimersRef.current.get(index);
    if (existing) window.clearTimeout(existing);
    const timer = window.setTimeout(() => {
      setActiveNotes((current) => current.filter((item) => item !== index));
      activeTimersRef.current.delete(index);
    }, 220);
    activeTimersRef.current.set(index, timer);
  }, []);

  const playNote = useCallback((index: number) => {
    const note = NOTES[index];
    if (!note) return;
    void ensureAudio().then((audio) => {
      const now = audio.currentTime;
      const master = audio.createGain();
      const filter = audio.createBiquadFilter();
      const vibrato = audio.createOscillator();
      const vibratoDepth = audio.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.18, now + 0.065);
      master.gain.exponentialRampToValueAtTime(0.13, now + 0.72);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 1.32);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(3600, now);
      filter.frequency.exponentialRampToValueAtTime(1750, now + 1.15);
      filter.Q.value = 1.25;
      filter.connect(master);
      master.connect(audio.destination);

      const real = new Float32Array(9);
      const imaginary = new Float32Array([0, 1, 0.72, 0.5, 0.36, 0.25, 0.18, 0.12, 0.08]);
      const violinWave = audio.createPeriodicWave(real, imaginary);
      vibrato.frequency.value = 5.4;
      vibratoDepth.gain.setValueAtTime(2, now);
      vibratoDepth.gain.linearRampToValueAtTime(7, now + 0.32);
      vibrato.connect(vibratoDepth);

      [-5, 5].forEach((detune, layerIndex) => {
        const oscillator = audio.createOscillator();
        const layer = audio.createGain();
        oscillator.setPeriodicWave(violinWave);
        oscillator.frequency.value = note.frequency;
        oscillator.detune.value = detune;
        layer.gain.value = layerIndex === 0 ? 0.58 : 0.42;
        vibratoDepth.connect(oscillator.detune);
        oscillator.connect(layer);
        layer.connect(filter);
        oscillator.start(now);
        oscillator.stop(now + 1.35);
      });
      vibrato.start(now);
      vibrato.stop(now + 1.35);

      const bowBuffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.16), audio.sampleRate);
      const bowData = bowBuffer.getChannelData(0);
      for (let sample = 0; sample < bowData.length; sample += 1) {
        bowData[sample] = (Math.random() * 2 - 1) * (1 - sample / bowData.length);
      }
      const bow = audio.createBufferSource();
      const bowFilter = audio.createBiquadFilter();
      const bowGain = audio.createGain();
      bow.buffer = bowBuffer;
      bowFilter.type = "bandpass";
      bowFilter.frequency.value = 1800;
      bowFilter.Q.value = 0.8;
      bowGain.gain.value = 0.035;
      bow.connect(bowFilter);
      bowFilter.connect(bowGain);
      bowGain.connect(master);
      bow.start(now);
    }).catch(() => undefined);
    setLastSound(`${note.fa} · ${note.latin}`);
    flashNote(index);
    if (navigator.vibrate) navigator.vibrate(12);
  }, [ensureAudio, flashNote]);

  const flashDrum = useCallback((index: number) => {
    setActiveDrums((current) => current.includes(index) ? current : [...current, index]);
    const existing = drumTimersRef.current.get(index);
    if (existing) window.clearTimeout(existing);
    const timer = window.setTimeout(() => {
      setActiveDrums((current) => current.filter((item) => item !== index));
      drumTimersRef.current.delete(index);
    }, 150);
    drumTimersRef.current.set(index, timer);
  }, []);

  const playDrum = useCallback((index: number) => {
    const drum = DRUMS[index];
    if (!drum) return;
    void ensureAudio().then((audio) => {
      const now = audio.currentTime;
      if (drum.kind === "kick") {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(155, now);
        oscillator.frequency.exponentialRampToValueAtTime(46, now + 0.3);
        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.36);
      } else if (drum.kind === "tom") {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(210, now);
        oscillator.frequency.exponentialRampToValueAtTime(92, now + 0.42);
        gain.gain.setValueAtTime(0.56, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.48);
      } else {
        const duration = drum.kind === "snare" ? 0.2 : 0.075;
        const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * duration), audio.sampleRate);
        const data = buffer.getChannelData(0);
        for (let sample = 0; sample < data.length; sample += 1) data[sample] = Math.random() * 2 - 1;
        const noise = audio.createBufferSource();
        const filter = audio.createBiquadFilter();
        const gain = audio.createGain();
        noise.buffer = buffer;
        filter.type = "highpass";
        filter.frequency.value = drum.kind === "snare" ? 1050 : 5900;
        gain.gain.setValueAtTime(drum.kind === "snare" ? 0.42 : 0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audio.destination);
        noise.start(now);
        if (drum.kind === "snare") {
          const body = audio.createOscillator();
          const bodyGain = audio.createGain();
          body.type = "triangle";
          body.frequency.value = 185;
          bodyGain.gain.setValueAtTime(0.2, now);
          bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
          body.connect(bodyGain);
          bodyGain.connect(audio.destination);
          body.start(now);
          body.stop(now + 0.14);
        }
      }
    }).catch(() => undefined);
    setLastSound(drum.fa);
    flashDrum(index);
    if (navigator.vibrate) navigator.vibrate(16);
  }, [ensureAudio, flashDrum]);

  useEffect(() => {
    playNoteRef.current = playNote;
    playDrumRef.current = playDrum;
  }, [playDrum, playNote]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    tipStatesRef.current.clear();
    lastStrikeRef.current.clear();
    handsCountRef.current = 0;
    setHandsCount(0);
    setCameraVisible(false);
  }, []);

  useEffect(() => () => {
    stopCamera();
    landmarkerRef.current?.close();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    activeTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    drumTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    void audioRef.current?.close();
  }, [stopCamera]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const index = NOTES.findIndex((note) => note.key.toLowerCase() === event.key.toLowerCase());
      const drumIndex = DRUMS.findIndex((drum) => drum.key === event.key);
      if (index >= 0) playNoteRef.current(index);
      else if (drumIndex >= 0) playDrumRef.current(drumIndex);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(stage);

    const draw = (now: number) => {
      const context = canvas.getContext("2d");
      if (!context) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (landmarker && video && video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        const result = landmarker.detectForVideo(video, now);
        const landmarks = result.landmarks.slice(0, 2);
        if (handsCountRef.current !== landmarks.length) {
          handsCountRef.current = landmarks.length;
          setHandsCount(landmarks.length);
        }
        const map = getCoverMapper(video, width, height);
        const compactLayout = width < 780;
        const dockLeft = width * (compactLayout ? 0.02 : 0.04);
        const dockWidth = width * (compactLayout ? 0.96 : 0.92);
        const cellWidth = dockWidth / NOTES.length;
        const circleCenterY = height * (compactLayout ? 0.89 : 0.87);
        const circleRadius = Math.min(cellWidth * (compactLayout ? 0.44 : 0.41), height * (compactLayout ? 0.065 : 0.09));
        const drumLeft = width * (compactLayout ? 0.09 : 0.2);
        const drumWidth = width * (compactLayout ? 0.82 : 0.6);
        const drumCellWidth = drumWidth / DRUMS.length;
        const drumCenterY = height * (compactLayout ? 0.12 : 0.13);
        const drumRadius = Math.min(drumCellWidth * 0.32, height * 0.065);

        landmarks.forEach((hand, handIndex) => {
          const handColor = handIndex === 0 ? "#65f4ff" : "#ff8ee8";
          context.strokeStyle = handColor;
          context.fillStyle = handColor;
          context.lineWidth = 2.2;
          context.shadowColor = handColor;
          context.shadowBlur = 10;
          HAND_CONNECTIONS.forEach(([from, to]) => {
            const a = map(hand[from]);
            const b = map(hand[to]);
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.stroke();
          });

          hand.forEach((point, pointIndex) => {
            const mapped = map(point);
            context.beginPath();
            context.arc(mapped.x, mapped.y, FINGER_TIPS.includes(pointIndex as typeof FINGER_TIPS[number]) ? 5.5 : 2.5, 0, Math.PI * 2);
            context.fill();
          });

          FINGER_TIPS.forEach((tipIndex) => {
            const mapped = map(hand[tipIndex]);
            if (mapped.x < 0 || mapped.x > width || mapped.y < 0 || mapped.y > height) return;
            const degree = Math.max(0, Math.min(6, Math.floor((mapped.x - dockLeft) / cellWidth)));
            const circleCenterX = dockLeft + cellWidth * (degree + 0.5);
            const insideCircle = mapped.x >= dockLeft && mapped.x <= dockLeft + dockWidth
              && Math.hypot(mapped.x - circleCenterX, mapped.y - circleCenterY) <= circleRadius * 1.16;
            const noteIndex = insideCircle ? degree : -1;
            const drumDegree = Math.max(0, Math.min(DRUMS.length - 1, Math.floor((mapped.x - drumLeft) / drumCellWidth)));
            const drumCenterX = drumLeft + drumCellWidth * (drumDegree + 0.5);
            const insideDrum = mapped.x >= drumLeft && mapped.x <= drumLeft + drumWidth
              && Math.hypot(mapped.x - drumCenterX, mapped.y - drumCenterY) <= drumRadius * 1.2;
            const drumIndex = insideDrum ? drumDegree : -1;
            const targetId = noteIndex >= 0 ? noteIndex : drumIndex >= 0 ? drumIndex + 100 : -1;
            const insideTarget = targetId >= 0;
            const id = `${handIndex}-${tipIndex}`;
            const previous = tipStatesRef.current.get(id);
            const lastStrike = lastStrikeRef.current.get(id) || 0;
            let armed = previous?.armed ?? !insideTarget;
            let anchorY = previous?.anchorY ?? mapped.y;
            let triggerY = previous?.triggerY ?? mapped.y;
            if (mapped.y < anchorY) anchorY = mapped.y;
            if (!insideTarget || (!armed && triggerY - mapped.y > height * 0.014)) {
              armed = true;
              anchorY = mapped.y;
            }
            const targetTop = noteIndex >= 0 ? circleCenterY - circleRadius : drumCenterY - drumRadius;
            const crossedTargetTop = insideTarget && previous ? previous.y <= targetTop && mapped.y > targetTop : false;
            const deliberateTap = insideTarget && mapped.y - anchorY > height * 0.013;
            if (targetId >= 0 && armed && now - lastStrike > 150 && (crossedTargetTop || deliberateTap)) {
              if (noteIndex >= 0) playNoteRef.current(noteIndex);
              else playDrumRef.current(drumIndex);
              lastStrikeRef.current.set(id, now);
              armed = false;
              triggerY = mapped.y;
              anchorY = mapped.y;
            }
            tipStatesRef.current.set(id, { y: mapped.y, time: now, armed, note: targetId, anchorY, triggerY });
          });
          context.shadowBlur = 0;
        });
      }
      animationRef.current = requestAnimationFrame(draw);
    };
    animationRef.current = requestAnimationFrame(draw);
    return () => {
      observer.disconnect();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const start = async () => {
    try {
      setErrorMessage("");
      setPhase("loading");
      await ensureAudio();
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("UNSUPPORTED");
      const modelPromise = landmarkerRef.current
        ? Promise.resolve(landmarkerRef.current)
        : import("@mediapipe/tasks-vision").then(async ({ FilesetResolver, HandLandmarker }) => {
            const files = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm");
            const landmarker = await HandLandmarker.createFromOptions(files, {
              baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
                delegate: "CPU",
              },
              runningMode: "VIDEO",
              numHands: 2,
              minHandDetectionConfidence: 0.52,
              minHandPresenceConfidence: 0.52,
              minTrackingConfidence: 0.48,
            });
            landmarkerRef.current = landmarker;
            return landmarker;
          });
      const cameraPromise = navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: false,
      });
      const [, stream] = await Promise.all([modelPromise, cameraPromise]);
      streamRef.current = stream;
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraVisible(true);
      setPhase("ready");
    } catch (error) {
      stopCamera();
      const name = error instanceof DOMException ? error.name : "";
      setErrorMessage(name === "NotAllowedError"
        ? "اجازه دوربین داده نشد. دسترسی دوربین را در تنظیمات مرورگر فعال کن."
        : name === "NotFoundError"
          ? "دوربینی روی این دستگاه پیدا نشد."
          : "دوربین یا سیستم تشخیص دست آماده نشد. صفحه را تازه کن و دوباره امتحان کن.");
      setPhase("error");
    }
  };

  const exit = () => {
    stopCamera();
    setLastSound("—");
    setPhase("idle");
  };

  return (
    <main className={styles.page} dir="rtl">
      <div className={styles.ambientOne} />
      <div className={styles.ambientTwo} />
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="بازگشت به سمیز">
          <b>S</b><span>SAMIZ <em>PLAY</em></span>
        </Link>
        <div className={styles.titleLockup}><small>AI CAMERA INSTRUMENT</small><strong>ویلن و درام هوایی</strong></div>
        {phase === "ready" && <button type="button" onClick={exit} className={styles.exitButton}>خروج ×</button>}
      </header>

      <section className={styles.shell}>
        <div className={styles.stage} ref={stageRef}>
          <video ref={videoRef} className={`${styles.video} ${cameraVisible ? styles.visible : ""}`} muted playsInline aria-label="تصویر زنده دوربین" />
          <div className={styles.cameraShade} />
          <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

          <div className={styles.drumGrid} aria-label="درام‌های هوایی">
            {DRUMS.map((drum, index) => (
              <button
                type="button"
                key={drum.kind}
                className={styles.drumPad}
                data-active={activeDrums.includes(index)}
                style={{ "--drum-color": drum.color } as React.CSSProperties}
                onPointerDown={() => playDrum(index)}
                aria-label={`درام ${drum.fa}`}
              >
                <span>{drum.fa}</span><b>{drum.latin}</b><kbd>{drum.key}</kbd>
              </button>
            ))}
          </div>

          <div className={styles.noteGrid} aria-label="هفت نت اصلی موسیقی با صدای ویلن">
            {NOTES.map((note, index) => (
              <button
                type="button"
                key={note.latin}
                className={styles.notePad}
                data-active={activeNotes.includes(index)}
                style={{ "--note-color": note.color } as React.CSSProperties}
                onPointerDown={() => playNote(index)}
                aria-label={`نت ${note.fa} با صدای ویلن`}
              >
                <span>{note.fa}</span><b>{note.latin}</b><kbd>{note.key}</kbd>
              </button>
            ))}
          </div>

          {phase === "idle" && (
            <div className={styles.intro}>
              <span className={styles.eyebrow}>چهار درام • هفت نت ویلن • دو دست</span>
              <h1>ریتم و ملودی را<br /><em>در هوا بنواز.</em></h1>
              <p>درام‌ها بالا و نت‌های ویلن پایین‌اند؛ هرکدام را با یک ضربه کوتاه انگشت اجرا کن.</p>
              <button type="button" className={styles.primaryButton} onClick={start}>فعال‌کردن دوربین و شروع <span>←</span></button>
              <small>درام: کلیدهای ۱ تا ۴ · ویلن: A S D F J K L</small>
            </div>
          )}

          {phase === "loading" && (
            <div className={styles.loadingPanel}><i /><h2>در حال کوک‌کردن ساز...</h2><p>اجازه دوربین را تأیید کن؛ بار اول ممکن است چند ثانیه طول بکشد.</p></div>
          )}

          {phase === "error" && (
            <div className={styles.errorPanel}><span>📷</span><h2>دوربین آماده نشد</h2><p>{errorMessage}</p><button type="button" className={styles.primaryButton} onClick={start}>تلاش دوباره</button></div>
          )}

          {phase === "ready" && (
            <div className={styles.hud}>
              <div><span className={handsCount > 0 ? styles.liveDot : styles.waitDot} />{handsCount === 0 ? "دست‌ها را جلوی دوربین بگیر" : `${handsCount} دست شناسایی شد`}</div>
              <div className={styles.nowPlaying}><small>آخرین صدا</small><strong>{lastSound}</strong></div>
              <p>بالا درام بزن؛ پایین نت‌های ویلن را اجرا کن</p>
            </div>
          )}
        </div>

        <div className={styles.instructions}>
          <div><b>۱</b><span><strong>هر دو دست را نشان بده</strong><small>کف دست‌ها رو به دوربین و در محدوده تصویر باشد.</small></span></div>
          <div><b>۲</b><span><strong>بالا یا پایین را انتخاب کن</strong><small>درام‌ها بالا و هفت نت دایره‌ای ویلن پایین تصویر هستند.</small></span></div>
          <div><b>۳</b><span><strong>یک ضربه رو به پایین بزن</strong><small>برای اجرای دوباره، انگشت را کمی بالا ببر و دوباره ضربه بزن.</small></span></div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>🔒 تصویر فقط روی دستگاه شما پردازش می‌شود و جایی ذخیره یا ارسال نمی‌شود.</span>
        <a href="https://instagram.com/hamedsamizadeh" target="_blank" rel="noreferrer">@hamedsamizadeh</a>
      </footer>
    </main>
  );
}
