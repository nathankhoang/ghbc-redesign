"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateCardOnFile } from "@/app/actions/payment-method";

// Update the card on file via the Square Web Payments SDK — the card is
// tokenised in the browser; only the token reaches our server. Renders a
// notice instead when Square isn't configured.

const SQ_APP_ID = process.env.NEXT_PUBLIC_SQUARE_APP_ID ?? "";
const SQ_LOCATION_ID = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? "";
const SQ_ENABLED = Boolean(SQ_APP_ID && SQ_LOCATION_ID);
const SQ_SRC = SQ_APP_ID.startsWith("sandbox-")
  ? "https://sandbox.web.squarecdn.com/v1/square.js"
  : "https://web.squarecdn.com/v1/square.js";

export function UpdateCardForm() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cardRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!SQ_ENABLED) return;
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!(window as any).Square) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement("script");
            s.src = SQ_SRC;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error("Square SDK failed to load"));
            document.head.appendChild(s);
          });
        }
        if (cancelled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payments = (window as any).Square.payments(SQ_APP_ID, SQ_LOCATION_ID);
        const card = await payments.card();
        await card.attach("#update-card-container");
        cardRef.current = card;
        setReady(true);
      } catch {
        setMsg({ kind: "err", text: "Card form failed to load — refresh and try again." });
      }
    })();
    return () => {
      cancelled = true;
      cardRef.current?.destroy?.();
    };
  }, []);

  async function submit() {
    if (busy) return;
    setMsg(null);
    setBusy(true);
    try {
      let token = "demo-token";
      if (SQ_ENABLED) {
        const result = await cardRef.current?.tokenize();
        if (result?.status !== "OK" || !result.token) {
          throw new Error(result?.errors?.[0]?.message ?? "Check your card details.");
        }
        token = result.token;
      }
      const res = await updateCardOnFile(token);
      if (!res.ok) throw new Error(res.error);
      setMsg({ kind: "ok", text: res.info ?? "Card updated." });
      router.refresh();
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="payment" className="rounded-3xl border border-oxblood-600/50 bg-oxblood/25 p-6">
      <h2 className="font-poster text-2xl text-bone">Payment method</h2>
      <p className="mt-1 text-sm text-cream/60">
        Update the card your membership charges. Stored securely by Square — we never see
        your card number.
      </p>
      {SQ_ENABLED ? (
        <>
          <div id="update-card-container" className="mt-4 rounded-xl bg-white/95 p-2" />
          <button
            type="button"
            onClick={submit}
            disabled={busy || !ready}
            className="font-condensed mt-3 w-full rounded-full bg-gold py-3 text-sm font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save new card"}
          </button>
        </>
      ) : (
        <p className="mt-4 rounded-xl border border-oxblood-600/50 bg-ink/40 px-4 py-3 text-sm text-cream/55">
          Card updates go live once Square is connected. Need to change your card now?
          Call the gym and we&apos;ll take care of it.
        </p>
      )}
      {msg && (
        <p className={`mt-3 text-sm ${msg.kind === "ok" ? "text-gold" : "text-blood"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
