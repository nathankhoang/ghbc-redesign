import { NextResponse } from "next/server";
import { WebhooksHelper } from "square";
import { prisma } from "@/lib/prisma";

// Square webhook receiver — keeps membership status in the DB in sync with
// what Square actually charged. The owner dashboard and booking gates read
// status from the DB, never by polling Square per-request.
//
// Subscribe this URL in the Square Developer dashboard (Webhooks):
//   https://<site>/api/webhooks/square
// with at least: invoice.payment_made, invoice.scheduled_charge_failed,
// subscription.updated. Set SQUARE_WEBHOOK_SIGNATURE_KEY from the dashboard.

type SquareEvent = {
  type?: string;
  data?: {
    object?: {
      invoice?: { subscription_id?: string; subscriptionId?: string };
      subscription?: { id?: string; status?: string; customer_id?: string; customerId?: string };
    };
  };
};

// Square subscription status → our membership status.
const STATUS_MAP: Record<string, string> = {
  ACTIVE: "active",
  PAUSED: "paused",
  CANCELED: "cancelled",
  DEACTIVATED: "past_due",
  PENDING: "active",
};

async function setStatusBySubscription(subscriptionId: string, status: string) {
  const membership = await prisma.membership.findFirst({
    where: { squareSubscriptionId: subscriptionId },
  });
  if (!membership) {
    console.warn(`[square webhook] no membership for subscription ${subscriptionId}`);
    return;
  }
  await prisma.membership.update({
    where: { id: membership.id },
    data: { status },
  });
  // Mirror onto the user row — booking gates read this field.
  await prisma.user.update({
    where: { id: membership.userId },
    data: { subscriptionStatus: status },
  });
  // Payment trouble → tell the member in their dashboard.
  if (status === "past_due") {
    await prisma.notification.create({
      data: {
        userId: membership.userId,
        title: "There's a problem with your payment",
        body: "Your last membership payment didn't go through. Update your card to keep booking classes.",
      },
    });
  }
}

export async function POST(req: Request) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const body = await req.text();

  if (signatureKey) {
    const signature = req.headers.get("x-square-hmacsha256-signature") ?? "";
    const notificationUrl =
      `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://ghbc-redesign.vercel.app"}/api/webhooks/square`;
    const valid = await WebhooksHelper.verifySignature({
      requestBody: body,
      signatureHeader: signature,
      signatureKey,
      notificationUrl,
    });
    if (!valid) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // Never accept unsigned webhooks in production.
    return NextResponse.json({ error: "webhook signature key not configured" }, { status: 401 });
  }

  let event: SquareEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const type = event.type ?? "";
  const obj = event.data?.object ?? {};

  try {
    if (type === "invoice.payment_made") {
      const subId = obj.invoice?.subscription_id ?? obj.invoice?.subscriptionId;
      if (subId) await setStatusBySubscription(subId, "active");
    } else if (type === "invoice.scheduled_charge_failed" || type === "invoice.payment_failed") {
      const subId = obj.invoice?.subscription_id ?? obj.invoice?.subscriptionId;
      if (subId) await setStatusBySubscription(subId, "past_due");
    } else if (type === "subscription.updated" || type === "subscription.created") {
      const sub = obj.subscription;
      if (sub?.id && sub.status) {
        const mapped = STATUS_MAP[sub.status];
        if (mapped) await setStatusBySubscription(sub.id, mapped);
      }
    }
    // Other events acknowledged without action.
  } catch (e) {
    console.error("[square webhook] handler error:", e);
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
