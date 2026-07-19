"use client";

import { useEffect, useRef } from "react";
import { track } from "@vercel/analytics";

// Fires an analytics event exactly once on mount (e.g. checkout completed on
// the post-signup landing). Renders nothing.
export function TrackOnce({
  event,
  data,
}: {
  event: string;
  data?: Record<string, string | number>;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track(event, data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
