"use client";

import type { HandLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "loading" | "countdown" | "playing" | "result" | "error";
type Point = { x: number; y: number; at: number };
type WordCard = { word: string; fa: string; emoji: string; aliases?: string[] };
type Target = WordCard & { x: number; y: number; radius: number; unlocked: boolean; bornAt: number; bob: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number };

interface SpeechRecognitionAlternativeLike { transcript: string; confidence: number }
interface SpeechRecognitionResultLike { readonly length: number; readonly isFinal: boolean; [index: number]: SpeechRecognitionAlternativeLike }
interface SpeechRecognitionEventLike extends Event { readonly resultIndex: number; readonly results: { readonly length: number; [index: number]: SpeechRecognitionResultLike } }
interface SpeechRecognitionErrorLike extends Event { readonly error: string }
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const GAME_SECONDS = 45;
const TARGET_LIFETIME = 9000;
const WORDS: WordCard[] = [
  { word: "apple", fa: "سیب", emoji: "🍎" },
  { word: "banana", fa: "موز", emoji: "🍌" },
  { word: "orange", fa: "پرتقال", emoji: "🍊" },
  { word: "water", fa: "آب", emoji: "💧" },
  { word: "bread", fa: "نان", emoji: "🍞" },
  { word: "milk", fa: "شیر", emoji: "🥛" },
  { word: "book", fa: "کتاب", emoji: "📘" },
  { word: "phone", fa: "تلفن", emoji: "📱" },
  { word: "key", fa: "کلید", emoji: "🔑" },
  { word: "clock", fa: "ساعت", emoji: "⏰" },
  { word: "house", fa: "خانه", emoji: "🏠" },
  { word: "car", fa: "ماشین", emoji: "🚗" },
  { word: "train", fa: "قطار", emoji: "🚆" },
  { word: "plane", fa: "هواپیما", emoji: "✈️", aliases: ["airplane"] },
  { word: "chair", fa: "صندلی", emoji: "🪑" },
  { word: "door", fa: "در", emoji: "🚪" },
  { word: "shoe", fa: "کفش", emoji: "👟" },
  { word: "ball", fa: "توپ", emoji: "⚽" },
  { word: "cat", fa: "گربه", emoji: "🐱" },
  { word: "dog", fa: "سگ", emoji: "🐶" },
  { word: "bird", fa: "پرنده", emoji: "🐦" },
  { word: "fish", fa: "ماهی", emoji: "🐟" },
  { word: "tree", fa: "درخت", emoji: "🌳" },
  { word: "flower", fa: "گل", emoji: "🌸" },
  { word: "sun", fa: "خورشید", emoji: "☀️" },
  { word: "moon", fa: "ماه", emoji: "🌙" },
  { word: "star", fa: "ستاره", emoji: "⭐" },
  { word: "rain", fa: "باران", emoji: "🌧️" },
  { word: "fire", fa: "آتش", emoji: "🔥" },
  { word: "hand", fa: "دست", emoji: "✋" },
  { word: "eye", fa: "چشم", emoji: "👁️" },
  { word: "nose", fa: "بینی", emoji: "👃" },
];

const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15],
  [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function normalizeSpeech(value: string) {
  return value.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
}

function matchesWord(transcript: string, target: Target) {
  const spoken = normalizeSpeech(transcript);
  const accepted = [target.word, ...(target.aliases || [])].map(normalizeSpeech);
  return accepted.some((word) => spoken === word || spoken.split(" ").includes(word));
}

function distanceToSegment(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (!dx && !dy) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point.x - start.x - t * dx, point.y - start.y - t * dy);
}

function rank(score: number) {
  if (score >= 180) return { title: "English Ninja Master", icon: "🏆" };
  if (score >= 120) return { title: "Vocabulary Warrior", icon: "🥷" };
  if (score >= 65) return { title: "Word Slicer", icon: "⚔️" };
  return { title: "Ninja Student", icon: "🔥" };
}

