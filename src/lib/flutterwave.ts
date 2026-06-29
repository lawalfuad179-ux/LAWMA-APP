import { logger } from '@/lib/logger';

type CreatePaymentLinkParams = {
  txRef: string;
  amountKobo: number;
  customerEmail?: string;
  customerPhone: string;
  customerName: string;
  billId: string;
  residentId: string;
  paymentId: string;
  meta?: Record<string, string>;
  /** Override the path Flutterwave redirects back to (default: /payments). */
  redirectPath?: string;
};

type CreatePaymentLinkResult = {
  ok: true;
  checkoutUrl: string;
} | {
  ok: false;
  error: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Returns a Flutterwave-acceptable email. Prefers the resident's real email;
 * falls back to a synthetic one built from a digits-only phone so we never
 * send something like "+234...@lawma.resident" or "x@y@z" that the API rejects.
 */
function sanitizeEmail(email: string | undefined, phone: string): string {
  if (email && EMAIL_RE.test(email)) return email;
  const digits = (phone || '').replace(/\D/g, '');
  const local = digits || `resident${Date.now()}`;
  return `${local}@lawma.resident`;
}

/**
 * Creates a Flutterwave hosted payment link.
 * Converts internal kobo amounts to naira for the Flutterwave API boundary.
 */
export async function createPaymentLink(params: CreatePaymentLinkParams): Promise<CreatePaymentLinkResult> {
    const {
      txRef,
      amountKobo,
      customerEmail,
      customerPhone,
      customerName,
      billId,
      residentId,
      paymentId,
      meta,
      redirectPath,
    } = params;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3100';

  try {
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: amountKobo / 100, // Convert kobo to naira at the gateway boundary
        currency: 'NGN',
        redirect_url: `${appUrl}${redirectPath ?? '/payments'}`,
        customer: {
          email: sanitizeEmail(customerEmail, customerPhone),
          phonenumber: customerPhone,
          name: customerName,
        },
        customizations: {
          title: 'LAWMA Waste Bill Payment',
          description: 'Waste collection bill payment',
          // Only pass logo when deployed — localhost URLs are blocked by Flutterwave's HTTPS checkout
          ...(appUrl.startsWith('https://') ? { logo: `${appUrl}/logo.png` } : {}),
        },
        meta: {
          bill_id: billId,
          resident_id: residentId,
          payment_id: paymentId,
          ...(meta ?? {}),
        },
      }),
    });

    if (!response.ok) {
      logger.error('flutterwave.create_payment_link.api_error', {
        status: response.status,
      });
      return { ok: false, error: 'Payment gateway is temporarily unavailable.' };
    }

    const data = await response.json();

    if (data.status !== 'success' || !data.data?.link) {
      logger.error('flutterwave.create_payment_link.invalid_response', {
        responseStatus: data.status,
      });
      return { ok: false, error: 'Could not generate payment link.' };
    }

    return { ok: true, checkoutUrl: data.data.link };
  } catch (error) {
    logger.error('flutterwave.create_payment_link.failed', { error: String(error) });
    return { ok: false, error: 'Payment service error. Please try again.' };
  }
}

type VerifyTransactionResult = {
  ok: true;
  data: {
    status: string;
    amount: number;
    currency: string;
    txRef: string;
    flwRef: string;
  };
} | {
  ok: false;
  error: string;
};

/**
 * Verifies a Flutterwave transaction by its transaction ID.
 */
export async function verifyTransaction(transactionId: number): Promise<VerifyTransactionResult> {
  try {
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      logger.error('flutterwave.verify_transaction.api_error', {
        status: response.status,
        transactionId,
      });
      return { ok: false, error: 'Verification API failed.' };
    }

    const body = await response.json();

    if (body.status !== 'success') {
      return { ok: false, error: 'Transaction verification returned unsuccessful status.' };
    }

    return {
      ok: true,
      data: {
        status: body.data.status,
        amount: body.data.amount,
        currency: body.data.currency,
        txRef: body.data.tx_ref,
        flwRef: body.data.flw_ref,
      },
    };
  } catch (error) {
    logger.error('flutterwave.verify_transaction.failed', { error: String(error) });
    return { ok: false, error: 'Verification service error.' };
  }
}
