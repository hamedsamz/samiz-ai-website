"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import RichOutput, { type OutputItem } from "./RichOutput";
import { PYTHON_SAMPLES, STARTER_SAMPLE } from "./samples";

const PythonEditor = dynamic(() => import("./PythonEditor"), {
  ssr: false,
  loading: () => <div className="python-editor-loading">در حال آماده‌سازی ادیتور...</div>,
});

const STORAGE_KEY = "samiz-python-lab:v1";
const MAX_FILE_SIZE = 200_000;

const LIBRARIES = [
  { name: "numpy", label: "NumPy", packageName: "numpy" },
  { name: "pandas", label: "Pandas", packageName: "pandas" },
  { name: "matplotlib", label: "Matplotlib", packageName: "matplotlib" },
  { name: "scipy", label: "SciPy", packageName: "scipy" },
  { name: "scikit-learn", label: "Scikit-learn", packageName: "scikit-learn" },
  { name: "pillow", label: "Pillow", packageName: "pillow" },
] as const;

type RuntimeState = "loading" | "ready" | "running" | "error";
type PackageState = "idle" | "loading" | "ready" | "error";

type PersistedLab = {
  version: 1;
  code: string;
  stdin: string;
  updatedAt: number;
};

function BrandMark() {
  return (
    <span className="python-brand-mark" aria-hidden="true">
      <i>S</i>
      <b>AI</b>
    </span>
  );
}

