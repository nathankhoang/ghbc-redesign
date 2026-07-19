"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  changeAvatar,
  changeEmail,
  changePassword,
  changePhone,
  type ActionState,
} from "@/app/actions/account";

const field =
  "w-full rounded-xl border border-oxblood-600/60 bg-ink/60 px-4 py-3 text-white placeholder:text-cream/35 focus:border-gold focus:outline-none";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-condensed rounded-full bg-gold px-7 py-3 text-sm font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

function Msg({ state }: { state: ActionState }) {
  if (!state) return null;
  if (state.error) return <span className="text-sm text-blood">{state.error}</span>;
  if (state.ok) return <span className="text-sm text-gold">{state.ok}</span>;
  return null;
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-6 sm:p-8">
      <h2 className="font-poster mb-5 text-2xl text-bone">{title}</h2>
      {children}
    </section>
  );
}

export function AvatarForm({
  firstName,
  image,
}: {
  firstName: string;
  image: string | null;
}) {
  const [state, action] = useActionState(changeAvatar, undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shown = preview ?? image;

  return (
    <Card title="Profile picture">
      <form action={action} className="flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-oxblood-600/60 bg-ink/60 text-cream/40 transition-colors hover:border-gold"
          aria-label="Change profile picture"
        >
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="Preview" className="size-full object-cover" />
          ) : (
            <span className="font-poster text-3xl text-cream/50">
              {firstName.charAt(0).toUpperCase()}
            </span>
          )}
        </button>
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-left text-sm text-gold underline underline-offset-4"
          >
            Choose a photo
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <Submit label="Save photo" />
            <Msg state={state} />
          </div>
        </div>
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
      </form>
    </Card>
  );
}

export function EmailForm({ email }: { email: string }) {
  const [state, action] = useActionState(changeEmail, undefined);
  return (
    <Card title="Email address">
      <form action={action} className="grid gap-3">
        <input type="email" name="email" defaultValue={email} required className={field} />
        <div className="flex flex-wrap items-center gap-3">
          <Submit label="Update email" />
          <Msg state={state} />
        </div>
      </form>
    </Card>
  );
}

export function PhoneForm({ phone }: { phone: string | null }) {
  const [state, action] = useActionState(changePhone, undefined);
  return (
    <Card title="Phone number">
      <form action={action} className="grid gap-3">
        <input
          type="tel"
          name="phone"
          defaultValue={phone ?? ""}
          placeholder="Phone number"
          autoComplete="tel"
          required
          className={field}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Submit label="Update phone" />
          <Msg state={state} />
        </div>
      </form>
    </Card>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, undefined);
  return (
    <Card title="Password">
      <form action={action} className="grid gap-3">
        <input
          type="password"
          name="current"
          placeholder="Current password"
          autoComplete="current-password"
          required
          className={field}
        />
        <input
          type="password"
          name="next"
          placeholder="New password (min 8)"
          autoComplete="new-password"
          minLength={8}
          required
          className={field}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Submit label="Change password" />
          <Msg state={state} />
        </div>
      </form>
    </Card>
  );
}
