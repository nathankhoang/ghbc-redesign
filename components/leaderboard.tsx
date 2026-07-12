import { Reveal } from "@/components/motion";
import type { LeaderRow } from "@/lib/leaderboard";

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function classesLabel(n: number) {
  return `${n} ${n === 1 ? "class" : "classes"}`;
}

function Row({ row }: { row: LeaderRow }) {
  const medal = MEDALS[row.rank];
  const isPodium = row.rank <= 3;

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border px-4 py-3 transition-colors sm:px-5 ${
        row.isMe
          ? "border-gold bg-gold/15"
          : isPodium
            ? "border-gold/40 bg-gold/5"
            : "border-oxblood-600/50 bg-oxblood/25"
      }`}
    >
      {/* Rank / medal */}
      <span
        className={`font-poster flex w-9 shrink-0 justify-center text-2xl ${
          isPodium ? "text-gold" : "text-cream/50"
        }`}
      >
        {medal ?? row.rank}
      </span>

      {/* Name */}
      <p className="font-poster min-w-0 flex-1 truncate text-lg text-bone sm:text-xl">
        {row.name}
        {row.isMe && (
          <span className="font-condensed ml-2 align-middle text-[10px] tracking-widest text-gold uppercase">
            that&apos;s you!
          </span>
        )}
      </p>

      {/* Count */}
      <span
        className={`font-condensed shrink-0 text-sm tracking-widest uppercase ${
          isPodium ? "text-gold" : "text-cream/70"
        }`}
      >
        {classesLabel(row.count)}
      </span>
    </div>
  );
}

export function Leaderboard({ top, me }: { top: LeaderRow[]; me: LeaderRow | null }) {
  const meInTop = top.some((r) => r.isMe);

  return (
    <Reveal className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-6 sm:p-8">
      <div className="mb-1 flex items-center gap-3">
        <h2 className="font-poster text-3xl text-bone">🥊 Top of the Class</h2>
      </div>
      <p className="font-condensed mb-6 text-xs tracking-widest text-cream/50 uppercase">
        Our most-committed members — no pressure, just good company
      </p>

      {top.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <span className="text-4xl">🥊</span>
          <p className="text-cream/70">Be the first to rack up classes!</p>
          <p className="text-sm text-cream/45">Every session you log lands you on the board.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-2.5">
            {top.map((row) => (
              <Row key={row.rank} row={row} />
            ))}
          </div>

          {/* Warm nudge for members outside the top 10 — count only, never a big rank. */}
          {!meInTop && me && (
            <div className="mt-5 rounded-2xl border border-gold/40 bg-gold/10 px-5 py-4 text-center">
              <p className="font-condensed text-sm tracking-wide text-bone">
                You&apos;ve logged{" "}
                <span className="text-gold">{classesLabel(me.count)}</span> — keep stacking
                them up 💪
              </p>
            </div>
          )}
        </>
      )}
    </Reveal>
  );
}
