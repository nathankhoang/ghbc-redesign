"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";
import type { ComponentProps } from "react";

// Link that fires a Vercel Analytics event on click — used on funnel CTAs
// ($99 join buttons, trial buttons) so the owner can see the funnel working.
export function TrackLink({
  event,
  data,
  ...props
}: ComponentProps<typeof Link> & {
  event: string;
  data?: Record<string, string | number>;
}) {
  return <Link {...props} onClick={() => track(event, data)} />;
}
