"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  pauseMembership,
  resumeMembership,
  cancelMembership,
  resendClaimLink,
  setClassCountAdjustment,
  redeemMilestone,
  type AdminResult,
} from "@/app/actions/members-admin";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

const field =
  "w-full rounded-xl border border-oxblood-600/60 bg-ink/60 px-4 py-2.5 text-cream placeholder:text-cream/35 focus:border-gold focus:outline-none";

export type ManagerMilestone = {
  milestone: number;
  reachedAt: string;
  redeemedAt: string | null;
};

export type ManagerMember = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  plan: string;
  status: string; // active | past_due | paused | cancelled | pending_claim | expired
  classCount: number;
  classCountAdjust: number;
  hasSquareSubscription: boolean;
  milestones: ManagerMilestone[];
};

const STATUS_META: Record<string, { label: string; text: string; bg: string }> = {
  active: { label: "Active", text: "text-gold", bg: "bg-gold/15" },
  past_due: { label: "Past due", text: "text-blood", bg: "bg-blood/15" },
  paused: { label: "Paused", text: "text-bronze", bg: "bg-bronze/15" },
  pending_claim: { label: "Pending claim", text: "text-cream/60", bg: "bg-cream/10" },
  cancelled: { label: "Cancelled", text: "text-stone-400", bg: "bg-stone-400/15" },
  expired: { label: "Expired", text: "text-stone-400", bg: "bg-stone-400/15" },
};

const INACTIVE_STATUSES = new Set(["paused", "cancelled", "past_due", "pending_claim"]);

type Filter = "all" | "active" | "inactive";

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, text: "text-cream/60", bg: "bg-cream/10" };
  return (
    <span
      className={`font-condensed shrink-0 rounded-full px-2.5 py-0.5 text-[11px] tracking-widest uppercase ${meta.bg} ${meta.text}`}
    >
      {meta.label}
    </span>
  );
}

