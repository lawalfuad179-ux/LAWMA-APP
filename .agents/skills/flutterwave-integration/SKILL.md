# Flutterwave Integration Skill

Load this skill for any task that touches Flutterwave: creating payment links, verifying transactions, handling webhooks, payment retries, bill status updates, or debugging payment flows. Do not write Flutterwave code from memory. Flutterwave is the source of payment truth for LAWMA Mobile App.

## What Flutterwave Does for LAWMA Mobile App

Flutterwave is the payment gateway for resident waste bill payments. It does three things for us:

1. **Hosts the checkout page.** When a resident taps Pay Bill, we hand them off to Flutterwave's hosted checkout. We never collect card details in our own UI.
2. **Processes the payment.** Flutterwave handles card, bank transfer, USSD, and other supported payment methods.
3. **Notifies us via webhook.** When a payment succeeds or fails, Flutterwave sends a webhook to our server. The webhook is how we know the truth.

## The Payment Flow End to End

```
Resident taps Pay Bill
        |
        v
POST /api/payments/initialize creates pending PaymentAttempt for a Bill
        |
        v
Server calls Flutterwave create payment link endpoint
        |
        v
Server returns hosted checkout URL to the browser
        |
        v
Browser redirects to Flutterwave
        |
        v
Resident pays on Flutterwave's page
        |
        v
Flutterwave redirects resident to /payments/verify?tx_ref=<tx_ref> (untrusted, display only)
        |
        v
Flutterwave sends webhook to /api/webhooks/flutterwave (TRUSTED after verification)
        |
        v
Webhook handler verifies signature, verifies transaction via API, marks Payment successful and Bill paid
        |
        v
Resident sees receipt and payment history update
```

The browser redirect and the webhook are two different things. The browser redirect is just a UX signal to tell the resident "we are checking your payment." The webhook is what actually updates the database.

## Environment Variables

Flutterwave needs three keys:

```
FLUTTERWAVE_PUBLIC_KEY         Safe to expose only if a client-side Flutterwave widget is used.
FLUTTERWAVE_SECRET_KEY         Server-only. Used to call the Flutterwave API.
FLUTTERWAVE_SECRET_HASH        Server-only. Used to verify incoming webhooks.
NEXT_PUBLIC_APP_URL            Server and Client. Used to construct checkout redirect URLs.
```

Use test keys in development and live keys in production. The secret hash is configured in the Flutterwave dashboard under Webhooks and must match `FLUTTERWAVE_SECRET_HASH` exactly.

## Creating a Payment Link

When a resident taps Pay Bill, create a pending payment attempt and request a payment link from Flutterwave.

Flutterwave endpoint:

```txt
POST https://api.flutterwave.com/v3/payments
Authorization: Bearer ${FLUTTERWAVE_SECRET_KEY}
```

Example request builder:

```ts
const response = await fetch('https://api.flutterwave.com/v3/payments', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tx_ref: `lawma_bill_${billId}_${Date.now()}`,
    amount: amountKobo / 100, // Convert Kobo from DB to Naira major unit for Flutterwave
    currency: 'NGN',
    redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/verify?tx_ref=${txRef}`,
    customer: {
      email: resident.email,
      phonenumber: resident.phoneNumber,
      name: resident.name,
    },
    customizations: {
      title: 'LAWMA Waste Bill Payment',
      description: 'Waste collection bill payment',
      logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
    },
    meta: {
      bill_id: billId,
      resident_id: residentId,
      payment_id: paymentId,
    },
  }),
});
```

Notes:

- `tx_ref` must be unique per payment attempt. Include the bill ID or payment ID and a random suffix. Save it before calling Flutterwave.
- Store amounts internally in kobo. Flutterwave's hosted payment endpoint expects the major unit, so convert with `amountKobo / 100` only at the Flutterwave boundary.
- `currency` is always `NGN` at launch.
- `meta` fields come back in the webhook and help reconciliation.
- `redirect_url` must use `process.env.NEXT_PUBLIC_APP_URL` to ensure it works on localhost in development.

The successful response contains a hosted checkout link:

```json
{
  "status": "success",
  "message": "Hosted Link",
  "data": { "link": "https://checkout.flutterwave.com/v3/hosted/pay/..." }
}
```

Return `data.link` to the browser and redirect the resident there.

## Verifying a Transaction

After receiving a webhook, call Flutterwave's verify endpoint to confirm the payload is real. Do not trust the webhook body alone, even after signature verification.

```txt
GET https://api.flutterwave.com/v3/transactions/{transaction_id}/verify
Authorization: Bearer ${FLUTTERWAVE_SECRET_KEY}
```

Only mark the payment successful if all checks pass:

1. `data.status === 'successful'`
2. `data.currency === payment.currency` (usually `NGN`)
3. `data.amount === payment.amountKobo / 100`
4. `data.tx_ref === payment.txRef`

If any check fails, log a warning and do not mark the payment successful. Respond 200 to the webhook if the payload is understood so Flutterwave does not keep retrying a known bad payload.

## Webhook Handling

The webhook handler lives at `src/app/api/webhooks/flutterwave/route.ts`. Use the reference implementation below as a copy-paste starting point. Adapt the schema properties (e.g. model/field names) to fit the Prisma definitions.

### Reference Implementation:

```ts
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

