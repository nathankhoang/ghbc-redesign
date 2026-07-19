"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  syncFromSquare,
  importMembersCsv,
  type AdminResult,
} from "@/app/actions/members-admin";

const field =
  "w-full rounded-xl border border-oxblood-600/60 bg-ink/60 px-4 py-3 text-cream placeholder:text-cream/35 focus:border-gold focus:outline-none";

function ResultMsg({ result }: { result: AdminResult | null }) {
  if (!result) return null;
  if (!result.ok) return <p className="mt-3 text-sm text-blood">{result.error}</p>;
  return <p className="mt-3 text-sm text-gold">{result.info ?? "Done."}</p>;
}

export function MigrationPanel() {
  const router = useRouter();

  const [syncPending, startSync] = useTransition();
  const [syncResult, setSyncResult] = useState<AdminResult | null>(null);

  const [csv, setCsv] = useState("");
  const [importPending, startImport] = useTransition();
  const [importResult, setImportResult] = useState<AdminResult | null>(null);

  function handleSync() {
    setSyncResult(null);
    startSync(async () => {
      const res = await syncFromSquare();
      setSyncResult(res);
      if (res.ok) router.refresh();
    });
  }

  function handleImport() {
    if (!csv.trim()) return;
    setImportResult(null);
    startImport(async () => {
      const res = await importMembersCsv(csv);
      setImportResult(res);
      if (res.ok) {
        setCsv("");
        router.refresh();
      }
    });
  }

  return (
    <section className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-6 sm:p-8">
      <h2 className="font-poster mb-2 text-2xl text-bone">Migration</h2>
      <p className="mb-5 text-sm text-cream/60">
        Bring existing members onto the site. Both paths email a claim link so
        the member sets their own password.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-oxblood-600/50 bg-ink/40 p-4">
          <h3 className="font-condensed mb-2 text-sm tracking-widest text-gold uppercase">
            Sync from Square
          </h3>
          <p className="mb-4 text-sm text-cream/60">
            Pull existing Square customers with active subscriptions and link
            them to new pending accounts.
          </p>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncPending}
            className="font-condensed rounded-full bg-gold px-6 py-2.5 text-sm font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-60"
          >
            {syncPending ? "Syncing…" : "Sync from Square"}
          </button>
          <ResultMsg result={syncResult} />
        </div>

        <div className="rounded-2xl border border-oxblood-600/50 bg-ink/40 p-4">
          <h3 className="font-condensed mb-2 text-sm tracking-widest text-gold uppercase">
            CSV import
          </h3>
          <p className="mb-3 text-sm text-cream/60">
            One member per line: <code className="text-cream/80">name,email,phone</code>
          </p>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={5}
            placeholder={"Jane Doe,jane@example.com,619-555-0100\nJohn Smith,john@example.com,"}
            className={`${field} resize-none font-mono text-sm`}
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={importPending || !csv.trim()}
            className="font-condensed mt-3 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-60"
          >
            {importPending ? "Importing…" : "Import CSV"}
          </button>
          <ResultMsg result={importResult} />
        </div>
      </div>
    </section>
  );
}
