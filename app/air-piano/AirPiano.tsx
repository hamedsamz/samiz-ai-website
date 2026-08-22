"use client";

import type { HandLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./air-piano.module.css";

type Phase = "idle" | "loading" | "ready" | "error";
type TipState = { y: number; armed: boolean; anchorY: number; triggerY: number };

const NOTES = [
  { name: "C", key: "A", frequency: 130.81, color: "#ff8c73" },
  { name: "D", key: "S", frequency: 146.83, color: "#ffb86b" },
  { name: "E", key: "D", frequency: 164.81, color: "#f8d98a" },
  { name: "F", key: "F", frequency: 174.61, color: "#a8d5ba" },
  { name: "G", key: "J", frequency: 196, color: "#79b9bd" },
  { name: "A", key: "K", frequency: 220, color: "#a991c6" },
  { name: "B", key: "L", frequency: 246.94, color: "#d98fba" },
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

function CelloGlyph() {
  return (
    <svg className={styles.celloGlyph} viewBox="0 0 120 220" aria-hidden="true">
      <path d="M57 12h6v44c0 8 5 14 12 18 21 11 29 28 23 48-3 10-10 17-20 22 17 11 23 29 15 47-6 13-18 19-33 19s-27-6-33-19c-8-18-2-36 15-47-10-5-17-12-20-22-6-20 2-37 23-48 7-4 12-10 12-18V12Z" />
      <path d="M60 5v202M45 89c-10 5-13 14-8 23M75 89c10 5 13 14 8 23M60 207v10M48 217h24" />
      <circle cx="60" cy="122" r="4" />
    </svg>
  );
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
  const dryRef = useRef<GainNode | null>(null);
  const reverbRef = useRef<ConvolverNode | null>(null);
  const tipStatesRef = useRef<Map<string, TipState>>(new Map());
  const lastStrikeRef = useRef<Map<string, number>>(new Map());
  const activeTimersRef = useRef<Map<number, number>>(new Map());
  const handsCountRef = useRef(0);
  const playNoteRef = useRef<(index: number) => void>(() => undefined);

  const [phase, setPhase] = useState<Phase>("idle");
  const [cameraVisible, setCameraVisible] = useState(false);
  const [handsCount, setHandsCount] = useState(0);
  const [lastSound, setLastSound] = useState("—");
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [flareColor, setFlareColor] = useState("#d8b477");
  const [burst, setBurst] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const ensureAudio = useCallback(async () => {
    if (!audioRef.current) audioRef.current = new AudioContext();
    const audio = audioRef.current;
    if (audio.state === "suspended") await audio.resume();
    if (!dryRef.current || !reverbRef.current) {
      const dry = audio.createGain();
      const convolver = audio.createConvolver();
      const wet = audio.createGain();
      const impulse = audio.createBuffer(2, Math.floor(audio.sampleRate * 2.8), audio.sampleRate);
      for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
        const data = impulse.getChannelData(channel);
        for (let sample = 0; sample < data.length; sample += 1) {
          data[sample] = (Math.random() * 2 - 1) * Math.pow(1 - sample / data.length, 2.7);
        }
      }
      convolver.buffer = impulse;
      dry.gain.value = 0.82;
      wet.gain.value = 0.24;
      dry.connect(audio.destination);
      convolver.connect(wet);
      wet.connect(audio.destination);
      dryRef.current = dry;
      reverbRef.current = convolver;
    }
    return { audio, dry: dryRef.current!, reverb: reverbRef.current! };
  }, []);

  const flashNote = useCallback((index: number) => {
    setActiveNotes((current) => current.includes(index) ? current : [...current, index]);
    const existing = activeTimersRef.current.get(index);
    if (existing) window.clearTimeout(existing);
    const timer = window.setTimeout(() => {
      setActiveNotes((current) => current.filter((item) => item !== index));
      activeTimersRef.current.delete(index);
    }, 520);
    activeTimersRef.current.set(index, timer);
  }, []);

  const playNote = useCallback((index: number) => {
    const note = NOTES[index];
    if (!note) return;
    void ensureAudio().then(({ audio, dry, reverb }) => {
      const now = audio.currentTime;
      const master = audio.createGain();
      const warmth = audio.createBiquadFilter();
      const vibrato = audio.createOscillator();
      const vibratoDepth = audio.createGain();
      const real = new Float32Array(10);
      const imaginary = new Float32Array([0, 1, 0.78, 0.58, 0.39, 0.27, 0.19, 0.13, 0.09, 0.06]);
      const celloWave = audio.createPeriodicWave(real, imaginary);

      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.2, now + 0.09);
      master.gain.exponentialRampToValueAtTime(0.145, now + 0.85);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 2.45);
      warmth.type = "lowpass";
      warmth.frequency.setValueAtTime(2850, now);
      warmth.frequency.exponentialRampToValueAtTime(1450, now + 2.2);
      warmth.Q.value = 1.4;
      warmth.connect(master);
      master.connect(dry);
      master.connect(reverb);

      vibrato.frequency.value = 5.1;
      vibratoDepth.gain.setValueAtTime(0.4, now);
      vibratoDepth.gain.linearRampToValueAtTime(7.2, now + 0.5);
      vibrato.connect(vibratoDepth);
      [-4, 4].forEach((detune, layerIndex) => {
        const oscillator = audio.createOscillator();
        const layer = audio.createGain();
        oscillator.setPeriodicWave(celloWave);
        oscillator.frequency.value = note.frequency;
        oscillator.detune.value = detune;
        layer.gain.value = layerIndex === 0 ? 0.6 : 0.4;
        vibratoDepth.connect(oscillator.detune);
        oscillator.connect(layer);
        layer.connect(warmth);
        oscillator.start(now);
        oscillator.stop(now + 2.5);
      });

      const body = audio.createOscillator();
      const bodyGain = audio.createGain();
      body.type = "sine";
      body.frequency.value = note.frequency / 2;
      bodyGain.gain.setValueAtTime(0.045, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);
      body.connect(bodyGain);
      bodyGain.connect(master);
      body.start(now);
      body.stop(now + 2);

      const bowBuffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.3), audio.sampleRate);
      const bowData = bowBuffer.getChannelData(0);
      for (let sample = 0; sample < bowData.length; sample += 1) {
        bowData[sample] = (Math.random() * 2 - 1) * Math.pow(1 - sample / bowData.length, 1.8);
      }
      const bow = audio.createBufferSource();
      const bowFilter = audio.createBiquadFilter();
      const bowGain = audio.createGain();
      bow.buffer = bowBuffer;
      bowFilter.type = "bandpass";
      bowFilter.frequency.value = 1250;
      bowFilter.Q.value = 0.7;
      bowGain.gain.value = 0.03;
      bow.connect(bowFilter);
      bowFilter.connect(bowGain);
      bowGain.connect(master);
      bow.start(now);
      vibrato.start(now);
      vibrato.stop(now + 2.5);
    }).catch(() => undefined);
    setLastSound(note.name);
    setFlareColor(note.color);
    setBurst((value) => value + 1);
    flashNote(index);
    if (navigator.vibrate) navigator.vibrate(12);
  }, [ensureAudio, flashNote]);

  useEffect(() => { playNoteRef.current = playNote; }, [playNote]);

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
        const compact = width < 780;
        const ringDiameter = compact ? Math.min(width * 0.82, height * 0.62) : Math.min(width * 0.62, height * 0.7, 600);
        const ringRadius = ringDiameter / 2;
        const ringCenter = { x: width / 2, y: height * 0.53 };
        const noteRadius = compact ? Math.max(32, Math.min(width * 0.09, 42)) : Math.max(42, Math.min(width * 0.042, 56));

        landmarks.forEach((hand, handIndex) => {
          const handColor = handIndex === 0 ? "#f5c98b" : "#e6a4b9";
          context.strokeStyle = handColor;
          context.fillStyle = handColor;
          context.lineWidth = 2;
          context.shadowColor = handColor;
          context.shadowBlur = 12;
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
            const isTip = FINGER_TIPS.includes(pointIndex as typeof FINGER_TIPS[number]);
            context.beginPath();
            context.arc(mapped.x, mapped.y, isTip ? 5.5 : 2.4, 0, Math.PI * 2);
            context.fill();
            if (isTip) {
              context.beginPath();
              context.arc(mapped.x, mapped.y, 10, 0, Math.PI * 2);
              context.globalAlpha = 0.24;
              context.stroke();
              context.globalAlpha = 1;
            }
          });

          FINGER_TIPS.forEach((tipIndex) => {
            const mapped = map(hand[tipIndex]);
            if (mapped.x < 0 || mapped.x > width || mapped.y < 0 || mapped.y > height) return;
            let noteIndex = -1;
            for (let index = 0; index < NOTES.length; index += 1) {
              const angle = -Math.PI / 2 + index * Math.PI * 2 / NOTES.length;
              const noteX = ringCenter.x + Math.cos(angle) * ringRadius;
              const noteY = ringCenter.y + Math.sin(angle) * ringRadius;
              if (Math.hypot(mapped.x - noteX, mapped.y - noteY) <= noteRadius * 1.24) {
                noteIndex = index;
                break;
              }
            }
            const id = `${handIndex}-${tipIndex}`;
            const previous = tipStatesRef.current.get(id);
            const insideTarget = noteIndex >= 0;
            const lastStrike = lastStrikeRef.current.get(id) || 0;
            let armed = previous?.armed ?? !insideTarget;
            let anchorY = previous?.anchorY ?? mapped.y;
            let triggerY = previous?.triggerY ?? mapped.y;
            if (mapped.y < anchorY) anchorY = mapped.y;
            if (!insideTarget || (!armed && triggerY - mapped.y > height * 0.014)) {
              armed = true;
              anchorY = mapped.y;
            }
            const deliberateTap = insideTarget && mapped.y - anchorY > height * 0.012;
            if (insideTarget && armed && now - lastStrike > 170 && deliberateTap) {
              playNoteRef.current(noteIndex);
              lastStrikeRef.current.set(id, now);
              armed = false;
              triggerY = mapped.y;
              anchorY = mapped.y;
            }
            tipStatesRef.current.set(id, { y: mapped.y, armed, anchorY, triggerY });
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
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                delegate: "GPU",
              },
              runningMode: "VIDEO",
              numHands: 2,
              minHandDetectionConfidence: 0.56,
              minHandPresenceConfidence: 0.52,
              minTrackingConfidence: 0.5,
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
        ? "Camera access was blocked. Allow camera access in your browser and try again."
        : name === "NotFoundError"
          ? "No camera was found on this device."
          : "The camera or hand tracking could not start. Refresh the page and try again.");
      setPhase("error");
    }
  };

  const exit = () => {
    stopCamera();
    setLastSound("—");
    setPhase("idle");
  };
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stageRef.current?.requestFullscreen();
  };

  return (
    <main className={styles.page} dir="ltr">
      <div className={styles.ambientOne} />
      <div className={styles.ambientTwo} />
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Back to Samiz"><b>S</b><span>SAMIZ <em>PLAY</em></span></Link>
        <div className={styles.titleLockup}><small>AI CAMERA INSTRUMENT</small><strong>THE AIR CELLO</strong></div>
        <span className={styles.headerMood}>Play what you feel.</span>
      </header>

      <section className={styles.shell}>
        <div className={styles.stage} ref={stageRef} style={{ "--flare-color": flareColor } as React.CSSProperties}>
          <video ref={videoRef} className={`${styles.video} ${cameraVisible ? styles.visible : ""}`} muted playsInline aria-label="Live camera" />
          <div className={styles.cameraShade} />
          <div className={styles.filmGrain} />
          <div key={burst} className={burst > 0 ? styles.soundBurst : ""} />
          <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
          <div className={styles.liveBar}>
            <span><i className={handsCount > 0 ? styles.liveDot : styles.waitDot} />{phase === "ready" ? (handsCount > 0 ? `${handsCount} HAND${handsCount > 1 ? "S" : ""} IN FRAME` : "SHOW YOUR HANDS") : "CELLO · C3—B3"}</span>
            {phase === "ready" && <div><button type="button" onClick={toggleFullscreen}>FULLSCREEN</button><button type="button" onClick={exit}>EXIT</button></div>}
          </div>

          <div className={styles.noteRing} aria-label="Seven cello notes arranged in a circle">
            <div className={styles.orbit} />
            {NOTES.map((note, index) => {
              const angle = -90 + index * 360 / NOTES.length;
              return (
                <button
                  type="button"
                  key={note.name}
                  className={styles.notePad}
                  data-active={activeNotes.includes(index)}
                  style={{ "--note-color": note.color, "--note-angle": `${angle}deg`, "--note-counter-angle": `${-angle}deg` } as React.CSSProperties}
                  onPointerDown={() => playNote(index)}
                  aria-label={`${note.name} cello note`}
                ><span>{note.name}</span><small>CELLO</small><kbd>{note.key}</kbd></button>
              );
            })}
            <div className={styles.ringCore}><CelloGlyph /><small>PLAY WHAT</small><strong>YOU FEEL</strong><span>{lastSound === "—" ? "CELLO" : `NOTE ${lastSound}`}</span></div>
          </div>

          {phase === "idle" && (
            <div className={styles.intro}>
              <span className={styles.eyebrow}>YOUR HANDS · ONE CELLO · SEVEN NOTES</span>
              <h1>Turn movement<br />into <em>emotion.</em></h1>
              <p>A cinematic cello you play in the air. Move your fingertips into the circle and let every gesture become music.</p>
              <button type="button" className={styles.primaryButton} onClick={start}>ENTER THE EXPERIENCE <span>↗</span></button>
              <small>No downloads. Your camera never leaves this device.</small>
            </div>
          )}
          {phase === "loading" && <div className={styles.loadingPanel}><i /><h2>Tuning your cello…</h2><p>Allow camera access. The first load can take a few seconds.</p></div>}
          {phase === "error" && <div className={styles.errorPanel}><span>◌</span><h2>The camera stayed quiet.</h2><p>{errorMessage}</p><button type="button" className={styles.primaryButton} onClick={start}>TRY AGAIN</button></div>}
        </div>

        <div className={styles.instructions}>
          <div><b>01</b><span><strong>SHOW BOTH HANDS</strong><small>Keep your palms visible inside the frame.</small></span></div>
          <div><b>02</b><span><strong>REACH FOR A NOTE</strong><small>C, D, E, F, G, A and B orbit the center.</small></span></div>
          <div><b>03</b><span><strong>TAP DOWN TO PLAY</strong><small>Lift your finger, then strike again for the next bow.</small></span></div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>PRIVATE BY DESIGN · ALL HAND TRACKING HAPPENS ON YOUR DEVICE</span>
        <a href="https://instagram.com/hamedsamizadeh" target="_blank" rel="noreferrer">@hamedsamizadeh</a>
      </footer>
    </main>
  );
}