export default function EnglishNinjaGame() {
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const listeningWantedRef = useRef(false);
  const lastVideoTimeRef = useRef(-1);
  const pointerRef = useRef<Point | null>(null);
  const previousPointerRef = useRef<Point | null>(null);
  const trailRef = useRef<Point[]>([]);
  const targetRef = useRef<Target | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const respawnAtRef = useRef(0);
  const lastFrameRef = useRef(0);
  const endTimeRef = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const comboRef = useRef(0);
  const bestComboRef = useRef(0);
  const slicedCountRef = useRef(0);
  const lastWordRef = useRef("");

  const [phase, setPhase] = useState<Phase>("idle");
  const [cameraVisible, setCameraVisible] = useState(false);
  const [listening, setListening] = useState(false);
  const [handVisible, setHandVisible] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [countdown, setCountdown] = useState(3);
  const [currentWord, setCurrentWord] = useState<WordCard | null>(null);
  const [pronounced, setPronounced] = useState(false);
  const [heardText, setHeardText] = useState("");
  const [feedback, setFeedback] = useState("کلمه انگلیسی را بگو");
  const [errorMessage, setErrorMessage] = useState("");
  const [finalCombo, setFinalCombo] = useState(0);
  const [finalSlices, setFinalSlices] = useState(0);
  const [shareStatus, setShareStatus] = useState("");

  const changePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const stopListening = useCallback(() => {
    listeningWantedRef.current = false;
    try { recognitionRef.current?.abort(); } catch { /* already stopped */ }
    setListening(false);
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraVisible(false);
  }, []);

  const finishGame = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    stopListening();
    setFinalCombo(bestComboRef.current);
    setFinalSlices(slicedCountRef.current);
    changePhase("result");
  }, [changePhase, stopListening]);

  const spawnTarget = useCallback((width: number, height: number, now: number) => {
    const available = WORDS.filter((item) => item.word !== lastWordRef.current);
    const word = available[Math.floor(Math.random() * available.length)];
    lastWordRef.current = word.word;
    const radius = Math.max(52, Math.min(70, width * .065));
    const safeTop = Math.max(170, height * .25);
    const safeBottom = Math.max(safeTop + 80, height - 190);
    targetRef.current = {
      ...word,
      x: radius + 40 + Math.random() * Math.max(1, width - radius * 2 - 80),
      y: safeTop + Math.random() * Math.max(1, safeBottom - safeTop),
      radius,
      unlocked: false,
      bornAt: now,
      bob: Math.random() * Math.PI * 2,
    };
    setCurrentWord(word);
    setPronounced(false);
    setHeardText("");
    setFeedback("کلمه انگلیسی را بگو");
  }, []);

  const burst = useCallback((target: Target) => {
    for (let index = 0; index < 24; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 310;
      particlesRef.current.push({
        x: target.x, y: target.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: .45 + Math.random() * .45,
        color: index % 3 === 0 ? "#ffffff" : index % 2 === 0 ? "#ffe66c" : "#70ffb5",
        size: 2 + Math.random() * 6,
      });
    }
  }, []);

  const handleCorrectSpeech = useCallback((transcript: string) => {
    const target = targetRef.current;
    if (phaseRef.current !== "playing" || !target || target.unlocked || !matchesWord(transcript, target)) return false;
    target.unlocked = true;
    setPronounced(true);
    setFeedback("عالی بود! حالا با انگشتت ببرش");
    if (navigator.vibrate) navigator.vibrate(20);
    return true;
  }, []);

  const ensureRecognition = useCallback(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) throw new Error("SPEECH_UNSUPPORTED");
    if (recognitionRef.current) return recognitionRef.current;
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      let newest = "";
      for (let resultIndex = event.resultIndex; resultIndex < event.results.length; resultIndex += 1) {
        const result = event.results[resultIndex];
        for (let alternativeIndex = 0; alternativeIndex < result.length; alternativeIndex += 1) {
          const transcript = result[alternativeIndex].transcript.trim();
          if (alternativeIndex === 0) newest = transcript;
          if (handleCorrectSpeech(transcript)) break;
        }
      }
      if (newest) setHeardText(newest);
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        listeningWantedRef.current = false;
        setErrorMessage("اجازه میکروفون داده نشد. دسترسی میکروفون را در تنظیمات مرورگر فعال کن.");
        stopCamera();
        changePhase("error");
      }
      if (event.error !== "no-speech" && event.error !== "aborted") setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      if (listeningWantedRef.current) {
        window.setTimeout(() => {
          if (!listeningWantedRef.current) return;
          try { recognition.start(); } catch { /* browser is already restarting */ }
        }, 180);
      }
    };
    recognitionRef.current = recognition;
    return recognition;
  }, [changePhase, handleCorrectSpeech, stopCamera]);

  const startListening = useCallback(() => {
    const recognition = ensureRecognition();
    listeningWantedRef.current = true;
    try { recognition.start(); } catch { /* already listening */ }
  }, [ensureRecognition]);

  useEffect(() => () => {
    stopListening();
    stopCamera();
    landmarkerRef.current?.close();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  }, [stopCamera, stopListening]);

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
      const dt = Math.min(.034, Math.max(.001, (now - lastFrameRef.current) / 1000));
      lastFrameRef.current = now;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      let landmarks: NormalizedLandmark[] | null = null;
      if (landmarker && video && video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        landmarks = landmarker.detectForVideo(video, now).landmarks[0] || null;
        if (landmarks) {
          const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
          const renderedWidth = video.videoWidth * scale;
          const renderedHeight = video.videoHeight * scale;
          const map = (point: NormalizedLandmark) => ({
            x: (width - renderedWidth) / 2 + (1 - point.x) * renderedWidth,
            y: (height - renderedHeight) / 2 + point.y * renderedHeight,
          });
          const tip = map(landmarks[8]);
          pointerRef.current = { ...tip, at: now };
          context.strokeStyle = "rgba(112,255,181,.55)";
          context.lineWidth = 2;
          context.shadowColor = "#70ffb5";
          context.shadowBlur = 9;
          HAND_CONNECTIONS.forEach(([from, to]) => {
            const a = map(landmarks![from]);
            const b = map(landmarks![to]);
            context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke();
          });
          context.shadowBlur = 0;
        } else {
          pointerRef.current = null;
        }
      }

      const pointer = pointerRef.current;
      if (pointer) {
        trailRef.current.push(pointer);
        trailRef.current = trailRef.current.filter((item) => now - item.at < 250).slice(-16);
      } else {
        trailRef.current = trailRef.current.filter((item) => now - item.at < 150);
      }

      if (phaseRef.current === "playing") {
        const remaining = Math.max(0, (endTimeRef.current - now) / 1000);
        setTimeLeft((previous) => Math.abs(previous - remaining) > .08 ? remaining : previous);
        if (remaining <= 0 || livesRef.current <= 0) finishGame();

        if (!targetRef.current && now >= respawnAtRef.current) spawnTarget(width, height, now);
        const target = targetRef.current;
        if (target && now - target.bornAt > TARGET_LIFETIME) {
          livesRef.current -= 1;
          comboRef.current = 0;
          setLives(livesRef.current);
          setCombo(0);
          setFeedback(target.unlocked ? "وقت برش تموم شد!" : `جواب درست: ${target.word}`);
          targetRef.current = null;
          respawnAtRef.current = now + 850;
          if (navigator.vibrate) navigator.vibrate(70);
        }

        const previous = previousPointerRef.current;
        const speed = pointer && previous ? Math.hypot(pointer.x - previous.x, pointer.y - previous.y) / Math.max(.008, (pointer.at - previous.at) / 1000) : 0;
        if (targetRef.current?.unlocked && pointer && previous && speed > 230 && distanceToSegment({ x: targetRef.current.x, y: targetRef.current.y, at: now }, previous, pointer) < targetRef.current.radius + 15) {
          const sliced = targetRef.current;
          burst(sliced);
          const nextCombo = comboRef.current + 1;
          comboRef.current = nextCombo;
          bestComboRef.current = Math.max(bestComboRef.current, nextCombo);
          scoreRef.current += 10 + Math.min(20, Math.max(0, nextCombo - 1) * 2);
          slicedCountRef.current += 1;
          setScore(scoreRef.current);
          setCombo(nextCombo);
          setFeedback(`عالی! ${sliced.word} یعنی ${sliced.fa}`);
          targetRef.current = null;
          respawnAtRef.current = now + 520;
          if (navigator.vibrate) navigator.vibrate([18, 25, 35]);
        }
        previousPointerRef.current = pointer;
      }

      particlesRef.current.forEach((particle) => {
        particle.life -= dt;
        particle.vy += 420 * dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
      });
      particlesRef.current = particlesRef.current.filter((particle) => particle.life > 0);

      const target = targetRef.current;
      if (target) {
        const bobY = Math.sin(now / 520 + target.bob) * 7;
        const progress = Math.max(0, 1 - (now - target.bornAt) / TARGET_LIFETIME);
        context.save();
        context.translate(target.x, target.y + bobY);
        context.shadowColor = target.unlocked ? "#70ffb5" : "#ffdc6c";
        context.shadowBlur = target.unlocked ? 35 : 18;
        const gradient = context.createRadialGradient(0, 0, 10, 0, 0, target.radius);
        gradient.addColorStop(0, target.unlocked ? "rgba(112,255,181,.29)" : "rgba(255,220,108,.18)");
        gradient.addColorStop(1, "rgba(8,10,13,.88)");
        context.fillStyle = gradient;
        context.beginPath(); context.arc(0, 0, target.radius, 0, Math.PI * 2); context.fill();
        context.lineWidth = 3;
        context.strokeStyle = "rgba(255,255,255,.1)";
        context.beginPath(); context.arc(0, 0, target.radius, 0, Math.PI * 2); context.stroke();
        context.strokeStyle = target.unlocked ? "#70ffb5" : "#ffdc6c";
        context.beginPath(); context.arc(0, 0, target.radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress); context.stroke();
        context.shadowBlur = 0;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = `${target.radius * .68}px Apple Color Emoji, Segoe UI Emoji, sans-serif`;
        context.fillStyle = "#fff";
        context.fillText(target.emoji, 0, -target.radius * .18);
        context.font = `800 ${Math.max(13, target.radius * .24)}px Arial, sans-serif`;
        context.fillStyle = target.unlocked ? "#70ffb5" : "rgba(255,255,255,.78)";
        context.fillText(target.unlocked ? target.word.toUpperCase() : "SAY IT!", 0, target.radius * .38);
        context.restore();
      }

      particlesRef.current.forEach((particle) => {
        context.globalAlpha = Math.max(0, particle.life * 1.7);
        context.fillStyle = particle.color;
        context.beginPath(); context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); context.fill();
      });
      context.globalAlpha = 1;

      const trail = trailRef.current;
      if (trail.length > 1) {
        context.lineCap = "round";
        for (let index = 1; index < trail.length; index += 1) {
          const alpha = index / trail.length;
          context.strokeStyle = `rgba(112,255,181,${alpha * .92})`;
          context.lineWidth = 2 + alpha * 9;
          context.shadowColor = "#70ffb5";
          context.shadowBlur = 12;
          context.beginPath(); context.moveTo(trail[index - 1].x, trail[index - 1].y); context.lineTo(trail[index].x, trail[index].y); context.stroke();
        }
        context.shadowBlur = 0;
      }
      if (pointer) {
        context.strokeStyle = "white";
        context.lineWidth = 2;
        context.beginPath(); context.arc(pointer.x, pointer.y, 13, 0, Math.PI * 2); context.stroke();
      }
      const visible = Boolean(pointerRef.current);
      setHandVisible((previous) => previous === visible ? previous : visible);
      animationRef.current = requestAnimationFrame(draw);
    };
    animationRef.current = requestAnimationFrame(draw);
    return () => {
      observer.disconnect();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [burst, finishGame, spawnTarget]);

  const prepareCameraAndModel = async () => {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("CAMERA_UNSUPPORTED");
    const modelPromise = landmarkerRef.current
      ? Promise.resolve(landmarkerRef.current)
      : import("@mediapipe/tasks-vision").then(async ({ FilesetResolver, HandLandmarker }) => {
          const files = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm");
          const landmarker = await HandLandmarker.createFromOptions(files, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
              delegate: "CPU",
            },
            runningMode: "VIDEO", numHands: 1,
            minHandDetectionConfidence: .55, minHandPresenceConfidence: .55, minTrackingConfidence: .5,
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
      setShareStatus("");
      ensureRecognition();
      startListening();
      changePhase("loading");
      await prepareCameraAndModel();
      scoreRef.current = 0;
      livesRef.current = 3;
      comboRef.current = 0;
      bestComboRef.current = 0;
      slicedCountRef.current = 0;
      targetRef.current = null;
      particlesRef.current = [];
      trailRef.current = [];
      previousPointerRef.current = null;
      setScore(0); setLives(3); setCombo(0); setTimeLeft(GAME_SECONDS); setCurrentWord(null); setPronounced(false);
      changePhase("countdown");
      for (let value = 3; value >= 1; value -= 1) {
        setCountdown(value);
        await sleep(650);
      }
      endTimeRef.current = performance.now() + GAME_SECONDS * 1000;
      lastFrameRef.current = performance.now();
      respawnAtRef.current = 0;
      changePhase("playing");
    } catch (error) {
      stopListening();
      stopCamera();
      const name = error instanceof DOMException ? error.name : "";
      const message = error instanceof Error ? error.message : "";
      setErrorMessage(message === "SPEECH_UNSUPPORTED"
        ? "مرورگر شما تشخیص گفتار را پشتیبانی نمی‌کند. بازی را با آخرین نسخه Chrome یا Edge باز کن."
        : name === "NotAllowedError"
          ? "اجازه دوربین یا میکروفون داده نشد. دسترسی‌ها را در تنظیمات مرورگر فعال کن."
          : name === "NotFoundError"
            ? "دوربین یا میکروفونی روی این دستگاه پیدا نشد."
            : "راه‌اندازی دوربین، میکروفون یا تشخیص دست انجام نشد. صفحه را تازه کن و دوباره امتحان کن.");
      changePhase("error");
    }
  };

  const exitGame = () => {
    stopListening();
    stopCamera();
    targetRef.current = null;
    pointerRef.current = null;
    changePhase("idle");
  };

  const shareResult = async () => {
    const result = rank(score);
    const text = `من توی English Ninja امتیاز ${score} گرفتم و شدم ${result.title}! 🥷🎤\nتو هم می‌تونی کلمه‌ها رو درست بگی و با دستت ببری؟`;
    const url = window.location.href.split("?")[0];
    try {
      if (navigator.share) {
        await navigator.share({ title: "English Ninja", text, url });
        setShareStatus("نتیجه به اشتراک گذاشته شد");
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setShareStatus("متن و لینک بازی کپی شد");
      }
    } catch { setShareStatus(""); }
  };

  const finalRank = rank(score);

  return (
    <main className="english-ninja-page" dir="rtl">
      <div className="english-ninja-stage" ref={stageRef}>
        <video ref={videoRef} className={`english-ninja-video ${cameraVisible ? "visible" : ""}`} muted playsInline aria-label="تصویر زنده دوربین بازی" />
        <div className="english-ninja-shade" />
        <canvas ref={canvasRef} className="english-ninja-canvas" aria-hidden="true" />

        <header className="en-header">
          <Link href="/" className="en-brand"><b>S</b><span>SAMIZ <em>PLAY</em></span></Link>
          <div className="en-game-name"><small>SPEAK • SLICE • LEARN</small><strong>ENGLISH NINJA</strong></div>
          {phase !== "idle" && <button className="en-exit" onClick={exitGame}>خروج ×</button>}
        </header>

        {phase === "playing" && (
          <div className="en-hud">
            <div><span>امتیاز</span><strong>{score}</strong></div>
            <div className="en-timer"><span>زمان</span><strong>{Math.ceil(timeLeft)}</strong><i style={{ "--time-progress": `${Math.max(0, timeLeft / GAME_SECONDS) * 100}%` } as React.CSSProperties} /></div>
            <div><span>جان</span><strong className="en-hearts">{Array.from({ length: 3 }, (_, index) => <b key={index} className={index >= lives ? "lost" : ""}>♥</b>)}</strong></div>
          </div>
        )}

        {phase === "idle" && (
          <section className="en-panel en-intro">
            <div className="en-kicker">بازی تلفظ و حرکت با هوش مصنوعی</div>
            <div className="en-logo-art"><span>🎤</span><b>🥷</b><span>⚔️</span></div>
            <h1><small>بگو، بُبر، یاد بگیر!</small>ENGLISH <em>NINJA</em></h1>
            <p>تصویر و معنی فارسی رو ببین، کلمه انگلیسی رو درست بگو و بعد با حرکت انگشتت هدف رو ببر.</p>
            <button className="en-primary" onClick={startGame}>فعال‌کردن دوربین و میکروفون <span>←</span></button>
            <div className="browser-note">بهترین اجرا با Chrome یا Edge</div>
            <small className="en-privacy">🔒 سایت صدا یا تصویر را ذخیره نمی‌کند؛ دوربین داخل مرورگر و تبدیل گفتار توسط سرویس مرورگر پردازش می‌شود.</small>
          </section>
        )}

        {phase === "loading" && (
          <section className="en-panel en-loading"><div className="en-loader"><span>🎤</span></div><h2>نینجای انگلیسی داره آماده می‌شه...</h2><p>اجازه دوربین و میکروفون را تأیید کن.</p></section>
        )}

        {phase === "countdown" && (
          <section className="en-countdown"><span>صدات و دستت رو آماده کن</span><strong key={countdown}>{countdown}</strong><p>اول کلمه رو بگو، بعد هدف رو ببر!</p></section>
        )}

        {phase === "playing" && currentWord && (
          <div className={`word-clue ${pronounced ? "unlocked" : ""}`}>
            <span className="clue-emoji">{currentWord.emoji}</span>
            <div><small>{pronounced ? "تلفظ درست بود" : "این کلمه رو به انگلیسی بگو"}</small><strong>{pronounced ? currentWord.word.toUpperCase() : currentWord.fa}</strong></div>
            <div className={`mic-status ${listening ? "live" : ""}`}><i /><i /><i /><i /></div>
          </div>
        )}

        {phase === "playing" && (
          <div className="en-feedback">
            <strong>{feedback}</strong>
            {heardText && !pronounced && <span>شنیدم: “{heardText}”</span>}
          </div>
        )}

        {phase === "playing" && <div className={`en-hand-status ${handVisible ? "found" : ""}`}><i />{handVisible ? "دست شناسایی شد" : "دستت رو جلوی دوربین بگیر"}</div>}
        {phase === "playing" && combo >= 2 && <div className="en-combo" key={combo}>WORD COMBO ×{combo}</div>}

        {phase === "result" && (
          <section className="en-panel en-result">
            <div className="en-result-icon">{finalRank.icon}</div><span>ماموریت تمام شد</span><h2>{finalRank.title}</h2>
            <div className="en-final-score"><strong>{score}</strong><small>امتیاز</small></div>
            <div className="en-result-grid"><div><span>بهترین کمبو</span><strong>×{finalCombo}</strong></div><div><span>کلمات کامل</span><strong>{finalSlices}</strong></div></div>
            <button className="en-primary" onClick={shareResult}>به چالش کشیدن دوستام ↗</button>
            <button className="en-secondary" onClick={startGame}>دوباره بازی می‌کنم</button>
            {shareStatus && <small className="en-share-status">{shareStatus}</small>}
          </section>
        )}

        {phase === "error" && (
          <section className="en-panel en-error"><div>🎤</div><h2>بازی آماده نشد</h2><p>{errorMessage}</p><button className="en-primary" onClick={startGame}>تلاش دوباره</button><button className="en-secondary" onClick={exitGame}>بازگشت</button></section>
        )}

        <footer className="en-footer">ساخته‌شده با GPT Work توسط <a href="https://instagram.com/hamedsamizadeh" target="_blank" rel="noreferrer">@hamedsamizadeh</a></footer>
      </div>
    </main>
  );
}
