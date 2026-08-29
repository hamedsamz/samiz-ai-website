"use client";

import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { indentUnit } from "@codemirror/language";
import type { KeyboardEvent } from "react";

type PythonEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
};

export default function PythonEditor({ value, onChange, onRun }: PythonEditorProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      onRun();
    }
  };

  return (
    <div className="python-code-mirror" dir="ltr" onKeyDown={handleKeyDown}>
      <CodeMirror
        value={value}
        height="390px"
        theme="dark"
        extensions={[python(), indentUnit.of("    ")]}
        onChange={onChange}
        aria-label="ویرایشگر حرفه‌ای کد پایتون"
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          drawSelection: true,
          dropCursor: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
      />
    </div>
  );
}
