"use client";

import { useActionState, useState, type ReactNode } from "react";
import { editAcademy, unlockAdmin } from "./actions";

export function AdminForm({ children, operation, course, item, label }: {
  children?: ReactNode; operation: string; course?: string; item?: string; label: string;
}) {
  const [state, action, pending] = useActionState(operation === "unlock" ? unlockAdmin : editAcademy, {});
  const [copiedLink, setCopiedLink] = useState("");

  return <form className="academy-form" action={action}>
    <input type="hidden" name="operation" value={operation} />
    {course && <input type="hidden" name="course" value={course} />}
    {item && <input type="hidden" name="item" value={item} />}
    {children}
    <button className={`academy-button${children ? "" : " secondary"}`} disabled={pending}>{pending ? "در حال بررسی…" : label}</button>
    {state.error && <p className="academy-error" role="alert">{state.error}</p>}
    {state.message && <p className="academy-status" role="status">{state.message}</p>}
    {state.link && <div>
      <label>لینک یک‌بارمصرف<input dir="ltr" readOnly value={state.link} onFocus={event => event.target.select()} /></label>
      <button type="button" className="academy-button secondary" onClick={async () => {
        try { await navigator.clipboard.writeText(state.link!); setCopiedLink(state.link!); } catch { /* the link can be selected manually */ }
      }}>{copiedLink === state.link ? "کپی شد" : "کپی لینک دعوت"}</button>
    </div>}
  </form>;
}