function ContactModal({
  member,
  onClose,
}: {
  member: ManagerMember;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-oxblood-600/60 bg-oxblood/40 p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-poster text-2xl text-bone">{member.name}</h3>
        <div className="mt-5 grid gap-3">
          <a
            href={`mailto:${member.email}`}
            className="font-condensed flex items-center justify-between rounded-2xl border border-oxblood-600/50 px-4 py-3 text-sm tracking-wide text-cream transition-colors hover:border-gold hover:text-gold"
          >
            <span className="truncate">{member.email}</span>
            <span className="shrink-0 uppercase text-gold">Email</span>
          </a>
          {member.phone ? (
            <a
              href={`tel:${member.phone}`}
              className="font-condensed flex items-center justify-between rounded-2xl border border-oxblood-600/50 px-4 py-3 text-sm tracking-wide text-cream transition-colors hover:border-gold hover:text-gold"
            >
              <span className="truncate">{member.phone}</span>
              <span className="shrink-0 uppercase text-gold">Call</span>
            </a>
          ) : (
            <p className="text-sm text-cream/40">No phone number on file.</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="font-condensed mt-6 w-full rounded-full border border-cream/30 py-3 text-sm tracking-widest text-cream uppercase"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function RewardsRow({ member }: { member: ManagerMember }) {
  const router = useRouter();
  const [adjust, setAdjust] = useState(String(member.classCountAdjust));
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function saveAdjustment() {
    const n = Number(adjust);
    if (!Number.isInteger(n)) {
      setError("Enter a whole number.");
      return;
    }
    setError(null);
    setBusy("adjust");
    startTransition(async () => {
      const res = await setClassCountAdjustment(member.id, n);
      if (!res.ok) setError(res.error ?? "Couldn't save that adjustment.");
      else router.refresh();
      setBusy(null);
    });
  }

  function markRedeemed(milestone: number) {
    setError(null);
    setBusy(`redeem-${milestone}`);
    startTransition(async () => {
      const res = await redeemMilestone(member.id, milestone);
      if (!res.ok) setError(res.error ?? "Couldn't mark that redeemed.");
      else router.refresh();
      setBusy(null);
    });
  }

  return (
    <div className="mt-3 grid gap-4 rounded-2xl border border-oxblood-600/50 bg-ink/40 p-4">
      <div>
        <p className="font-condensed text-xs tracking-widest text-cream/50 uppercase">
          Attended classes (rewards count)
        </p>
        <p className="font-poster mt-1 text-3xl text-gold">{member.classCount}</p>
      </div>

      <label className="grid max-w-xs gap-1.5">
        <span className="font-condensed text-xs tracking-widest text-cream/50 uppercase">
          Manual adjustment (+/-)
        </span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={adjust}
            onChange={(e) => setAdjust(e.target.value)}
            className={field}
          />
          <button
            type="button"
            onClick={saveAdjustment}
            disabled={pending && busy === "adjust"}
            className="font-condensed shrink-0 rounded-full bg-gold px-4 py-2.5 text-xs font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </label>

      {error && <p className="text-sm text-blood">{error}</p>}

      <div>
        <p className="font-condensed mb-2 text-xs tracking-widest text-cream/50 uppercase">
          Milestones reached
        </p>
        {member.milestones.length === 0 ? (
          <p className="text-sm text-cream/40">None yet.</p>
        ) : (
          <ul className="grid gap-2">
            {member.milestones.map((ms) => (
              <li
                key={ms.milestone}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-oxblood-600/40 px-3 py-2 text-sm"
              >
                <span className="text-bone">{ms.milestone} classes</span>
                {ms.redeemedAt ? (
                  <span className="font-condensed text-xs tracking-widest text-gold uppercase">
                    Redeemed
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => markRedeemed(ms.milestone)}
                    disabled={pending && busy === `redeem-${ms.milestone}`}
                    className="font-condensed rounded-full border border-gold px-3 py-1 text-xs font-semibold tracking-widest text-gold uppercase transition-colors hover:bg-gold hover:text-ink disabled:opacity-50"
                  >
                    Mark redeemed
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

type MembershipAction = "pause" | "resume" | "cancel";

const ACTION_COPY: Record<MembershipAction, { title: string; message: string; confirmLabel: string }> = {
  pause: {
    title: "Pause membership",
    message: "This will pause billing in Square and pause their access. Confirm?",
    confirmLabel: "Pause",
  },
  resume: {
    title: "Resume membership",
    message: "This will resume billing in Square and restore their access.",
    confirmLabel: "Resume",
  },
  cancel: {
    title: "Cancel membership",
    message:
      "This will cancel their subscription and billing in Square. This can't be undone from here.",
    confirmLabel: "Cancel membership",
  },
};

const ACTION_FN: Record<MembershipAction, (userId: string) => Promise<AdminResult>> = {
  pause: pauseMembership,
  resume: resumeMembership,
  cancel: cancelMembership,
};

function MemberCard({ member }: { member: ManagerMember }) {
  const router = useRouter();
  const [contactOpen, setContactOpen] = useState(false);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<MembershipAction | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  function runAction(action: MembershipAction) {
    setError(null);
    startTransition(async () => {
      const res = await ACTION_FN[action](member.id);
      if (!res.ok) {
        setError(res.error ?? "That didn't go through.");
        return; // leave the confirm dialog open with the error, nothing changed
      }
      setConfirmAction(null);
      router.refresh();
    });
  }

  function doResend() {
    setError(null);
    setResendMsg(null);
    startTransition(async () => {
      const res = await resendClaimLink(member.id);
      if (!res.ok) setError(res.error ?? "Couldn't resend the claim link.");
      else setResendMsg(res.info ?? "Claim link sent.");
    });
  }

  const canPause = member.status === "active";
  const canResume = member.status === "paused" || member.status === "past_due";
  const canCancel = member.status !== "cancelled";

  return (
    <li className="rounded-2xl border border-oxblood-600/40 bg-ink/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-condensed flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-bronze text-sm font-semibold text-ink">
            {member.name.charAt(0).toUpperCase() || "?"}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-bone">{member.name}</p>
            <p className="truncate text-sm text-cream/55">{member.email}</p>
          </div>
        </div>
        <StatusBadge status={member.status} />
      </div>

      <p className="font-condensed mt-2 text-xs tracking-widest text-cream/50 uppercase">
        {member.plan}
        {member.phone && ` · ${member.phone}`}
      </p>

      {error && <p className="mt-2 text-sm text-blood">{error}</p>}
      {resendMsg && <p className="mt-2 text-sm text-gold">{resendMsg}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setContactOpen(true)}
          className="font-condensed rounded-full border border-oxblood-600/60 px-4 py-1.5 text-xs font-semibold tracking-widest text-cream/70 uppercase transition-colors hover:border-gold hover:text-gold"
        >
          Contact
        </button>
        {member.status === "pending_claim" && (
          <button
            type="button"
            onClick={doResend}
            disabled={pending}
            className="font-condensed rounded-full border border-gold px-4 py-1.5 text-xs font-semibold tracking-widest text-gold uppercase transition-colors hover:bg-gold hover:text-ink disabled:opacity-50"
          >
            Resend claim link
          </button>
        )}
        {canPause && (
          <button
            type="button"
            onClick={() => setConfirmAction("pause")}
            className="font-condensed rounded-full border border-bronze/60 px-4 py-1.5 text-xs font-semibold tracking-widest text-bronze uppercase transition-colors hover:bg-bronze hover:text-ink"
          >
            Pause
          </button>
        )}
        {canResume && (
          <button
            type="button"
            onClick={() => setConfirmAction("resume")}
            className="font-condensed rounded-full bg-gold px-4 py-1.5 text-xs font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone"
          >
            Resume
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            onClick={() => setConfirmAction("cancel")}
            className="font-condensed rounded-full border border-blood/60 px-4 py-1.5 text-xs font-semibold tracking-widest text-blood uppercase transition-colors hover:bg-blood hover:text-bone"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={() => setRewardsOpen((v) => !v)}
          className="font-condensed ml-auto rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest text-cream/60 uppercase transition-colors hover:text-gold"
        >
          {rewardsOpen ? "Hide rewards ▲" : "Rewards ▼"}
        </button>
      </div>

      {rewardsOpen && <RewardsRow member={member} />}

      {contactOpen && (
        <ContactModal member={member} onClose={() => setContactOpen(false)} />
      )}

      {confirmAction && (
        <ConfirmDialog
          open
          title={ACTION_COPY[confirmAction].title}
          message={ACTION_COPY[confirmAction].message}
          confirmLabel={ACTION_COPY[confirmAction].confirmLabel}
          danger={confirmAction === "cancel"}
          pending={pending}
          error={error}
          onConfirm={() => runAction(confirmAction)}
          onCancel={() => {
            setConfirmAction(null);
            setError(null);
          }}
        />
      )}
    </li>
  );
}

export function MembersManager({ members }: { members: ManagerMember[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (filter === "active" && m.status !== "active") return false;
      if (filter === "inactive" && !INACTIVE_STATUSES.has(m.status)) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone ?? "").toLowerCase().includes(q)
      );
    });
  }, [members, query, filter]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, or phone…"
          className={field}
        />
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`font-condensed shrink-0 rounded-full px-4 py-2 text-xs font-semibold tracking-widest uppercase transition-colors ${
                filter === f
                  ? "bg-gold text-ink"
                  : "border border-oxblood-600/60 text-cream/70 hover:border-gold hover:text-gold"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-oxblood-600/40 bg-ink/30 p-6 text-center text-sm text-cream/40">
          No members match.
        </p>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </ul>
      )}
    </div>
  );
}
