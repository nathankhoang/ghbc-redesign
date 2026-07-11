"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateCoachProfile } from "@/app/actions/coach";

const field =
  "w-full rounded-xl border border-oxblood-600/60 bg-ink/60 px-4 py-3 text-cream placeholder:text-cream/35 focus:border-gold focus:outline-none";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-condensed rounded-full bg-gold px-7 py-3 text-sm font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save profile"}
    </button>
  );
}

export function CoachProfileForm({ name, bio }: { name: string; bio: string }) {
  const [state, action] = useActionState(updateCoachProfile, undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-6 sm:p-8">
      <h2 className="font-poster mb-5 text-3xl text-bone">Your coach profile</h2>
      <form action={action} className="grid gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-oxblood-600/60 bg-ink/60 text-cream/40 transition-colors hover:border-gold"
            aria-label="Change profile picture"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Preview" className="size-full object-cover" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-sm text-gold underline underline-offset-4"
          >
            {preview ? "Change photo" : "Add / change photo"}
          </button>
          <input
            ref={inputRef}
            type="file"
            name="image"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
        </div>

        <label className="grid gap-1.5 text-sm">
          <span className="font-condensed tracking-widest text-cream/70 uppercase">
            Display name
          </span>
          <input name="name" defaultValue={name} required className={field} />
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-condensed tracking-widest text-cream/70 uppercase">
            Bio <span className="text-cream/40 normal-case">(shown to members)</span>
          </span>
          <textarea
            name="bio"
            defaultValue={bio}
            rows={3}
            placeholder="A short intro — your background, style, what members can expect."
            className={field}
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <Submit />
          {state?.error && <span className="text-sm text-blood">{state.error}</span>}
          {state?.ok && <span className="text-sm text-gold">{state.ok}</span>}
        </div>
      </form>
    </section>
  );
}
