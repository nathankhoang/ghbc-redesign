import { prisma } from "@/lib/prisma";
import { PromoCodesManager, type ManagerPromoCode } from "@/components/admin/promo-codes-manager";
import { MigrationPanel } from "@/components/admin/migration-panel";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const promoCodes = await prisma.promoCode.findMany({
    include: { _count: { select: { memberships: true } } },
    orderBy: { createdAt: "desc" },
  });

  const promoProps: ManagerPromoCode[] = promoCodes.map((p) => ({
    id: p.id,
    code: p.code,
    percentOff: p.percentOff,
    duration: p.duration,
    active: p.active,
    redemptions: p._count.memberships,
  }));

  return (
    <div className="grid gap-8">
      <header>
        <p className="font-condensed text-sm tracking-[0.3em] text-gold uppercase">
          Owner
        </p>
        <h1 className="font-poster text-4xl text-bone sm:text-5xl">Subscriptions</h1>
        <p className="mt-2 text-cream/60">
          Promo codes and bringing existing members onto the site.
        </p>
      </header>

      <PromoCodesManager promoCodes={promoProps} />
      <MigrationPanel />
    </div>
  );
}
