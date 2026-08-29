import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v314.0.6/full/pyodide.mjs";

const PYODIDE_BASE_URL = "https://cdn.jsdelivr.net/pyodide/v314.0.6/full/";
const PACKAGE_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/;

const RICH_OUTPUT_SCRIPT = String.raw`
import base64 as _samiz_base64
import io as _samiz_io
import json as _samiz_json
import sys as _samiz_sys
import warnings as _samiz_warnings

_samiz_outputs = []
_samiz_value = globals().get("__samiz_last_result", None)

def _samiz_image_payload(image, title):
    buffer = _samiz_io.BytesIO()
    image.save(buffer, format="PNG")
    return {
        "type": "image",
        "title": title,
        "data": "data:image/png;base64," + _samiz_base64.b64encode(buffer.getvalue()).decode("ascii"),
        "width": int(getattr(image, "width", 900)),
        "height": int(getattr(image, "height", 520)),
    }

if _samiz_value is not None:
    _samiz_module = type(_samiz_value).__module__
    _samiz_name = type(_samiz_value).__name__

    if _samiz_module.startswith("pandas") and _samiz_name in ("DataFrame", "Series"):
        _samiz_frame = _samiz_value.to_frame() if _samiz_name == "Series" else _samiz_value
        _samiz_rows = []
        for _samiz_row in _samiz_frame.head(100).itertuples(index=False, name=None):
            _samiz_rows.append([str(cell) for cell in _samiz_row])
        _samiz_outputs.append({
            "type": "table",
            "title": "خروجی Pandas",
            "columns": [str(column) for column in _samiz_frame.columns],
            "rows": _samiz_rows,
            "truncated": len(_samiz_frame) > 100,
        })
    elif _samiz_module.startswith("PIL") and hasattr(_samiz_value, "save"):
        _samiz_outputs.append(_samiz_image_payload(_samiz_value, "خروجی Pillow"))

if "matplotlib.pyplot" in _samiz_sys.modules:
    import matplotlib.pyplot as _samiz_plt
    for _samiz_figure_number in _samiz_plt.get_fignums():
        _samiz_figure = _samiz_plt.figure(_samiz_figure_number)
        _samiz_buffer = _samiz_io.BytesIO()
        with _samiz_warnings.catch_warnings():
            _samiz_warnings.simplefilter("ignore")
            _samiz_figure.savefig(_samiz_buffer, format="png", dpi=130, bbox_inches="tight")
        _samiz_width, _samiz_height = _samiz_figure.get_size_inches() * 130
        _samiz_outputs.append({
            "type": "image",
            "title": "نمودار Matplotlib",
            "data": "data:image/png;base64," + _samiz_base64.b64encode(_samiz_buffer.getvalue()).decode("ascii"),
            "width": int(_samiz_width),
            "height": int(_samiz_height),
        })
        _samiz_plt.close(_samiz_figure)

_samiz_json.dumps(_samiz_outputs, ensure_ascii=False)
`;

let pyodide = null;
let pyodidePromise = null;
let inputLines = [];

function send(type, payload = {}) {
  self.postMessage({ type, ...payload });
}

function messageFromError(error) {
  return error instanceof Error ? error.message : String(error);
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
    send("fatal", { message: messageFromError(error) });
    throw error;
  });

  return pyodidePromise;
}

async function installPackage(request) {
  const runtime = await initializePyodide();
  const name = String(request.name ?? "").trim();
  const packageName = String(request.packageName ?? name).trim();
  const source = request.source === "pypi" ? "pypi" : "pyodide";

  if (!PACKAGE_NAME_PATTERN.test(packageName)) {
    throw new Error("نام کتابخانه معتبر نیست.");
  }

  send("package-status", { name, status: "loading" });

  try {
    if (source === "pypi") {
      await runtime.loadPackage("micropip");
      const micropip = runtime.pyimport("micropip");
      try {
        await micropip.install(packageName);
      } finally {
        micropip.destroy();
      }
    } else {
      await runtime.loadPackage(packageName);
    }

    send("package-status", { name, status: "ready" });
  } catch (error) {
    send("package-status", {
      name,
      status: "error",
      message: messageFromError(error),
    });
  }
}

async function runCode(code, stdin) {
  const runtime = await initializePyodide();
  inputLines = String(stdin).split(/\r?\n/);
  if (inputLines.length === 1 && inputLines[0] === "") inputLines = [];

  send("status", { status: "running" });
  const startedAt = performance.now();
  await runtime.loadPackagesFromImports(code);
  const result = await runtime.runPythonAsync(code);

  let richOutputs = [];
  try {
    if (result !== undefined && result !== null) {
      runtime.globals.set("__samiz_last_result", result);
    } else {
      runtime.runPython("globals().pop('__samiz_last_result', None)");
    }

    richOutputs = JSON.parse(runtime.runPython(RICH_OUTPUT_SCRIPT));
    for (const output of richOutputs) {
      send("rich-output", { output });
    }

    if (richOutputs.length === 0 && result !== undefined && result !== null) {
      const resultText = String(result);
      if (resultText && resultText !== "None") {
        send("output", { stream: "result", message: resultText });
      }
    }
  } finally {
    runtime.runPython("globals().pop('__samiz_last_result', None)");
    if (result && typeof result.destroy === "function") result.destroy();
  }

  send("done", { durationMs: Math.round(performance.now() - startedAt) });
}

self.onmessage = async (event) => {
  const { type, code = "", stdin = "", package: packageRequest } = event.data ?? {};

  if (type === "init") {
    try {
      await initializePyodide();
    } catch {
      // The fatal message above contains the user-facing error.
    }
    return;
  }

  if (type === "install-package") {
    try {
      await installPackage(packageRequest ?? {});
    } catch (error) {
      send("package-status", {
        name: String(packageRequest?.name ?? ""),
        status: "error",
        message: messageFromError(error),
      });
    }
    return;
  }

  if (type !== "run") return;

  try {
    await runCode(String(code), String(stdin));
  } catch (error) {
    send("error", { message: messageFromError(error) });
  }
};
