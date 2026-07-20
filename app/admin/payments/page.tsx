import { listRecentPayments, listSubscriptions, paymentsEnabled } from "@/lib/square";

export const dynamic = "force-dynamic";

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function squareDashboardUrl(): string {
  return process.env.SQUARE_ENVIRONMENT === "production"
    ? "https://app.squareup.com/dashboard"
    : "https://app.squareupsandbox.com/dashboard";
}

export default async function AdminPaymentsPage() {
  const header = (
    <header>
      <p className="font-condensed text-sm tracking-[0.3em] text-gold uppercase">
        Owner
      </p>
      <h1 className="font-poster text-4xl text-bone sm:text-5xl">Payments</h1>
      <p className="mt-2 text-cream/60">Read-only view of recent Square activity.</p>
    </header>
  );

  if (!paymentsEnabled) {
    return (
      <div className="grid gap-8">
        {header}
        <section className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-8 text-center">
          <h2 className="font-poster text-2xl text-bone">Square not connected yet</h2>
          <p className="mt-2 text-cream/60">
            Payments are running in stub mode. Set{" "}
            <code className="text-gold">PAYMENTS_ENABLED=true</code> along with{" "}
            <code className="text-gold">SQUARE_ACCESS_TOKEN</code>,{" "}
            <code className="text-gold">SQUARE_ENVIRONMENT</code>, and{" "}
            <code className="text-gold">NEXT_PUBLIC_SQUARE_LOCATION_ID</code> in
            your environment variables, then redeploy.
          </p>
        </section>
      </div>
    );
  }

  const [payments, subscriptions] = await Promise.all([
    listRecentPayments(20),
    listSubscriptions(),
  ]);

  const byStatus = subscriptions.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  const dashboardUrl = squareDashboardUrl();

  return (
    <div className="grid gap-8">
      {header}

      <section className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-6 sm:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-poster text-2xl text-bone">
            Subscriptions ({subscriptions.length})
          </h2>
          <a
            href={dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-condensed rounded-full border border-gold px-5 py-2 text-xs font-semibold tracking-widest text-gold uppercase transition-colors hover:bg-gold hover:text-ink"
          >
            Open Square dashboard ↗
          </a>
        </div>
        {subscriptions.length === 0 ? (
          <p className="text-sm text-cream/40">No subscriptions found.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {Object.entries(byStatus).map(([status, count]) => (
              <div
                key={status}
                className="rounded-2xl border border-oxblood-600/40 bg-ink/30 px-4 py-3"
              >
                <p className="font-poster text-2xl text-gold">{count}</p>
                <p className="font-condensed text-xs tracking-widest text-cream/55 uppercase">
                  {status}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-6 sm:p-8">
        <h2 className="font-poster mb-5 text-2xl text-bone">
          Recent payments ({payments.length})
        </h2>
        {payments.length === 0 ? (
          <p className="text-sm text-cream/40">No recent payments.</p>
        ) : (
          <ul className="grid gap-2">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-oxblood-600/40 bg-ink/30 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-bone">{formatCents(p.amountCents)}</p>
                  <p className="font-condensed truncate text-sm tracking-wide text-cream/55">
                    {p.note ?? "No note"}
                    {p.createdAt &&
                      ` · ${new Date(p.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}`}
                  </p>
                </div>
                <span
                  className={`font-condensed shrink-0 rounded-full px-3 py-1 text-xs tracking-widest uppercase ${
                    p.status === "COMPLETED"
                      ? "bg-gold/15 text-gold"
                      : p.status === "FAILED"
                        ? "bg-blood/20 text-blood"
                        : "bg-cream/10 text-cream/60"
                  }`}
                >
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        )}
        <a
          href={dashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-condensed mt-5 inline-block text-sm tracking-widest text-gold uppercase underline underline-offset-4"
        >
          View all payments in Square ↗
        </a>
      </section>
    </div>
  );
}
