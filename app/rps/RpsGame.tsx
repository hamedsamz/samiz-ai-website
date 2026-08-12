"use client";

import type { HandLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Gesture = "rock" | "paper" | "scissors";
type Phase = "idle" | "loading" | "ready" | "countdown" | "reveal" | "gameover" | "error";
type RoundResult = "win" | "lose" | "draw" | "miss";
type HistoryItem = { player: Gesture; computer: Gesture; result: Exclude<RoundResult, "miss"> };

const GESTURES: Record<Gesture, { emoji: string; fa: string }> = {
  rock: { emoji: "✊", fa: "سنگ" },
  paper: { emoji: "✋", fa: "کاغذ" },
  scissors: { emoji: "✌️", fa: "قیچی" },
};

const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15],
  [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function distance(a: NormalizedLandmark, b: NormalizedLandmark) {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
}

function jointAngle(a: NormalizedLandmark, center: NormalizedLandmark, b: NormalizedLandmark) {
  const ax = a.x - center.x;
  const ay = a.y - center.y;
  const az = (a.z || 0) - (center.z || 0);
  const bx = b.x - center.x;
  const by = b.y - center.y;
  const bz = (b.z || 0) - (center.z || 0);
  const magnitude = Math.hypot(ax, ay, az) * Math.hypot(bx, by, bz);
  if (!magnitude) return 0;
  const cosine = Math.max(-1, Math.min(1, (ax * bx + ay * by + az * bz) / magnitude));
  return Math.acos(cosine) * 180 / Math.PI;
}

function classifyGesture(points: NormalizedLandmark[]): Gesture | null {
  if (points.length < 21) return null;
  const fingers = [
    { mcp: 5, pip: 6, dip: 7, tip: 8 },
    { mcp: 9, pip: 10, dip: 11, tip: 12 },
    { mcp: 13, pip: 14, dip: 15, tip: 16 },
    { mcp: 17, pip: 18, dip: 19, tip: 20 },
  ];
  const extended = fingers.map(({ mcp, pip, dip, tip }) => {
    const pipAngle = jointAngle(points[mcp], points[pip], points[tip]);
    const dipAngle = jointAngle(points[pip], points[dip], points[tip]);
    return pipAngle > 145 && dipAngle > 135 && distance(points[tip], points[0]) > distance(points[pip], points[0]) * 1.04;
  });
  const [index, middle, ring, pinky] = extended;
  if (!index && !middle && !ring && !pinky) return "rock";
  if (index && middle && ring && pinky) return "paper";
  if (index && middle && !ring && !pinky) return "scissors";
  return null;
}

function decide(player: Gesture, computer: Gesture): Exclude<RoundResult, "miss"> {
  if (player === computer) return "draw";
  if (
    (player === "rock" && computer === "scissors") ||
    (player === "paper" && computer === "rock") ||
    (player === "scissors" && computer === "paper")
  ) return "win";
  return "lose";
}

function resultCopy(result: RoundResult) {
  if (result === "win") return { title: "این دست مال تو بود!", detail: "یک امتیاز برای تو", className: "win" };
  if (result === "lose") return { title: "هوش مصنوعی این دست رو برد!", detail: "یک امتیاز برای رقیب", className: "lose" };
  if (result === "draw") return { title: "مساوی شد!", detail: "دوباره امتحان کن", className: "draw" };
  return { title: "حرکتت مشخص نبود", detail: "دستت را واضح‌تر جلوی دوربین بگیر", className: "miss" };
}

export default function RpsGame() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const phaseRef = useRef<Phase>("idle");
  const detectedRef = useRef<Gesture | null>(null);
  const samplesRef = useRef<Array<Gesture | null>>([]);
  const roundTokenRef = useRef(0);
  const playerScoreRef = useRef(0);
  const computerScoreRef = useRef(0);

  const [phase, setPhase] = useState<Phase>("idle");
  const [cameraVisible, setCameraVisible] = useState(false);
  const [detected, setDetected] = useState<Gesture | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [playerChoice, setPlayerChoice] = useState<Gesture | null>(null);
  const [computerChoice, setComputerChoice] = useState<Gesture | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult>("draw");
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [matchWinner, setMatchWinner] = useState<"player" | "computer" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [shareStatus, setShareStatus] = useState("");

  const changePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const stopCamera = useCallback(() => {
    roundTokenRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraVisible(false);
  }, []);

  useEffect(() => () => {
    stopCamera();
    landmarkerRef.current?.close();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  }, [stopCamera]);

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
        const landmarks = result.landmarks[0] || null;
        const rawGesture = landmarks ? classifyGesture(landmarks) : null;
        samplesRef.current.push(rawGesture);
        samplesRef.current = samplesRef.current.slice(-8);
        const counts = samplesRef.current.reduce<Record<string, number>>((all, item) => {
          if (item) all[item] = (all[item] || 0) + 1;
          return all;
        }, {});
        const stable = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[1] || 0) >= 5
          ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as Gesture
          : null;
        detectedRef.current = stable;
        setDetected((previous) => previous === stable ? previous : stable);

        if (landmarks) {
          const scale = video.videoWidth && video.videoHeight ? Math.max(width / video.videoWidth, height / video.videoHeight) : 1;
          const renderedWidth = (video.videoWidth || width) * scale;
          const renderedHeight = (video.videoHeight || height) * scale;
          const map = (point: NormalizedLandmark) => ({
            x: (width - renderedWidth) / 2 + (1 - point.x) * renderedWidth,
            y: (height - renderedHeight) / 2 + point.y * renderedHeight,
          });
          context.strokeStyle = stable ? "rgba(89,255,213,.88)" : "rgba(255,255,255,.42)";
          context.fillStyle = stable ? "#59ffd5" : "#ffffff";
          context.lineWidth = 2.5;
          context.shadowColor = stable ? "#59ffd5" : "transparent";
          context.shadowBlur = stable ? 12 : 0;
          HAND_CONNECTIONS.forEach(([from, to]) => {
            const a = map(landmarks[from]);
            const b = map(landmarks[to]);
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.stroke();
          });
          landmarks.forEach((point, index) => {
            const mapped = map(point);
            context.beginPath();
            context.arc(mapped.x, mapped.y, index === 8 ? 6 : 3, 0, Math.PI * 2);
            context.fill();
          });
          context.shadowBlur = 0;
        }
      }
      animationRef.current = requestAnimationFrame(draw);
    };
    animationRef.current = requestAnimationFrame(draw);
    return () => {
      observer.disconnect();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const prepareCamera = async () => {
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
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          audio: false,
        });
    const [, stream] = await Promise.all([modelPromise, cameraPromise]);
    streamRef.current = stream;
    if (!videoRef.current) return;
    videoRef.current.srcObject = stream;
    await videoRef.current.play();
    setCameraVisible(true);
  };

  const startGame = async () => {
    try {
      setErrorMessage("");
      changePhase("loading");
      await prepareCamera();
      playerScoreRef.current = 0;
      computerScoreRef.current = 0;
      setPlayerScore(0);
      setComputerScore(0);
      setHistory([]);
      setMatchWinner(null);
      setPlayerChoice(null);
      setComputerChoice(null);
      setShareStatus("");
      changePhase("ready");
    } catch (error) {
      stopCamera();
      const name = error instanceof DOMException ? error.name : "";
      setErrorMessage(name === "NotAllowedError"
        ? "اجازه دوربین داده نشد. از تنظیمات مرورگر دسترسی دوربین را فعال کن."
        : name === "NotFoundError"
          ? "دوربینی روی این دستگاه پیدا نشد."
          : "دوربین یا سیستم تشخیص دست آماده نشد. صفحه را تازه کن و دوباره امتحان کن.");
      changePhase("error");
    }
  };

  const startRound = async () => {
    if (phaseRef.current !== "ready") return;
    const token = ++roundTokenRef.current;
    const choices = Object.keys(GESTURES) as Gesture[];
    const computer = choices[Math.floor(Math.random() * choices.length)];
    setPlayerChoice(null);
    setComputerChoice(null);
    setRoundResult("draw");
    changePhase("countdown");
    for (let value = 3; value >= 1; value -= 1) {
      setCountdown(value);
      await sleep(680);
      if (roundTokenRef.current !== token) return;
    }
    const player = detectedRef.current;
    if (!player) {
      setRoundResult("miss");
      changePhase("reveal");
      await sleep(1500);
      if (roundTokenRef.current === token) changePhase("ready");
      return;
    }
    const result = decide(player, computer);
    setPlayerChoice(player);
    setComputerChoice(computer);
    setRoundResult(result);
    if (result === "win") {
      playerScoreRef.current += 1;
      setPlayerScore(playerScoreRef.current);
    } else if (result === "lose") {
      computerScoreRef.current += 1;
      setComputerScore(computerScoreRef.current);
    }
    setHistory((previous) => [...previous, { player, computer, result }].slice(-6));
    changePhase("reveal");
    if (navigator.vibrate) navigator.vibrate(result === "win" ? [35, 30, 70] : result === "lose" ? 80 : 25);
    await sleep(1850);
    if (roundTokenRef.current !== token) return;
    if (playerScoreRef.current >= 3 || computerScoreRef.current >= 3) {
      setMatchWinner(playerScoreRef.current >= 3 ? "player" : "computer");
      changePhase("gameover");
    } else {
      changePhase("ready");
    }
  };

  const exitGame = () => {
    stopCamera();
    detectedRef.current = null;
    samplesRef.current = [];
    setDetected(null);
    changePhase("idle");
  };

  const shareResult = async () => {
    const text = matchWinner === "player"
      ? "من هوش مصنوعی رو توی سنگ کاغذ قیچی با دوربین شکست دادم! 😎✊✋✌️ تو می‌تونی؟"
      : "با دوربین سنگ کاغذ قیچی بازی کردم! ✊✋✌️ تو هم امتحانش کن.";
    const url = window.location.href.split("?")[0];
    try {
      if (navigator.share) {
        await navigator.share({ title: "AI Rock Paper Scissors", text, url });
        setShareStatus("نتیجه به اشتراک گذاشته شد");
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setShareStatus("متن و لینک بازی کپی شد");
      }
    } catch {
      setShareStatus("");
    }
  };

  const roundCopy = resultCopy(roundResult);

  return (
    <main className="rps-page" dir="rtl">
      <div className="rps-stage" ref={stageRef}>
        <video ref={videoRef} className={`rps-video ${cameraVisible ? "visible" : ""}`} muted playsInline aria-label="تصویر زنده دوربین بازی" />
        <div className="rps-overlay" />
        <canvas ref={canvasRef} className="rps-canvas" aria-hidden="true" />

        <header className="rps-header">
          <Link href="/" className="rps-brand" aria-label="بازگشت به سمیز"><b>S</b><span>SAMIZ <em>PLAY</em></span></Link>
          <div className="rps-title"><span>AI CAMERA GAME</span><strong>سنگ، کاغذ، قیچی</strong></div>
          {phase !== "idle" && <button onClick={exitGame} className="rps-exit">خروج ×</button>}
        </header>

        {(phase === "ready" || phase === "countdown" || phase === "reveal" || phase === "gameover") && (
          <div className="rps-scoreboard">
            <div><span>تو</span><strong>{playerScore}</strong></div>
            <p><i className={playerScore >= 1 ? "on" : ""} /><i className={playerScore >= 2 ? "on" : ""} /><i className={playerScore >= 3 ? "on" : ""} /></p>
            <b>VS</b>
            <p><i className={computerScore >= 1 ? "cpu" : ""} /><i className={computerScore >= 2 ? "cpu" : ""} /><i className={computerScore >= 3 ? "cpu" : ""} /></p>
            <div><span>هوش مصنوعی</span><strong>{computerScore}</strong></div>
          </div>
        )}

        {phase === "idle" && (
          <section className="rps-panel rps-intro">
            <div className="rps-badge">بازی با حرکت واقعی دست</div>
            <div className="rps-hero-icons"><span>✊</span><span>✋</span><span>✌️</span></div>
            <h1>سنگ، کاغذ، <em>قیچی!</em></h1>
            <p>دوربین حرکت دستت رو تشخیص می‌ده. با هوش مصنوعی مسابقه بده؛ هرکی زودتر ۳ امتیاز بگیره برنده‌ست.</p>
            <button className="rps-primary" onClick={startGame}>فعال‌کردن دوربین و شروع <span>←</span></button>
            <small>🔒 تصویر فقط داخل مرورگر پردازش می‌شود و جایی ذخیره یا ارسال نمی‌شود.</small>
          </section>
        )}

        {phase === "loading" && (
          <section className="rps-panel rps-loading"><div className="rps-spinner" /><h2>دارم چشم‌های هوش مصنوعی رو باز می‌کنم...</h2><p>اجازه دوربین را تأیید کن؛ اولین بار ممکنه چند ثانیه طول بکشه.</p></section>
        )}

        {phase === "ready" && (
          <section className="rps-play-ui">
            <div className={`detected-card ${detected ? "found" : ""}`}>
              <span>{detected ? GESTURES[detected].emoji : "🖐️"}</span>
              <div><small>حرکت شناسایی‌شده</small><strong>{detected ? GESTURES[detected].fa : "دستت رو نشون بده"}</strong></div>
            </div>
            <div className="gesture-guide"><span>✊ سنگ</span><span>✋ کاغذ</span><span>✌️ قیچی</span></div>
            <button className="rps-primary round-button" onClick={startRound} disabled={!detected}>{detected ? "شروع شمارش ۳، ۲، ۱" : "منتظر تشخیص حرکت..."}</button>
            <p>حرکتت رو نگه دار و دستت رو روبه‌روی دوربین بگیر.</p>
          </section>
        )}

        {phase === "countdown" && (
          <section className="rps-countdown"><span>حرکتت رو نگه دار!</span><strong key={countdown}>{countdown}</strong><p>{detected ? `${GESTURES[detected].emoji} ${GESTURES[detected].fa}` : "دستت هنوز مشخص نیست"}</p></section>
        )}

        {phase === "reveal" && (
          <section className={`rps-panel rps-reveal ${roundCopy.className}`}>
            {roundResult === "miss" ? <div className="miss-hand">🖐️</div> : (
              <div className="choice-duel">
                <div><small>تو</small><strong>{playerChoice ? GESTURES[playerChoice].emoji : "؟"}</strong><span>{playerChoice ? GESTURES[playerChoice].fa : "نامشخص"}</span></div>
                <b>VS</b>
                <div><small>هوش مصنوعی</small><strong>{computerChoice ? GESTURES[computerChoice].emoji : "؟"}</strong><span>{computerChoice ? GESTURES[computerChoice].fa : "مخفی"}</span></div>
              </div>
            )}
            <h2>{roundCopy.title}</h2><p>{roundCopy.detail}</p>
          </section>
        )}

        {phase === "gameover" && (
          <section className={`rps-panel rps-finish ${matchWinner === "player" ? "champion" : "defeat"}`}>
            <div className="finish-icon">{matchWinner === "player" ? "🏆" : "🤖"}</div>
            <span>مسابقه تمام شد</span>
            <h2>{matchWinner === "player" ? "تو قهرمان شدی!" : "این بار هوش مصنوعی برد!"}</h2>
            <div className="final-match"><strong>{playerScore}</strong><b>–</b><strong>{computerScore}</strong></div>
            <p>{matchWinner === "player" ? "حرکت‌هات سریع و غیرقابل پیش‌بینی بود 😎" : "یه دست دیگه بازی کن و انتقامت رو بگیر!"}</p>
            <button className="rps-primary" onClick={shareResult}>به چالش کشیدن دوستام ↗</button>
            <button className="rps-secondary" onClick={startGame}>مسابقه دوباره</button>
            {shareStatus && <small className="share-status">{shareStatus}</small>}
          </section>
        )}

        {phase === "error" && (
          <section className="rps-panel rps-error"><div>📷</div><h2>دوربین آماده نشد</h2><p>{errorMessage}</p><button className="rps-primary" onClick={startGame}>تلاش دوباره</button><button className="rps-secondary" onClick={exitGame}>بازگشت</button></section>
        )}

        {history.length > 0 && phase !== "idle" && phase !== "loading" && phase !== "gameover" && (
          <div className="round-history">{history.map((item, index) => <span key={`${item.player}-${item.computer}-${index}`} className={item.result}>{GESTURES[item.player].emoji}<i>{item.result === "win" ? "+" : item.result === "lose" ? "−" : "="}</i>{GESTURES[item.computer].emoji}</span>)}</div>
        )}
        <footer className="rps-footer">ساخته‌شده با GPT Work توسط <a href="https://instagram.com/hamedsamizadeh" target="_blank" rel="noreferrer">@hamedsamizadeh</a></footer>
      </div>
    </main>
  );
}
