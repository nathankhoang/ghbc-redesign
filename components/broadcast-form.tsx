"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { sendAnnouncement, type ActionState } from "@/app/actions/announcements";

const field =
  "w-full rounded-xl border border-oxblood-600/60 bg-ink/60 px-4 py-3 text-cream placeholder:text-cream/35 focus:border-gold focus:outline-none";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-condensed rounded-full bg-gold px-6 py-3 text-sm font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send to all members"}
    </button>
  );
}

function Msg({ state }: { state: ActionState }) {
  if (!state) return null;
  if (state.error) return <span className="text-sm text-blood">{state.error}</span>;
  if (state.ok) return <span className="text-sm text-gold">{state.ok}</span>;
  return null;
}

export function BroadcastForm() {
  const [state, action] = useActionState(sendAnnouncement, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the textarea once a broadcast goes out.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <section className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-6 sm:p-8">
      <p className="font-condensed text-sm tracking-[0.3em] text-gold uppercase">
        Broadcast
      </p>
      <h2 className="font-poster mt-1 text-2xl text-bone">Message all members</h2>
      <p className="mt-2 text-sm text-cream/60">
        Your note pops up on every member&apos;s dashboard the next time they visit,
        signed with your name.
      </p>

      <form ref={formRef} action={action} className="mt-5 grid gap-3">
        <textarea
          name="message"
          rows={4}
          required
          placeholder="Message all members…"
          className={`${field} resize-none`}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Submit />
          <Msg state={state} />
        </div>
      </form>
    </section>
  );
}
