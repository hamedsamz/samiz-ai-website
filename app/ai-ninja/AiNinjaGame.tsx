"use client";

import type { HandLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "loading" | "countdown" | "playing" | "result" | "error";
type TargetKind = "fruit" | "bomb" | "bonus";

type Point = { x: number; y: number; at: number };
type Target = {
  id: number;
  kind: TargetKind;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  spin: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
};

const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15],
  [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

const FRUITS = ["🍉", "🍊", "🥝", "🍓", "🍍", "🍎"];
const GAME_SECONDS = 30;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function distanceToSegment(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

function resultTitle(score: number) {
  if (score >= 55) return { title: "استاد افسانه‌ای نینجا", icon: "⚡" };
  if (score >= 38) return { title: "نینجای سایبری", icon: "🥷" };
  if (score >= 24) return { title: "شمشیرزن سریع", icon: "🗡️" };
  return { title: "شاگرد نینجا", icon: "🔥" };
}

export default function AiNinjaGame() {
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const targetsRef = useRef<Target[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const trailRef = useRef<Point[]>([]);
  const landmarksRef = useRef<NormalizedLandmark[] | null>(null);
  const pointerRef = useRef<Point | null>(null);
  const previousPointerRef = useRef<Point | null>(null);
  const lastFrameRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const lastSpawnRef = useRef(0);
  const endTimeRef = useRef(0);
  const nextTargetIdRef = useRef(1);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const flashRef = useRef(0);
  const demoModeRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [countdown, setCountdown] = useState(3);
  const [bestScore, setBestScore] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [handVisible, setHandVisible] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [shareStatus, setShareStatus] = useState("");

  const changePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("samiz-ai-ninja-best");
    const isDemo = new URLSearchParams(window.location.search).get("demo") === "1";
    demoModeRef.current = isDemo;
    const updateId = window.setTimeout(() => {
      if (saved) setBestScore(Number(saved));
      setDemoMode(isDemo);
    }, 0);
    return () => window.clearTimeout(updateId);
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraVisible(false);
  }, []);

  const finishGame = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    const finalScore = scoreRef.current;
    const previousBest = Number(window.localStorage.getItem("samiz-ai-ninja-best") || 0);
    if (finalScore > previousBest) {
      window.localStorage.setItem("samiz-ai-ninja-best", String(finalScore));
      setBestScore(finalScore);
    }
    if (navigator.vibrate) navigator.vibrate([45, 40, 90]);
    setMaxCombo(maxComboRef.current);
    changePhase("result");
  }, [changePhase]);

  const spawnTarget = useCallback((width: number, height: number) => {
    const bombChance = Math.random();
    const kind: TargetKind = bombChance < 0.19 ? "bomb" : bombChance > 0.92 ? "bonus" : "fruit";
    const radius = Math.max(28, Math.min(47, width * 0.043));
    const fromLeft = Math.random() < 0.5;
    const x = width * (0.18 + Math.random() * 0.64);
    const y = height + radius * 1.4;
    const arcHeight = height * (0.66 + Math.random() * 0.19);
    targetsRef.current.push({
      id: nextTargetIdRef.current++,
      kind,
      emoji: kind === "bomb" ? "💣" : kind === "bonus" ? "⭐" : FRUITS[Math.floor(Math.random() * FRUITS.length)],
      x,
      y,
      vx: (fromLeft ? 1 : -1) * (25 + Math.random() * 75),
      vy: -Math.sqrt(2 * 760 * arcHeight),
      radius,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 3.4,
    });
  }, []);

  const burst = useCallback((target: Target) => {
    const color = target.kind === "bomb" ? "#ff335f" : target.kind === "bonus" ? "#ffe04b" : "#cfff2e";
    for (let index = 0; index < 16; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 260;
      particlesRef.current.push({
        x: target.x, y: target.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 0.45 + Math.random() * 0.4, color, size: 2 + Math.random() * 5,
      });
    }
  }, []);

  const hitTarget = useCallback((target: Target) => {
    burst(target);
    if (target.kind === "bomb") {
      livesRef.current -= 1;
      comboRef.current = 0;
      flashRef.current = performance.now() + 230;
      setLives(livesRef.current);
      setCombo(0);
      if (navigator.vibrate) navigator.vibrate(80);
      if (livesRef.current <= 0) finishGame();
      return;
    }
    const nextCombo = comboRef.current + 1;
    comboRef.current = nextCombo;
    maxComboRef.current = Math.max(maxComboRef.current, nextCombo);
    const comboBonus = nextCombo >= 12 ? 3 : nextCombo >= 6 ? 2 : 1;
    scoreRef.current += target.kind === "bonus" ? 5 : comboBonus;
    setScore(scoreRef.current);
    setCombo(nextCombo);
    if (navigator.vibrate) navigator.vibrate(14);
  }, [burst, finishGame]);

  const mapLandmark = useCallback((landmark: NormalizedLandmark, width: number, height: number) => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) return { x: (1 - landmark.x) * width, y: landmark.y * height };
    const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
    const renderedWidth = video.videoWidth * scale;
    const renderedHeight = video.videoHeight * scale;
    return {
      x: (width - renderedWidth) / 2 + (1 - landmark.x) * renderedWidth,
      y: (height - renderedHeight) / 2 + landmark.y * renderedHeight,
    };
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

    const moveDemoPointer = (event: PointerEvent) => {
      if (!demoModeRef.current || phaseRef.current !== "playing") return;
      const rect = canvas.getBoundingClientRect();
      pointerRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top, at: performance.now() };
    };
    canvas.addEventListener("pointermove", moveDemoPointer);

    const draw = (now: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const context = canvas.getContext("2d");
      if (!context) return;
      const dt = Math.min(0.034, Math.max(0.001, (now - lastFrameRef.current) / 1000));
      lastFrameRef.current = now;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!demoModeRef.current && landmarker && video && video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        const result = landmarker.detectForVideo(video, now);
        landmarksRef.current = result.landmarks[0] || null;
        if (landmarksRef.current) {
          const tip = mapLandmark(landmarksRef.current[8], width, height);
          pointerRef.current = { ...tip, at: now };
        } else {
          pointerRef.current = null;
        }
      }

      const pointer = pointerRef.current;
      if (pointer) {
        trailRef.current.push(pointer);
        trailRef.current = trailRef.current.filter((item) => now - item.at < 260).slice(-16);
      } else {
        trailRef.current = trailRef.current.filter((item) => now - item.at < 180);
      }

      if (phaseRef.current === "playing") {
        const remaining = Math.max(0, (endTimeRef.current - now) / 1000);
        setTimeLeft((previous) => Math.abs(previous - remaining) > 0.08 ? remaining : previous);
        if (remaining <= 0) finishGame();

        const spawnGap = Math.max(380, 720 - scoreRef.current * 4);
        if (now - lastSpawnRef.current > spawnGap && targetsRef.current.length < 8) {
          spawnTarget(width, height);
          lastSpawnRef.current = now;
        }

        const previousPointer = previousPointerRef.current;
        const swipeSpeed = pointer && previousPointer
          ? Math.hypot(pointer.x - previousPointer.x, pointer.y - previousPointer.y) / Math.max(0.008, (pointer.at - previousPointer.at) / 1000)
          : 0;

        targetsRef.current.forEach((target) => {
          target.vy += 760 * dt;
          target.x += target.vx * dt;
          target.y += target.vy * dt;
          target.rotation += target.spin * dt;
        });

        const hitIds = new Set<number>();
        if (pointer && previousPointer && swipeSpeed > 220) {
          targetsRef.current.forEach((target) => {
            if (distanceToSegment({ x: target.x, y: target.y, at: now }, previousPointer, pointer) < target.radius + 12) {
              hitIds.add(target.id);
              hitTarget(target);
            }
          });
        }
        targetsRef.current = targetsRef.current.filter((target) => !hitIds.has(target.id) && target.y < height + target.radius * 2.5);
        previousPointerRef.current = pointer;
      }

      particlesRef.current.forEach((particle) => {
        particle.life -= dt;
        particle.vy += 480 * dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
      });
      particlesRef.current = particlesRef.current.filter((particle) => particle.life > 0);

      targetsRef.current.forEach((target) => {
        context.save();
        context.translate(target.x, target.y);
        context.rotate(target.rotation);
        context.shadowColor = target.kind === "bomb" ? "rgba(255,40,80,.72)" : "rgba(207,255,46,.52)";
        context.shadowBlur = 22;
        context.font = `${target.radius * 1.55}px Apple Color Emoji, Segoe UI Emoji, sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(target.emoji, 0, 2);
        context.restore();
      });

      particlesRef.current.forEach((particle) => {
        context.globalAlpha = Math.max(0, particle.life * 1.8);
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      });
      context.globalAlpha = 1;

      const landmarks = landmarksRef.current;
      if (landmarks && !demoModeRef.current) {
        context.lineWidth = 2;
        context.strokeStyle = "rgba(207,255,46,.48)";
        context.shadowColor = "#cfff2e";
        context.shadowBlur = 9;
        HAND_CONNECTIONS.forEach(([from, to]) => {
          const start = mapLandmark(landmarks[from], width, height);
          const end = mapLandmark(landmarks[to], width, height);
          context.beginPath(); context.moveTo(start.x, start.y); context.lineTo(end.x, end.y); context.stroke();
        });
        context.shadowBlur = 0;
      }

      const trail = trailRef.current;
      if (trail.length > 1) {
        context.lineCap = "round";
        context.lineJoin = "round";
        for (let index = 1; index < trail.length; index += 1) {
          const alpha = index / trail.length;
          context.strokeStyle = `rgba(207,255,46,${alpha * 0.92})`;
          context.lineWidth = 2 + alpha * 9;
          context.shadowColor = "#cfff2e";
          context.shadowBlur = 12;
          context.beginPath();
          context.moveTo(trail[index - 1].x, trail[index - 1].y);
          context.lineTo(trail[index].x, trail[index].y);
          context.stroke();
        }
        context.shadowBlur = 0;
      }
      if (pointer) {
        context.strokeStyle = "#ffffff";
        context.lineWidth = 2;
        context.beginPath(); context.arc(pointer.x, pointer.y, 13, 0, Math.PI * 2); context.stroke();
        context.fillStyle = "#cfff2e";
        context.beginPath(); context.arc(pointer.x, pointer.y, 4, 0, Math.PI * 2); context.fill();
      }
      if (now < flashRef.current) {
        context.fillStyle = "rgba(255,20,65,.23)";
        context.fillRect(0, 0, width, height);
      }

      const visible = Boolean(pointerRef.current);
      setHandVisible((previous) => previous === visible ? previous : visible);
      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);
    return () => {
      observer.disconnect();
      canvas.removeEventListener("pointermove", moveDemoPointer);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [finishGame, hitTarget, mapLandmark, spawnTarget]);

  useEffect(() => () => {
    stopCamera();
    landmarkerRef.current?.close();
  }, [stopCamera]);

  const prepareCameraAndModel = async () => {
    if (demoModeRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("UNSUPPORTED");

    const modelPromise = landmarkerRef.current
      ? Promise.resolve(landmarkerRef.current)
      : import("@mediapipe/tasks-vision").then(async ({ FilesetResolver, HandLandmarker }) => {
          const files = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm",
          );
          const landmarker = await HandLandmarker.createFromOptions(files, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numHands: 1,
            minHandDetectionConfidence: 0.55,
            minHandPresenceConfidence: 0.55,
            minTrackingConfidence: 0.5,
          });
          landmarkerRef.current = landmarker;
          return landmarker;
        });

    const activeStream = streamRef.current;
    const cameraPromise = activeStream?.getVideoTracks().some((track) => track.readyState === "live")
      ? Promise.resolve(activeStream)
      : navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 60 },
          },
          audio: false,
        });
    const [, stream] = await Promise.all([modelPromise, cameraPromise]);
    streamRef.current = stream;
    setCameraVisible(true);
    if (!videoRef.current) return;
    videoRef.current.srcObject = stream;
    await videoRef.current.play();
  };

  const startGame = async () => {
    try {
      setErrorMessage("");
      setShareStatus("");
      changePhase("loading");
      await prepareCameraAndModel();
      scoreRef.current = 0;
      livesRef.current = 3;
      comboRef.current = 0;
      maxComboRef.current = 0;
      targetsRef.current = [];
      particlesRef.current = [];
      trailRef.current = [];
      previousPointerRef.current = null;
      setScore(0); setLives(3); setCombo(0); setTimeLeft(GAME_SECONDS);
      setMaxCombo(0);
      changePhase("countdown");
      for (let value = 3; value >= 1; value -= 1) {
        setCountdown(value);
        await sleep(680);
      }
      endTimeRef.current = performance.now() + GAME_SECONDS * 1000;
      lastFrameRef.current = performance.now();
      lastSpawnRef.current = 0;
      changePhase("playing");
    } catch (error) {
      stopCamera();
      const name = error instanceof DOMException ? error.name : "";
      setErrorMessage(name === "NotAllowedError"
        ? "دسترسی دوربین داده نشد. از تنظیمات مرورگر اجازه دوربین را فعال کن و دوباره بزن."
        : name === "NotFoundError"
          ? "دوربینی روی این دستگاه پیدا نشد."
          : "راه‌اندازی دوربین یا تشخیص دست انجام نشد. صفحه را تازه کن و دوباره امتحان کن.");
      changePhase("error");
    }
  };

  const exitGame = () => {
    stopCamera();
    targetsRef.current = [];
    particlesRef.current = [];
    landmarksRef.current = null;
    pointerRef.current = null;
    changePhase("idle");
  };

  const shareResult = async () => {
    const title = resultTitle(score);
    const text = `من توی AI Ninja امتیاز ${score} گرفتم و شدم «${title.title}»! 🥷\nتو می‌تونی رکوردمو بزنی؟`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "AI Ninja", text, url: window.location.href.split("?")[0] });
        setShareStatus("نتیجه به اشتراک گذاشته شد");
      } else {
        await navigator.clipboard.writeText(`${text}\n${window.location.href.split("?")[0]}`);
        setShareStatus("متن و لینک بازی کپی شد");
      }
    } catch {
      setShareStatus("");
    }
  };

  const finalRank = resultTitle(score);

  return (
    <main className="ninja-page" dir="rtl">
      <div className="ninja-stage" ref={stageRef}>
        <video ref={videoRef} className={`ninja-video ${cameraVisible || demoMode ? "is-visible" : ""}`} muted playsInline aria-label="تصویر زنده دوربین بازی" />
        <div className="ninja-shade" />
        <canvas ref={canvasRef} className="ninja-canvas" aria-hidden="true" />

        <header className="ninja-header">
          <Link className="ninja-brand" href="/" aria-label="بازگشت به سمیز">
            <span className="ninja-brand-mark">S</span><span>SAMIZ <b>PLAY</b></span>
          </Link>
          {(phase === "playing" || phase === "countdown" || phase === "result") && (
            <button className="camera-off" onClick={exitGame} aria-label="خاموش کردن دوربین و خروج">خروج ×</button>
          )}
        </header>

        {phase === "playing" && (
          <div className="ninja-hud">
            <div className="hud-card score-card"><span>امتیاز</span><strong>{score}</strong></div>
            <div className="timer-card"><span>زمان</span><strong>{Math.ceil(timeLeft)}</strong><i style={{ "--progress": `${Math.max(0, timeLeft / GAME_SECONDS) * 100}%` } as React.CSSProperties} /></div>
            <div className="hud-card life-card"><span>جان</span><strong>{Array.from({ length: 3 }, (_, index) => <b key={index} className={index >= lives ? "lost" : ""}>♥</b>)}</strong></div>
          </div>
        )}

        {phase === "playing" && (
          <div className={`hand-status ${handVisible ? "found" : ""}`}>
            <span />{demoMode ? "حالت آزمایشی" : handVisible ? "دست شناسایی شد" : "دستت را جلوی دوربین بگیر"}
          </div>
        )}

        {phase === "playing" && combo >= 3 && <div className="combo-pop" key={combo}>COMBO ×{combo}</div>}

        {phase === "idle" && (
          <section className="ninja-panel intro-panel">
            <div className="ninja-kicker"><span /> بازی حرکتی با هوش مصنوعی</div>
            <div className="ninja-emblem"><span className="blade blade-one" /><span className="blade blade-two" /><div>🥷</div></div>
            <h1><small>انگشتت شمشیره!</small>AI <em>NINJA</em></h1>
            <p>با حرکت انگشت میوه‌ها رو بزن، ستاره‌ها رو بگیر و حواست به بمب‌ها باشه.</p>
            <button className="ninja-primary" onClick={startGame}>فعال‌کردن دوربین و شروع <span>←</span></button>
            <div className="privacy-note"><span>●</span> تصویر دوربین فقط داخل مرورگر پردازش می‌شود و جایی ذخیره یا ارسال نمی‌شود.</div>
            {bestScore > 0 && <div className="best-score">بهترین رکورد تو <strong>{bestScore}</strong></div>}
          </section>
        )}

        {phase === "loading" && (
          <section className="ninja-panel loading-panel">
            <div className="loader-ring"><span /></div>
            <h2>نینجا داره آماده می‌شه...</h2>
            <p>اجازه دوربین را تأیید کن؛ اولین بار ممکنه چند ثانیه طول بکشه.</p>
          </section>
        )}

        {phase === "countdown" && (
          <section className="ninja-panel countdown-panel">
            <span>دستت رو آماده کن</span><strong key={countdown}>{countdown}</strong><p>با نوک انگشت اشاره بُرش بزن!</p>
          </section>
        )}

        {phase === "result" && (
          <section className="ninja-panel result-panel">
            <div className="result-icon">{finalRank.icon}</div>
            <span className="result-label">ماموریت تمام شد</span>
            <h2>{finalRank.title}</h2>
            <div className="final-score"><strong>{score}</strong><span>امتیاز</span></div>
            <div className="result-grid">
              <div><span>بیشترین کمبو</span><strong>×{maxCombo}</strong></div>
              <div><span>بهترین رکورد</span><strong>{Math.max(bestScore, score)}</strong></div>
            </div>
            <button className="ninja-primary" onClick={shareResult}>به چالش کشیدن دوستام <span>↗</span></button>
            <button className="ninja-secondary" onClick={startGame}>دوباره بازی می‌کنم</button>
            {shareStatus && <div className="share-note" role="status">{shareStatus}</div>}
          </section>
        )}

        {phase === "error" && (
          <section className="ninja-panel error-panel">
            <div className="error-icon">📷</div><h2>دوربین آماده نشد</h2><p>{errorMessage}</p>
            <button className="ninja-primary" onClick={startGame}>تلاش دوباره</button>
            <button className="ninja-secondary" onClick={exitGame}>بازگشت</button>
          </section>
        )}

        <footer className="ninja-footer">ساخته‌شده با هوش مصنوعی توسط <a href="https://instagram.com/hamedsamizadeh" target="_blank" rel="noreferrer">@hamedsamizadeh</a></footer>
      </div>
    </main>
  );
}
