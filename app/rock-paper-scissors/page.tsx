"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GestureRecognizer, NormalizedLandmark } from "@mediapipe/tasks-vision";
import styles from "./game.module.css";

type Move = "rock" | "paper" | "scissors";
type RoundResult = "win" | "lose" | "draw" | null;
type CameraStatus = "off" | "loading" | "ready" | "error";

const MOVES: Record<Move, { emoji: string; fa: string; en: string }> = {
  rock: { emoji: "✊", fa: "سنگ", en: "Rock" },
  paper: { emoji: "✋", fa: "کاغذ", en: "Paper" },
  scissors: { emoji: "✌️", fa: "قیچی", en: "Scissors" },
};

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
] as const;

const GESTURE_MAP: Record<string, Move | undefined> = {
  Closed_Fist: "rock",
  Open_Palm: "paper",
  Victory: "scissors",
};

function decide(player: Move, computer: Move): Exclude<RoundResult, null> {
  if (player === computer) return "draw";
  if (
    (player === "rock" && computer === "scissors") ||
    (player === "paper" && computer === "rock") ||
    (player === "scissors" && computer === "paper")
  ) return "win";
  return "lose";
}

function randomMove(): Move {
  return (["rock", "paper", "scissors"] as Move[])[Math.floor(Math.random() * 3)];
}

