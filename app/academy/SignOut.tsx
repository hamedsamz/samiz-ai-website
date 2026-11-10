"use client";

import { createAuthClient } from "better-auth/react";
import { useState } from "react";

const auth = createAuthClient();

export function SignOut() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  return <div>
    <button className="academy-button secondary" disabled={pending} onClick={async () => {
      setPending(true);
      setError(false);
      try {
        const result = await auth.signOut();
        if (result.error) throw new Error("Sign-out failed");
        window.location.replace("/academy/sign-in");
      } catch {
        setError(true);
        setPending(false);
      }
    }}>خروج از حساب</button>
    {error && <p className="academy-error" role="alert">خروج انجام نشد. دوباره تلاش کن.</p>}
  </div>;
}
