"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";

const STARTER_CODE = `name = "SAMIZ AI"
print("Salam az", name)

for number in range(1, 6):
    print(number, "× 2 =", number * 2)`;

type RuntimeState = "loading" | "ready" | "running" | "error";
type OutputLine = { id: number; stream: "stdout" | "stderr" | "result"; message: string };

function BrandMark() {
  return (
    <span className="python-brand-mark" aria-hidden="true">
      <i>S</i>
      <b>AI</b>
    </span>
  );
}

export default function PythonLab() {
  const [code, setCode] = useState(STARTER_CODE);
  const [stdin, setStdin] = useState("");
  const [runtimeState, setRuntimeState] = useState<RuntimeState>("loading");
  const [pythonVersion, setPythonVersion] = useState("");
  const [output, setOutput] = useState<OutputLine[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const outputId = useRef(0);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  const appendOutput = useCallback((stream: OutputLine["stream"], message: string) => {
    setOutput((lines) => [
      ...lines,
      { id: outputId.current++, stream, message },
    ]);
  }, []);

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
        appendOutput(message.stream ?? "stdout", String(message.message ?? ""));
      } else if (message.type === "done") {
        setRuntimeState("ready");
      } else if (message.type === "error") {
        appendOutput("stderr", String(message.message ?? "خطای نامشخص"));
        setRuntimeState("ready");
      } else if (message.type === "fatal") {
        appendOutput("stderr", "محیط پایتون بارگذاری نشد. اتصال اینترنت را بررسی و دوباره تلاش کنید.");
        if (message.message) {
          appendOutput("stderr", `جزئیات فنی: ${String(message.message)}`);
        }
        setRuntimeState("error");
      }
    };

    worker.onerror = () => {
      appendOutput("stderr", "ارتباط با محیط اجرای پایتون قطع شد. دوباره تلاش کنید.");
      setRuntimeState("error");
    };

    worker.postMessage({ type: "init" });
  }, [appendOutput]);

  useEffect(() => {
    createWorker();
    return () => workerRef.current?.terminate();
  }, [createWorker]);

  const runCode = useCallback(() => {
    if (!workerRef.current || runtimeState !== "ready" || !code.trim()) return;
    outputId.current = 0;
    setOutput([]);
    setRuntimeState("running");
    workerRef.current.postMessage({ type: "run", code, stdin });
  }, [code, runtimeState, stdin]);

  const stopCode = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    appendOutput("stderr", "اجرای برنامه متوقف شد.");
    setRuntimeState("loading");
    setPythonVersion("");
    createWorker();
  };

  const resetEditor = () => {
    setCode(STARTER_CODE);
    setStdin("");
    setOutput([]);
    editorRef.current?.focus();
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      runCode();
      return;
    }

    if (event.key !== "Tab") return;
    event.preventDefault();
    const target = event.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const nextCode = `${code.slice(0, start)}    ${code.slice(end)}`;
    setCode(nextCode);
    requestAnimationFrame(() => {
      target.selectionStart = start + 4;
      target.selectionEnd = start + 4;
    });
  };

  const statusCopy = {
    loading: "در حال آماده‌سازی پایتون...",
    ready: "پایتون آماده است",
    running: "در حال اجرا...",
    error: "بارگذاری ناموفق",
  }[runtimeState];

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
          <h1>پایتون را همین‌جا بنویس و اجرا کن</h1>
          <p>
            کدت را در ادیتور بنویس، روی «اجرا» بزن و نتیجه را همان لحظه ببین.
            کدها داخل مرورگر خودت اجرا می‌شوند و جایی ذخیره نمی‌شوند.
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

      <section className="python-workspace" aria-label="محیط اجرای کد پایتون">
        <div className="python-editor-panel">
          <div className="python-panel-bar">
            <div className="python-window-dots" aria-hidden="true"><i /><i /><i /></div>
            <span className="python-file-name"><b>⌁</b> main.py</span>
            <button type="button" className="python-quiet-button" onClick={resetEditor}>بازنشانی نمونه</button>
          </div>

          <div className="python-editor-wrap">
            <div className="python-line-numbers" aria-hidden="true">
              {code.split("\n").map((_, index) => <span key={index}>{index + 1}</span>)}
            </div>
            <textarea
              ref={editorRef}
              className="python-code-editor"
              dir="ltr"
              lang="en"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              onKeyDown={handleEditorKeyDown}
              spellCheck={false}
              aria-label="ویرایشگر کد پایتون"
            />
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
                disabled={runtimeState !== "ready" || !code.trim()}
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
            <button type="button" className="python-quiet-button" onClick={() => setOutput([])}>پاک کردن</button>
          </div>
          <div className="python-console" dir="ltr" aria-live="polite" aria-label="خروجی اجرای پایتون">
            {output.length === 0 ? (
              <div className="python-console-empty">
                <span>Ready.</span>
                <p>بعد از اجرای کد، نتیجه اینجا نمایش داده می‌شود.</p>
              </div>
            ) : (
              output.map((line) => (
                <pre key={line.id} className={line.stream}>{line.message}</pre>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="python-help" aria-label="راهنمای استفاده">
        <article>
          <span>01</span>
          <div><h2>کدت را بنویس</h2><p>می‌توانی از متغیر، شرط، حلقه، تابع و دستور <code>print()</code> استفاده کنی.</p></div>
        </article>
        <article>
          <span>02</span>
          <div><h2>ورودی را اضافه کن</h2><p>اگر کدت <code>input()</code> دارد، مقدارها را به ترتیب و هرکدام در یک خط بنویس.</p></div>
        </article>
        <article>
          <span>03</span>
          <div><h2>نتیجه را ببین</h2><p>با دکمه اجرا یا میانبر صفحه‌کلید، خروجی و خطاهای احتمالی را مشاهده کن.</p></div>
        </article>
      </section>

      <footer className="python-lab-footer">
        <span>SAMIZ AI · PYTHON LAB</span>
        <p>برای اجرای بهتر، از نسخه جدید Chrome، Safari یا Firefox استفاده کن.</p>
      </footer>
    </main>
  );
}