type FlutterwaveWebhookBody = {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    status: string;
  };
};

export async function POST(req: NextRequest) {
  try {
    // 1. Signature Verification
    const signature = req.headers.get('verif-hash');
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    
    if (!signature || signature !== secretHash) {
      logger.warn('webhook.flutterwave.unauthorized_signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const payload = (await req.json()) as FlutterwaveWebhookBody;
    const { tx_ref, amount, currency, status, id: transactionId } = payload.data;

    // We only process charge.completed events
    if (payload.event !== 'charge.completed') {
      logger.info('webhook.flutterwave.ignored_event', { event: payload.event });
      return NextResponse.json({ ok: true, message: 'Event ignored' });
    }

    // 2. Query stored payment attempt
    const payment = await db.payment.findUnique({
      where: { txRef: tx_ref },
    });

    if (!payment) {
      logger.warn('webhook.flutterwave.payment_not_found', { tx_ref });
      return NextResponse.json({ ok: true, message: 'Payment record not found' });
    }

    // If already processed, return 200 OK immediately (idempotency)
    if (payment.status === 'SUCCESSFUL') {
      return NextResponse.json({ ok: true, message: 'Payment already processed' });
    }

    // 3. Verification Call to Flutterwave API
    const verifyUrl = `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`;
    const verifyResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!verifyResponse.ok) {
      logger.error('webhook.flutterwave.verification_api_failed', { transactionId });
      return new Response('Verification API failed', { status: 500 });
    }

    const verifyData = await verifyResponse.json();
    
    if (
      verifyData.status !== 'success' ||
      verifyData.data.status !== 'successful' ||
      verifyData.data.amount !== payment.amountKobo / 100 ||
      verifyData.data.currency !== payment.currency ||
      verifyData.data.tx_ref !== payment.txRef
    ) {
      logger.warn('webhook.flutterwave.validation_checks_failed', {
        tx_ref,
        expected: { amount: payment.amountKobo / 100, currency: payment.currency },
        received: { amount: verifyData.data.amount, currency: verifyData.data.currency },
      });
      return NextResponse.json({ ok: true, message: 'Validation checks failed' });
    }

    // 4. Update payment and bill inside a DB transaction (idempotency constraint)
    try {
      await db.$transaction(async (tx) => {
        // Update payment attempt to successful
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESSFUL',
            gatewayReference: verifyData.data.flw_ref,
            paidAt: new Date(),
          },
        });

        // Mark the associated bill as paid
        await tx.bill.update({
          where: { id: payment.billId },
          data: { status: 'PAID' },
        });
      });

      logger.info('webhook.flutterwave.success', { tx_ref, billId: payment.billId });
      return NextResponse.json({ ok: true, message: 'Payment completed successfully' });
    } catch (dbError: any) {
      // Catch duplicate key unique constraint error (P2002) for gatewayReference
      if (dbError.code === 'P2002') {
        logger.info('webhook.flutterwave.duplicate_prevented', { tx_ref });
        return NextResponse.json({ ok: true, message: 'Duplicate payment processing skipped' });
      }
      throw dbError;
    }
  } catch (error) {
    logger.error('webhook.flutterwave.failed', { error });
    return NextResponse.json(
      { ok: false, error: { code: 'server_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
```

## Testing

Use Flutterwave test mode and test keys in development. Test the full path:

- Payment initialization creates a pending payment.
- Hosted checkout link is returned.
- Successful payment redirects to the verification page.
- Webhook verifies the transaction and marks the bill paid.
- Duplicate webhook delivery is a no-op.
- Failed payment does not mark the bill paid.

Do not rely on unit tests alone. Payment bugs usually live in integration boundaries.

## Common Mistakes

- Storing amounts as floats. Stay in integer kobo in the database.
- Trusting the browser redirect. The redirect is not proof of payment.
- Hardcoding redirect URLs instead of using `process.env.NEXT_PUBLIC_APP_URL` (breaks local testing).
- Skipping the verify API call.
- Forgetting idempotency.
- Logging secret keys or full webhook payloads with sensitive fields.
- Using Paystack patterns. LAWMA Mobile App uses Flutterwave only.
- Marking a bill paid before the webhook confirms the transaction.
