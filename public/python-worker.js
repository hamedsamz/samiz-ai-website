import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v314.0.6/full/pyodide.mjs";

const PYODIDE_BASE_URL = "https://cdn.jsdelivr.net/pyodide/v314.0.6/full/";

let pyodide = null;
let pyodidePromise = null;
let inputLines = [];

function send(type, payload = {}) {
  self.postMessage({ type, ...payload });
}

async function initializePyodide() {
  if (pyodide) return pyodide;
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = (async () => {
    send("status", { status: "loading" });
    const runtime = await loadPyodide({
      indexURL: PYODIDE_BASE_URL,
      stdout: (message) => send("output", { stream: "stdout", message }),
      stderr: (message) => send("output", { stream: "stderr", message }),
    });

    runtime.setStdin({
      stdin: () => inputLines.shift() ?? null,
      isatty: false,
    });

    runtime.setStdout({
      batched: (message) => send("output", { stream: "stdout", message }),
    });

    runtime.setStderr({
      batched: (message) => send("output", { stream: "stderr", message }),
    });

    pyodide = runtime;
    send("ready", { version: runtime.version });
    return runtime;
  })().catch((error) => {
    pyodidePromise = null;
    send("fatal", {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  });

  return pyodidePromise;
}

self.onmessage = async (event) => {
  const { type, code = "", stdin = "" } = event.data ?? {};

  if (type === "init") {
    try {
      await initializePyodide();
    } catch {
      // The fatal message above contains the user-facing error.
    }
    return;
  }

  if (type !== "run") return;

  try {
    const runtime = await initializePyodide();
    inputLines = String(stdin).split(/\r?\n/);
    if (inputLines.length === 1 && inputLines[0] === "") inputLines = [];

    send("status", { status: "running" });
    await runtime.loadPackagesFromImports(code);
    const result = await runtime.runPythonAsync(code);

    if (result !== undefined && result !== null) {
      const resultText = String(result);
      if (resultText && resultText !== "None") {
        send("output", { stream: "result", message: resultText });
      }
      if (typeof result.destroy === "function") result.destroy();
    }

    send("done");
  } catch (error) {
    send("error", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
