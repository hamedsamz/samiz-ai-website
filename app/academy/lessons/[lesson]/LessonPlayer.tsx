"use client";

import { useEffect, useRef, useState } from "react";

export function LessonPlayer({ source }: { source: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const player = video.current;
    if (!player) return;
    let disposed = false;
    let destroy: (() => void) | undefined;

    if (player.canPlayType("application/vnd.apple.mpegurl")) {
      player.src = source;
    } else {
      void import("hls.js").then(({ default: Hls }) => {
        if (disposed) return;
        if (!Hls.isSupported()) { setError(true); return; }
        const hls = new Hls({ maxBufferLength: 12, maxMaxBufferLength: 24 });
        destroy = () => hls.destroy();
        hls.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) setError(true); });
        hls.attachMedia(player);
        hls.loadSource(source);
      }).catch(() => { if (!disposed) setError(true); });
    }
    return () => {
      disposed = true;
      destroy?.();
      player.removeAttribute("src");
      player.load();
    };
  }, [source]);

  return <><video ref={video} controls playsInline preload="none" aria-label="پخش ویدیوی درس"
    onError={() => setError(true)} />
    {error && <p className="academy-error" role="alert">پخش ممکن نشد. اتصال اینترنت یا دسترسی به درس را بررسی کن و صفحه را دوباره باز کن.</p>}
  </>;
}
