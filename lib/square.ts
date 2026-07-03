import { MEMBERSHIP, PRICING } from "@/lib/constants";

// Square subscription creation.
//
// Payments are STUBBED by default so the signup flow works end-to-end in local
// dev without real credentials. When PAYMENTS_ENABLED=true and Square sandbox
// credentials are supplied, wire the real Square Customers + Subscriptions APIs
// here (the card is already tokenised client-side via the Web Payments SDK).

export type PaymentInput = {
  email: string;
  firstName: string;
  lastName: string;
  membershipType: string;
  paymentToken: string;
};

export type PaymentResult = {
  ok: boolean;
  customerId?: string;
  error?: string;
};

const paymentsEnabled = process.env.PAYMENTS_ENABLED === "true";

export function introChargeCents(membershipType: string): number {
  return membershipType === MEMBERSHIP.YOGA
    ? PRICING.YOGA.introCents
    : PRICING.FULL.introCents;
}

export async function createSubscription(
  input: PaymentInput,
): Promise<PaymentResult> {
  if (!paymentsEnabled) {
    // Stub: pretend the charge + subscription succeeded.
    return { ok: true, customerId: `stub_${Date.now()}` };
  }

  if (!input.paymentToken) {
    return { ok: false, error: "Missing payment details." };
  }

  // TODO: real Square integration (sandbox). With the `square` SDK:
  //   1. Customers.create({ emailAddress, givenName, familyName })
  //   2. Cards.create({ sourceId: paymentToken, card: { customerId } })  OR
  //      Payments.create for the intro charge
  //   3. Subscriptions.create({ locationId, planVariationId, customerId, cardId })
  // Return the resulting Square customer id.
  return {
    ok: false,
    error: "Live payments are enabled but not yet implemented.",
  };
}
