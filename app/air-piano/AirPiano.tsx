"use client";

import type { HandLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./air-piano.module.css";

type Phase = "idle" | "loading" | "ready" | "error";
type TipState = { y: number; time: number; armed: boolean; note: number; anchorY: number; triggerY: number };

const NOTES = [
  { fa: "دو", latin: "C", octave: 4, degree: 0, key: "A", frequency: 261.63, color: "#ff6b7a" },
  { fa: "رِ", latin: "D", octave: 4, degree: 1, key: "S", frequency: 293.66, color: "#ffad5a" },
  { fa: "می", latin: "E", octave: 4, degree: 2, key: "D", frequency: 329.63, color: "#ffe36a" },
  { fa: "فا", latin: "F", octave: 4, degree: 3, key: "F", frequency: 349.23, color: "#69e39c" },
  { fa: "سُل", latin: "G", octave: 4, degree: 4, key: "J", frequency: 392, color: "#54d9f5" },
  { fa: "لا", latin: "A", octave: 4, degree: 5, key: "K", frequency: 440, color: "#8f8bff" },
  { fa: "سی", latin: "B", octave: 4, degree: 6, key: "L", frequency: 493.88, color: "#e782ff" },
  { fa: "دو", latin: "C", octave: 5, degree: 0, key: "Q", frequency: 523.25, color: "#ff6b7a" },
  { fa: "رِ", latin: "D", octave: 5, degree: 1, key: "W", frequency: 587.33, color: "#ffad5a" },
  { fa: "می", latin: "E", octave: 5, degree: 2, key: "E", frequency: 659.25, color: "#ffe36a" },
  { fa: "فا", latin: "F", octave: 5, degree: 3, key: "R", frequency: 698.46, color: "#69e39c" },
  { fa: "سُل", latin: "G", octave: 5, degree: 4, key: "U", frequency: 783.99, color: "#54d9f5" },
  { fa: "لا", latin: "A", octave: 5, degree: 5, key: "I", frequency: 880, color: "#8f8bff" },
  { fa: "سی", latin: "B", octave: 5, degree: 6, key: "O", frequency: 987.77, color: "#e782ff" },
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
  const handsCountRef = useRef(0);
  const playNoteRef = useRef<(index: number) => void>(() => undefined);

  const [phase, setPhase] = useState<Phase>("idle");
  const [cameraVisible, setCameraVisible] = useState(false);
  const [handsCount, setHandsCount] = useState(0);
  const [lastNote, setLastNote] = useState<number | null>(null);
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
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
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.32, now + 0.012);
      master.gain.exponentialRampToValueAtTime(0.11, now + 0.2);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(3100, now);
      filter.frequency.exponentialRampToValueAtTime(900, now + 0.9);
      filter.Q.value = 0.7;
      filter.connect(master);
      master.connect(audio.destination);

      [
        { multiple: 1, gain: 0.72, type: "triangle" as OscillatorType },
        { multiple: 2, gain: 0.2, type: "sine" as OscillatorType },
        { multiple: 3, gain: 0.08, type: "sine" as OscillatorType },
      ].forEach(({ multiple, gain, type }) => {
        const oscillator = audio.createOscillator();
        const partial = audio.createGain();
        oscillator.type = type;
        oscillator.frequency.value = note.frequency * multiple;
        partial.gain.value = gain;
        oscillator.connect(partial);
        partial.connect(filter);
        oscillator.start(now);
        oscillator.stop(now + 1.08);
      });
    }).catch(() => undefined);
    setLastNote(index);
    flashNote(index);
    if (navigator.vibrate) navigator.vibrate(12);
  }, [ensureAudio, flashNote]);

  useEffect(() => {
    playNoteRef.current = playNote;
  }, [playNote]);

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
    void audioRef.current?.close();
  }, [stopCamera]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const index = NOTES.findIndex((note) => note.key.toLowerCase() === event.key.toLowerCase());
      if (index >= 0) playNoteRef.current(index);
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
        const keyTop = height * 0.64;
        const rowBoundary = keyTop + (height - keyTop) / 2;

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
            const degree = Math.max(0, Math.min(6, Math.floor(mapped.x / width * 7)));
            const noteIndex = mapped.y < rowBoundary ? degree + 7 : degree;
            const id = `${handIndex}-${tipIndex}`;
            const previous = tipStatesRef.current.get(id);
            const lastStrike = lastStrikeRef.current.get(id) || 0;
            let armed = previous?.armed ?? mapped.y < keyTop;
            let anchorY = previous?.anchorY ?? mapped.y;
            let triggerY = previous?.triggerY ?? mapped.y;
            if (mapped.y < anchorY) anchorY = mapped.y;
            if (mapped.y < keyTop || (!armed && triggerY - mapped.y > height * 0.014)) {
              armed = true;
              anchorY = mapped.y;
            }
            const crossedLine = previous ? previous.y <= keyTop && mapped.y > keyTop : false;
            const deliberateTap = mapped.y > keyTop && mapped.y - anchorY > height * 0.014;
            if (armed && now - lastStrike > 145 && (crossedLine || deliberateTap)) {
              playNoteRef.current(noteIndex);
              lastStrikeRef.current.set(id, now);
              armed = false;
              triggerY = mapped.y;
              anchorY = mapped.y;
            }
            tipStatesRef.current.set(id, { y: mapped.y, time: now, armed, note: noteIndex, anchorY, triggerY });
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
    setLastNote(null);
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
        <div className={styles.titleLockup}><small>AI CAMERA INSTRUMENT</small><strong>پیانوی هوایی</strong></div>
        {phase === "ready" && <button type="button" onClick={exit} className={styles.exitButton}>خروج ×</button>}
      </header>

      <section className={styles.shell}>
        <div className={styles.stage} ref={stageRef}>
          <video ref={videoRef} className={`${styles.video} ${cameraVisible ? styles.visible : ""}`} muted playsInline aria-label="تصویر زنده دوربین" />
          <div className={styles.cameraShade} />
          <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

          <div className={styles.noteGrid} aria-label="دو دنگ و چهارده نت اصلی موسیقی">
            {NOTES.map((note, index) => (
              <button
                type="button"
                key={note.latin}
                className={styles.notePad}
                data-active={activeNotes.includes(index)}
                style={{
                  "--note-color": note.color,
                  gridColumn: note.degree + 1,
                  gridRow: note.octave === 5 ? 1 : 2,
                } as React.CSSProperties}
                onPointerDown={() => playNote(index)}
                aria-label={`نت ${note.fa} دنگ ${note.octave === 5 ? "دوم" : "اول"}`}
              >
                <span>{note.fa}</span><b>{note.latin}{note.octave}</b><kbd>{note.key}</kbd>
              </button>
            ))}
          </div>

          {phase === "idle" && (
            <div className={styles.intro}>
              <span className={styles.eyebrow}>دو دست • ده انگشت • دو دُنگ کامل</span>
              <h1>موسیقی را<br /><em>در هوا لمس کن.</em></h1>
              <p>دست‌هایت را جلوی دوربین بگیر و هر انگشت را روی یکی از نت‌ها رو به پایین حرکت بده.</p>
              <button type="button" className={styles.primaryButton} onClick={start}>فعال‌کردن دوربین و شروع <span>←</span></button>
              <small>دُنگ پایین: A S D F J K L · دُنگ بالا: Q W E R U I O</small>
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
              <div className={styles.nowPlaying}><small>آخرین نت</small><strong>{lastNote === null ? "—" : `${NOTES[lastNote].fa} · ${NOTES[lastNote].latin}${NOTES[lastNote].octave}`}</strong></div>
              <p>ردیف بالا دُنگ دوم است؛ ردیف پایین دُنگ اول</p>
            </div>
          )}
        </div>

        <div className={styles.instructions}>
          <div><b>۱</b><span><strong>هر دو دست را نشان بده</strong><small>کف دست‌ها رو به دوربین و در محدوده تصویر باشد.</small></span></div>
          <div><b>۲</b><span><strong>دُنگ را انتخاب کن</strong><small>ردیف بالا صدای زیرتر و ردیف پایین صدای بم‌تر دارد.</small></span></div>
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