function encodeSharedCode(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decodeSharedCode(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export default function PythonLab() {
  const [code, setCode] = useState(STARTER_SAMPLE.code);
  const [stdin, setStdin] = useState(STARTER_SAMPLE.stdin ?? "");
  const [selectedSample, setSelectedSample] = useState(STARTER_SAMPLE.id);
  const [runtimeState, setRuntimeState] = useState<RuntimeState>("loading");
  const [pythonVersion, setPythonVersion] = useState("");
  const [output, setOutput] = useState<OutputItem[]>([]);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [packageStates, setPackageStates] = useState<Record<string, PackageState>>({});
  const [packageErrors, setPackageErrors] = useState<Record<string, string>>({});
  const [customPackage, setCustomPackage] = useState("");
  const [saveState, setSaveState] = useState("ذخیره خودکار فعال است");
  const [notice, setNotice] = useState("");
  const [hasRestored, setHasRestored] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const outputId = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setNotice(""), 3000);
  }, []);

  const appendTextOutput = useCallback(
    (stream: "stdout" | "stderr" | "result", message: string) => {
      setOutput((items) => [
        ...items,
        { id: outputId.current++, type: "text", stream, message },
      ]);
    },
    [],
  );

  const createWorker = useCallback(() => {
    workerRef.current?.terminate();

    const worker = new Worker("/python-worker.js", { type: "module" });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent) => {
      const message = event.data ?? {};

      if (message.type === "ready") {
        setPythonVersion(message.version ?? "");
        setRuntimeState("ready");
      } else if (message.type === "status") {
        setRuntimeState(message.status === "running" ? "running" : "loading");
      } else if (message.type === "output") {
        appendTextOutput(message.stream ?? "stdout", String(message.message ?? ""));
      } else if (message.type === "rich-output") {
        setOutput((items) => [
          ...items,
          { id: outputId.current++, ...message.output } as OutputItem,
        ]);
      } else if (message.type === "done") {
        setDurationMs(Number(message.durationMs ?? 0));
        setRuntimeState("ready");
      } else if (message.type === "error") {
        appendTextOutput("stderr", String(message.message ?? "خطای نامشخص"));
        setRuntimeState("ready");
      } else if (message.type === "package-status") {
        const name = String(message.name ?? "");
        const status = message.status as PackageState;
        setPackageStates((states) => ({ ...states, [name]: status }));
        if (status === "error") {
          setPackageErrors((errors) => ({
            ...errors,
            [name]: String(message.message ?? "این کتابخانه پشتیبانی نمی‌شود."),
          }));
        } else if (status === "ready") {
          setPackageErrors((errors) => {
            const nextErrors = { ...errors };
            delete nextErrors[name];
            return nextErrors;
          });
        }
      } else if (message.type === "fatal") {
        appendTextOutput("stderr", "محیط پایتون بارگذاری نشد. اتصال اینترنت را بررسی و دوباره تلاش کنید.");
        if (message.message) appendTextOutput("stderr", `جزئیات فنی: ${String(message.message)}`);
        setRuntimeState("error");
      }
    };

    worker.onerror = () => {
      appendTextOutput("stderr", "ارتباط با محیط اجرای پایتون قطع شد. دوباره تلاش کنید.");
      setRuntimeState("error");
    };

    worker.postMessage({ type: "init" });
  }, [appendTextOutput]);

  useEffect(() => {
    createWorker();
    return () => {
      workerRef.current?.terminate();
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, [createWorker]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const sharedCode = window.location.hash.startsWith("#code=")
          ? window.location.hash.slice(6)
          : "";

        if (sharedCode) {
          setCode(decodeSharedCode(sharedCode));
          setSelectedSample("");
          showNotice("کد اشتراکی باز شد");
        } else {
          const saved = window.localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved) as PersistedLab;
            if (parsed.version === 1 && typeof parsed.code === "string") {
              setCode(parsed.code);
              setStdin(typeof parsed.stdin === "string" ? parsed.stdin : "");
              setSelectedSample("");
              setSaveState("آخرین کد بازیابی شد");
            }
          }
        }
      } catch {
        setSaveState("ذخیره خودکار در دسترس نیست");
      } finally {
        setHasRestored(true);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [showNotice]);

  useEffect(() => {
    if (!hasRestored) return;
    const timer = setTimeout(() => {
      try {
        const payload: PersistedLab = { version: 1, code, stdin, updatedAt: Date.now() };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setSaveState("ذخیره شد روی این دستگاه");
      } catch {
        setSaveState("ذخیره خودکار در دسترس نیست");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [code, hasRestored, stdin]);

  const runCode = useCallback(() => {
    if (!workerRef.current || runtimeState !== "ready" || !code.trim()) return;
    outputId.current = 0;
    setOutput([]);
    setDurationMs(null);
    setRuntimeState("running");
    workerRef.current.postMessage({ type: "run", code, stdin });
  }, [code, runtimeState, stdin]);

  const stopCode = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setPackageStates({});
    setPackageErrors({});
    appendTextOutput("stderr", "اجرای برنامه متوقف شد.");
    setRuntimeState("loading");
    setPythonVersion("");
    createWorker();
  };

  const applySample = (sampleId: string) => {
    const sample = PYTHON_SAMPLES.find((item) => item.id === sampleId);
    if (!sample) return;
    setSelectedSample(sample.id);
    setCode(sample.code);
    setStdin(sample.stdin ?? "");
    setOutput([]);
    setDurationMs(null);
    showNotice(`نمونه «${sample.title}» آماده شد`);
  };

  const installLibrary = (request: {
    name: string;
    packageName: string;
    source?: "pyodide" | "pypi";
  }) => {
    if (!workerRef.current || runtimeState !== "ready") return;
    setPackageStates((states) => ({ ...states, [request.name]: "loading" }));
    workerRef.current.postMessage({ type: "install-package", package: request });
  };

  const installCustomPackage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const packageName = customPackage.trim();
    if (!packageName) return;
    installLibrary({ name: packageName, packageName, source: "pypi" });
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      showNotice("کد کپی شد");
    } catch {
      showNotice("امکان کپی خودکار وجود ندارد");
    }
  };

  const shareCode = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#code=${encodeSharedCode(code)}`;
      await navigator.clipboard.writeText(url);
      showNotice("لینک اشتراک‌گذاری کپی شد");
    } catch {
      showNotice("ساخت لینک اشتراک‌گذاری ناموفق بود");
    }
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: "text/x-python;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "main.py";
    anchor.click();
    URL.revokeObjectURL(url);
    showNotice("فایل main.py دانلود شد");
  };

  const uploadCode = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      showNotice("حجم فایل باید کمتر از ۲۰۰ کیلوبایت باشد");
      return;
    }
    const uploadedCode = await file.text();
    setCode(uploadedCode);
    setSelectedSample("");
    showNotice(`فایل ${file.name} باز شد`);
  };

  const statusCopy = {
    loading: "در حال آماده‌سازی پایتون...",
    ready: "پایتون آماده است",
    running: "در حال اجرا...",
    error: "بارگذاری ناموفق",
  }[runtimeState];

  const packageIsLoading = Object.values(packageStates).includes("loading");

  return (
    <main className="python-lab-page fa" dir="rtl">
      <header className="python-lab-header">
        <Link className="python-lab-brand" href="/" aria-label="بازگشت به صفحه اصلی SAMIZ AI">
          <BrandMark />
          <span>SAMIZ AI</span>
        </Link>
        <Link className="python-back-link" href="/">
          <span aria-hidden="true">←</span>
          بازگشت به سایت
        </Link>
      </header>

      <section className="python-lab-intro">
        <div>
          <p className="python-kicker">SAMIZ AI · PYTHON LAB</p>
          <h1>آزمایشگاه کامل پایتون در مرورگر</h1>
          <p>
            از نمونه‌های آماده شروع کن، کتابخانه‌ها را بارگذاری کن و نتیجه متنی، جدول، نمودار یا تصویر را همان لحظه ببین.
            کدت به‌صورت خودکار روی همین دستگاه ذخیره می‌شود.
          </p>
        </div>
        <div className={`python-runtime-status ${runtimeState}`} role="status" aria-live="polite">
          <span className="python-status-dot" />
          <div>
            <strong>{statusCopy}</strong>
            <small>{pythonVersion ? `Python ${pythonVersion}` : "اولین بار چند لحظه زمان می‌برد"}</small>
          </div>
        </div>
      </section>

      <section className="python-lab-tools" aria-label="ابزارهای آزمایشگاه پایتون">
        <div className="python-tool-card python-sample-tool">
          <span className="python-tool-icon" aria-hidden="true">01</span>
          <label htmlFor="python-sample-select">
            <strong>نمونه‌های آماده</strong>
            <small>برای شروع یک نمونه انتخاب کن</small>
          </label>
          <select
            id="python-sample-select"
            value={selectedSample}
            onChange={(event) => applySample(event.target.value)}
          >
            <option value="" disabled>انتخاب نمونه</option>
            {["مقدماتی", "پروژه کوچک", "کتابخانه‌ها"].map((category) => (
              <optgroup key={category} label={category}>
                {PYTHON_SAMPLES.filter((sample) => sample.category === category).map((sample) => (
                  <option key={sample.id} value={sample.id}>{sample.title} — {sample.description}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <details className="python-tool-card python-library-tool">
          <summary>
            <span className="python-tool-icon" aria-hidden="true">02</span>
            <span><strong>مدیریت کتابخانه‌ها</strong><small>کتابخانه‌های محبوب یا پکیج PyPI</small></span>
            <i aria-hidden="true">⌄</i>
          </summary>
          <div className="python-library-panel">
            <div className="python-library-list">
              {LIBRARIES.map((library) => {
                const state = packageStates[library.name] ?? "idle";
                return (
                  <button
                    key={library.name}
                    type="button"
                    className={state}
                    disabled={runtimeState !== "ready" || state === "loading"}
                    onClick={() => installLibrary(library)}
                    title={packageErrors[library.name]}
                  >
                    <span>{library.label}</span>
                    <small>{state === "loading" ? "در حال بارگذاری" : state === "ready" ? "آماده ✓" : state === "error" ? "ناموفق" : "بارگذاری"}</small>
                  </button>
                );
              })}
            </div>
            <form className="python-custom-package" onSubmit={installCustomPackage}>
              <label htmlFor="python-package-name">پکیج Pure Python از PyPI</label>
              <div>
                <input
                  id="python-package-name"
                  dir="ltr"
                  value={customPackage}
                  onChange={(event) => setCustomPackage(event.target.value)}
                  placeholder="مثلاً snowballstemmer"
                  pattern="[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}"
                />
                <button type="submit" disabled={runtimeState !== "ready" || !customPackage.trim()}>نصب</button>
              </div>
              {packageErrors[customPackage.trim()] ? <small className="error">{packageErrors[customPackage.trim()]}</small> : null}
            </form>
          </div>
        </details>

        <div className="python-tool-card python-file-tool">
          <span className="python-tool-icon" aria-hidden="true">03</span>
          <div>
            <strong>فایل و اشتراک‌گذاری</strong>
            <small>{saveState}</small>
          </div>
          <div className="python-file-actions">
            <button type="button" onClick={copyCode}>کپی</button>
            <button type="button" onClick={shareCode}>اشتراک</button>
            <button type="button" onClick={downloadCode}>دانلود</button>
            <button type="button" onClick={() => fileInputRef.current?.click()}>باز کردن فایل</button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".py,text/x-python,text/plain"
              onChange={uploadCode}
              hidden
            />
          </div>
        </div>
      </section>

      {notice ? <div className="python-notice" role="status">{notice}</div> : null}

      <section className="python-workspace" aria-label="محیط اجرای کد پایتون">
        <div className="python-editor-panel">
          <div className="python-panel-bar">
            <div className="python-window-dots" aria-hidden="true"><i /><i /><i /></div>
            <span className="python-file-name"><b>⌁</b> main.py</span>
            <button type="button" className="python-quiet-button" onClick={() => applySample(selectedSample || STARTER_SAMPLE.id)}>
              بازنشانی نمونه
            </button>
          </div>

          <div className="python-editor-wrap">
            <PythonEditor value={code} onChange={(value) => { setCode(value); setSelectedSample(""); }} onRun={runCode} />
          </div>

          <div className="python-input-row">
            <label htmlFor="python-stdin">ورودی برنامه <small>اختیاری؛ هر مقدار در یک خط</small></label>
            <textarea
              id="python-stdin"
              dir="ltr"
              value={stdin}
              onChange={(event) => setStdin(event.target.value)}
              placeholder={"مثلاً برای دو input():\nHamed\n32"}
              spellCheck={false}
            />
          </div>

          <div className="python-action-row">
            {runtimeState === "running" ? (
              <button type="button" className="python-stop-button" onClick={stopCode}>
                <span aria-hidden="true">■</span> توقف
              </button>
            ) : (
              <button
                type="button"
                className="python-run-button"
                onClick={runCode}
                disabled={runtimeState !== "ready" || packageIsLoading || !code.trim()}
              >
                <span aria-hidden="true">▶</span> اجرای کد
              </button>
            )}
            <span className="python-shortcut">⌘ / Ctrl + Enter</span>
          </div>
        </div>

        <div className="python-output-panel">
          <div className="python-panel-bar">
            <span className="python-output-title"><i aria-hidden="true">›_</i> خروجی برنامه</span>
            <div className="python-output-actions">
              {durationMs !== null ? <span>{durationMs.toLocaleString("fa-IR")} ms</span> : null}
              <button type="button" className="python-quiet-button" onClick={() => setOutput([])}>پاک کردن</button>
            </div>
          </div>
          <div className="python-console" dir="ltr" aria-live="polite" aria-label="خروجی اجرای پایتون">
            {output.length === 0 ? (
              <div className="python-console-empty">
                <span>Ready.</span>
                <p>متن، جدول، نمودار یا تصویر خروجی اینجا نمایش داده می‌شود.</p>
              </div>
            ) : (
              output.map((item) => <RichOutput key={item.id} item={item} />)
            )}
          </div>
        </div>
      </section>

      <section className="python-help" aria-label="راهنمای استفاده">
        <article><span>01</span><div><h2>از نمونه شروع کن</h2><p>نمونه‌های مقدماتی، پروژه‌های کوچک و مثال‌های کتابخانه‌ای آماده‌اند.</p></div></article>
        <article><span>02</span><div><h2>کتابخانه اضافه کن</h2><p>کتابخانه‌های محبوب را بارگذاری کن یا یک پکیج Pure Python از PyPI نصب کن.</p></div></article>
        <article><span>03</span><div><h2>خروجی واقعی ببین</h2><p>جدول Pandas، نمودار Matplotlib و تصویر Pillow مستقیم نمایش داده می‌شوند.</p></div></article>
        <article><span>04</span><div><h2>کدت را نگه دار</h2><p>ذخیره خودکار، دانلود فایل، آپلود، کپی و لینک اشتراک‌گذاری در دسترس است.</p></div></article>
      </section>

      <footer className="python-lab-footer">
        <span>SAMIZ AI · PYTHON LAB</span>
        <p>اجرای کد و ذخیره پروژه داخل مرورگر شما انجام می‌شود.</p>
      </footer>
    </main>
  );
}
