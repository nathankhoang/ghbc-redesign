"use client";

import Script from "next/script";

// Cloudflare Turnstile challenge. Renders only when a site key is configured
// (NEXT_PUBLIC_TURNSTILE_SITE_KEY). In implicit mode Turnstile injects a hidden
// `cf-turnstile-response` input into the surrounding <form>, which the signup /
// login server actions verify. Renders nothing (and the server skips the check)
// when the key isn't set, so local dev works before Turnstile is wired up.
export function TurnstileWidget() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  return (
    <div className="flex justify-center">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />
      {/* dark theme to sit on the oxblood ground */}
      <div className="cf-turnstile" data-sitekey={siteKey} data-theme="dark" />
    </div>
  );
}