export default function RockPaperScissors() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const lastInferenceRef = useRef(0);
  const lastGestureSeenRef = useRef(0);
  const stableMoveRef = useRef<Move | null>(null);
  const gestureHistoryRef = useRef<Move[]>([]);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("off");
  const [cameraError, setCameraError] = useState("");
  const [detectedMove, setDetectedMove] = useState<Move | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCounting, setIsCounting] = useState(false);
  const [playerMove, setPlayerMove] = useState<Move | null>(null);
  const [computerMove, setComputerMove] = useState<Move | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult>(null);
  const [score, setScore] = useState({ player: 0, computer: 0, draws: 0 });

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const drawLandmarks = useCallback((landmarks?: NormalizedLandmark[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !video || !context) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.clearRect(0, 0, width, height);
    if (!landmarks) return;

    context.lineWidth = Math.max(3, width / 260);
    context.lineCap = "round";
    context.strokeStyle = "rgba(118, 255, 209, .82)";
    for (const [start, end] of CONNECTIONS) {
      const a = landmarks[start];
      const b = landmarks[end];
      context.beginPath();
      context.moveTo(a.x * width, a.y * height);
      context.lineTo(b.x * width, b.y * height);
      context.stroke();
    }

    context.fillStyle = "#fff6bd";
    for (const point of landmarks) {
      context.beginPath();
      context.arc(point.x * width, point.y * height, Math.max(4, width / 185), 0, Math.PI * 2);
      context.fill();
    }
  }, []);

  const recognizeFrame = useCallback(() => {
    const video = videoRef.current;
    const recognizer = recognizerRef.current;
    if (!video || !recognizer || video.readyState < 2) {
      frameRef.current = requestAnimationFrame(recognizeFrame);
      return;
    }

    const now = performance.now();
    if (video.currentTime !== lastVideoTimeRef.current && now - lastInferenceRef.current > 75) {
      lastVideoTimeRef.current = video.currentTime;
      lastInferenceRef.current = now;
      try {
        const result = recognizer.recognizeForVideo(video, now);
        const category = result.gestures[0]?.[0];
        const move = category?.score >= 0.55 ? GESTURE_MAP[category.categoryName] ?? null : null;
        const history = gestureHistoryRef.current;

        if (move) {
          history.push(move);
          if (history.length > 5) history.shift();
          const recent = history.slice(-3);
          if (recent.length === 3 && recent.every((item) => item === move)) {
            stableMoveRef.current = move;
            lastGestureSeenRef.current = now;
            setDetectedMove(move);
            setConfidence(Math.round(category.score * 100));
          }
        } else {
          history.length = 0;
          if (now - lastGestureSeenRef.current > 450) {
            stableMoveRef.current = null;
            setDetectedMove(null);
            setConfidence(0);
          }
        }
        drawLandmarks(result.landmarks[0]);
      } catch {
        // A transient frame error should not stop the camera loop.
      }
    }
    frameRef.current = requestAnimationFrame(recognizeFrame);
  }, [drawLandmarks]);

  const stopCamera = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recognizerRef.current?.close();
    recognizerRef.current = null;
    stableMoveRef.current = null;
    gestureHistoryRef.current = [];
    if (videoRef.current) videoRef.current.srcObject = null;
    clearCanvas();
  }, [clearCanvas]);

  const startCamera = useCallback(async () => {
    if (cameraStatus === "loading" || cameraStatus === "ready") return;
    setCameraStatus("loading");
    setCameraError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("مرورگر شما دسترسی به دوربین را پشتیبانی نمی‌کند.");
      }

      const [{ FilesetResolver, GestureRecognizer: Recognizer }, stream] = await Promise.all([
        import("@mediapipe/tasks-vision"),
        navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        }),
      ]);

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm",
      );

      const options = {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task",
          delegate: "GPU" as const,
        },
        runningMode: "VIDEO" as const,
        numHands: 1,
        minHandDetectionConfidence: 0.55,
        minHandPresenceConfidence: 0.55,
        minTrackingConfidence: 0.55,
      };

      try {
        recognizerRef.current = await Recognizer.createFromOptions(vision, options);
      } catch {
        recognizerRef.current = await Recognizer.createFromOptions(vision, {
          ...options,
          baseOptions: { ...options.baseOptions, delegate: "CPU" },
        });
      }

      if (!mountedRef.current) {
        recognizerRef.current?.close();
        recognizerRef.current = null;
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      setCameraStatus("ready");
      frameRef.current = requestAnimationFrame(recognizeFrame);
    } catch (error) {
      stopCamera();
      setCameraStatus("error");
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setCameraError("اجازه دوربین داده نشد. از تنظیمات مرورگر، دسترسی Camera را برای این سایت فعال کن.");
      } else if (name === "NotFoundError") {
        setCameraError("هیچ دوربینی روی این دستگاه پیدا نشد.");
      } else {
        setCameraError(error instanceof Error ? error.message : "راه‌اندازی دوربین یا مدل تشخیص دست انجام نشد. دوباره تلاش کن.");
      }
    }
  }, [cameraStatus, recognizeFrame, stopCamera]);

  const finishRound = useCallback(() => {
    const selected = stableMoveRef.current;
    setIsCounting(false);
    setCountdown(null);
    if (!selected) {
      setPlayerMove(null);
      setComputerMove(null);
      setRoundResult(null);
      return;
    }

    const computer = randomMove();
    const result = decide(selected, computer);
    setPlayerMove(selected);
    setComputerMove(computer);
    setRoundResult(result);
    setScore((current) => ({
      player: current.player + (result === "win" ? 1 : 0),
      computer: current.computer + (result === "lose" ? 1 : 0),
      draws: current.draws + (result === "draw" ? 1 : 0),
    }));
  }, []);

  const startRound = useCallback(() => {
    if (cameraStatus !== "ready" || isCounting) return;
    setPlayerMove(null);
    setComputerMove(null);
    setRoundResult(null);
    setCountdown(3);
    setIsCounting(true);

    let next = 3;
    countdownTimerRef.current = setInterval(() => {
      next -= 1;
      if (next > 0) setCountdown(next);
      else {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        finishRound();
      }
    }, 820);
  }, [cameraStatus, finishRound, isCounting]);

  const resetScore = () => {
    setScore({ player: 0, computer: 0, draws: 0 });
    setPlayerMove(null);
    setComputerMove(null);
    setRoundResult(null);
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      stopCamera();
    };
  }, [stopCamera]);

  const resultCopy = roundResult === "win"
    ? { title: "بردی!", detail: "حرکتت از انتخاب کامپیوتر قوی‌تر بود 🎉" }
    : roundResult === "lose"
      ? { title: "این راند با کامپیوتر!", detail: "دوباره امتحان کن؛ راند بعدی مال توئه." }
      : roundResult === "draw"
        ? { title: "مساوی!", detail: "هر دو یک حرکت را انتخاب کردید." }
        : null;

  return (
    <main className={styles.page} dir="rtl">
      <div className={styles.ambientOne} aria-hidden="true" />
      <div className={styles.ambientTwo} aria-hidden="true" />

      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="بازگشت به SAMIZ AI">
          <span className={styles.logo}>S<span>AI</span></span>
          <span><strong>SAMIZ AI</strong><small>PLAYGROUND</small></span>
        </a>
        <a className={styles.backLink} href="/">بازگشت به سایت <span>←</span></a>
      </header>

      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}><span /> بازی با هوش مصنوعی</p>
          <h1>سنگ، کاغذ، قیچی<br /><em>با حرکت دست تو</em></h1>
          <p className={styles.lead}>دوربین را روشن کن، حرکتت را جلوی تصویر بگیر و قبل از تمام‌شدن شمارش، سنگ، کاغذ یا قیچی را نشان بده.</p>
        </div>
        <div className={styles.moveLegend} aria-label="حرکت‌های بازی">
          {(Object.keys(MOVES) as Move[]).map((move) => (
            <div key={move}><span>{MOVES[move].emoji}</span><b>{MOVES[move].fa}</b><small>{MOVES[move].en}</small></div>
          ))}
        </div>
      </section>

      <section className={styles.gameGrid}>
        <div className={styles.cameraCard}>
          <div className={styles.cameraTopbar}>
            <div className={styles.liveState} data-active={cameraStatus === "ready"}><i />{cameraStatus === "ready" ? "دوربین فعال" : "دوربین خاموش"}</div>
            <div className={styles.aiBadge}>AI HAND TRACKING</div>
          </div>

          <div className={styles.videoStage}>
            <video ref={videoRef} className={styles.video} playsInline muted aria-label="تصویر زنده دوربین" />
            <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

            {cameraStatus !== "ready" && (
              <div className={styles.cameraEmpty}>
                <div className={styles.cameraIcon}><span /><i /></div>
                <h2>{cameraStatus === "loading" ? "در حال آماده‌سازی هوش مصنوعی..." : "اول دوربین را فعال کن"}</h2>
                <p>{cameraStatus === "loading" ? "ممکن است بار اول چند ثانیه طول بکشد." : "تصویر فقط در همین مرورگر پردازش می‌شود."}</p>
                {cameraStatus !== "loading" && <button type="button" onClick={startCamera}>فعال کردن دوربین <span>◉</span></button>}
              </div>
            )}

            {cameraStatus === "ready" && (
              <>
                <div className={styles.guideFrame} aria-hidden="true"><i /><i /><i /><i /></div>
                <div className={styles.detectedPill} data-found={Boolean(detectedMove)}>
                  {detectedMove ? <><span>{MOVES[detectedMove].emoji}</span><b>{MOVES[detectedMove].fa}</b><small>{confidence}%</small></> : <><i /><b>دستت را داخل کادر بگیر</b></>}
                </div>
              </>
            )}

            {isCounting && countdown !== null && (
              <div className={styles.countdown} aria-live="assertive"><span>{countdown}</span><small>حرکتت را نگه دار!</small></div>
            )}
          </div>

          {cameraError && <p className={styles.errorMessage} role="alert">{cameraError}</p>}
          <div className={styles.cameraFooter}>
            <span><i className={styles.lockIcon}>✓</i> پردازش امن و محلی در مرورگر</span>
            <span>بدون ذخیره تصویر</span>
          </div>
        </div>

        <aside className={styles.scorePanel}>
          <div className={styles.scoreHeading}><span>امتیاز بازی</span><button type="button" onClick={resetScore}>شروع دوباره ↻</button></div>
          <div className={styles.scoreboard}>
            <div><small>تو</small><strong>{score.player}</strong></div>
            <span>:</span>
            <div><small>کامپیوتر</small><strong>{score.computer}</strong></div>
          </div>
          <div className={styles.draws}>تعداد مساوی‌ها <b>{score.draws}</b></div>

          <div className={styles.roundCard} data-result={roundResult ?? "idle"}>
            {resultCopy && playerMove && computerMove ? (
              <>
                <div className={styles.versusMoves}>
                  <div><span>{MOVES[playerMove].emoji}</span><small>حرکت تو</small></div>
                  <b>VS</b>
                  <div><span>{MOVES[computerMove].emoji}</span><small>کامپیوتر</small></div>
                </div>
                <h2>{resultCopy.title}</h2>
                <p>{resultCopy.detail}</p>
              </>
            ) : (
              <>
                <div className={styles.waitingOrb}><span>✦</span></div>
                <h2>{cameraStatus === "ready" ? "آماده‌ای؟" : "منتظر دوربین"}</h2>
                <p>{cameraStatus === "ready" ? "یکی از سه حرکت را آماده کن و راند را شروع کن." : "بعد از فعال‌شدن دوربین، بازی از اینجا شروع می‌شود."}</p>
              </>
            )}
          </div>

          <button className={styles.playButton} type="button" onClick={startRound} disabled={cameraStatus !== "ready" || isCounting}>
            <span>{isCounting ? "در حال شمارش..." : roundResult ? "راند بعدی" : "شروع راند"}</span><i>←</i>
          </button>
          {cameraStatus === "ready" && !detectedMove && !isCounting && <p className={styles.hint}>قبل از شروع، صبر کن تا حرکتت پایین تصویر شناسایی شود.</p>}
        </aside>
      </section>

      <footer className={styles.footer}><span>ساخته‌شده با هوش مصنوعی در</span><b>SAMIZ AI</b><i>✦</i><span>Webcam Edition · 2026</span></footer>
    </main>
  );
}
