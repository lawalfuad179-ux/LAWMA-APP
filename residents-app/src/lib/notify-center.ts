import { db } from './db';
import { logger } from './logger';
import { sendSms } from './sms';
import { enqueueEmail } from './email/enqueue';

/**
 * Notifications for the two console modules (buy-back counter, weighbridge).
 *
 * Contract: these run AFTER the money transaction has committed, and they
 * NEVER throw — a dead SMS gateway or a missing email address must not
 * surface as a failed drop-off. Every branch that skips a channel logs why,
 * so "no message" is always diagnosable.
 *
 * Channels by audience:
 * - Residents: in-app notification (always) + email (if on file, respecting
 *   the payment-receipts preference) + SMS (transactional money notice).
 * - Tricycle fleet operators: SMS only — they have no app account.
 */

const naira = (kobo: number) => `NGN ${(kobo / 100).toLocaleString('en-NG')}`;

export async function notifyDropOff(input: {
  resident: { id: string; name: string | null; phoneNumber: string | null; email: string | null };
  payoutMethod: 'CREDIT' | 'CASH';
  totalAmountKobo: number;
  newBalancePoints: number;
  summary: string;
  centerName: string;
  receiptCode: string;
}): Promise<void> {
  const { resident, payoutMethod, totalAmountKobo, newBalancePoints, summary, centerName, receiptCode } = input;
  const isCredit = payoutMethod === 'CREDIT';
  const amount = naira(totalAmountKobo);

  // In-app — lands in the bell the resident already checks.
  try {
    await db.notification.create({
      data: {
        residentId: resident.id,
        type: 'RECYCLING_REWARD',
        title: isCredit ? `You earned ${amount} recycling` : `Cash payout: ${amount}`,
        body: isCredit
          ? `${summary} at ${centerName}. Wallet balance ₦${newBalancePoints.toLocaleString('en-NG')} — it comes off your next bill automatically. Receipt ${receiptCode}.`
          : `${summary} at ${centerName}, paid in cash at the counter. Receipt ${receiptCode}.`,
        referenceId: receiptCode,
      },
    });
  } catch (error) {
    logger.error('notify.dropoff.inapp_failed', { residentId: resident.id, error: String(error) });
  }

  // Email — only with an address on file and the receipts preference on
  // (no preference row means the defaults apply, and the default is on).
  try {
    if (!resident.email) {
      logger.info('notify.dropoff.email_skipped', { residentId: resident.id, reason: 'no_email' });
    } else {
      const prefs = await db.notificationPreference.findUnique({
        where: { residentId: resident.id },
        select: { emailPaymentReceipts: true },
      });
      if (prefs && !prefs.emailPaymentReceipts) {
        logger.info('notify.dropoff.email_skipped', { residentId: resident.id, reason: 'preference_off' });
      } else {
        const subject = isCredit
          ? `You earned ${amount} recycling at ${centerName}`
          : `Your ${amount} cash payout at ${centerName}`;
        await enqueueEmail(resident.email, subject, 'recycling-reward', {
          amountKobo: totalAmountKobo,
          summary,
          centerName,
          receiptCode,
          payoutMethod,
          newBalancePoints,
        });
      }
    }
  } catch (error) {
    logger.error('notify.dropoff.email_failed', { residentId: resident.id, error: String(error) });
  }

  // SMS — transactional money notice; the channel every resident has.
  try {
    if (!resident.phoneNumber) {
      logger.info('notify.dropoff.sms_skipped', { residentId: resident.id, reason: 'no_phone' });
      return;
    }
    await sendSms(
      resident.phoneNumber,
      isCredit
        ? `LAWMA: ${amount} earned for ${summary} at ${centerName}. Wallet: N${newBalancePoints.toLocaleString('en-NG')} (auto-applies to your bill). Receipt ${receiptCode}.`
        : `LAWMA: ${amount} paid to you in cash for ${summary} at ${centerName}. Receipt ${receiptCode}.`,
      'dropoff',
    );
  } catch (error) {
    logger.error('notify.dropoff.sms_failed', { residentId: resident.id, error: String(error) });
  }
}

export async function notifyWeighEvent(input: {
  contactPhone: string | null;
  operatorName: string;
  rfidTag: string;
  grossWeightGrams: number;
  feeKobo: number;
  balanceAfterKobo: number;
  stationName: string;
  receiptCode: string;
}): Promise<void> {
  const { contactPhone, rfidTag, grossWeightGrams, feeKobo, balanceAfterKobo, stationName, receiptCode } = input;
  if (!contactPhone) {
    logger.info('notify.weigh.sms_skipped', { rfidTag, reason: 'no_contact_phone' });
    return;
  }

  const inArrears = balanceAfterKobo < 0;
  const kg = (grossWeightGrams / 1000).toFixed(1);
  try {
    await sendSms(
      contactPhone,
      inArrears
        ? `LAWMA ${stationName}: ${kg}kg tipped, fee ${naira(feeKobo)}. Wallet IN ARREARS (${naira(balanceAfterKobo)}) — please top up at the station. Receipt ${receiptCode}.`
        : `LAWMA ${stationName}: ${kg}kg tipped, fee ${naira(feeKobo)} docked. Wallet balance ${naira(balanceAfterKobo)}. Receipt ${receiptCode}.`,
      'weigh',
    );
  } catch (error) {
    logger.error('notify.weigh.sms_failed', { rfidTag, error: String(error) });
  }
}

export async function notifyTopup(input: {
  contactPhone: string | null;
  rfidTag: string;
  amountKobo: number;
  balanceAfterKobo: number;
  stationName: string;
}): Promise<void> {
  const { contactPhone, rfidTag, amountKobo, balanceAfterKobo, stationName } = input;
  if (!contactPhone) {
    logger.info('notify.topup.sms_skipped', { rfidTag, reason: 'no_contact_phone' });
    return;
  }

  try {
    await sendSms(
      contactPhone,
      `LAWMA ${stationName}: wallet topped up ${naira(amountKobo)}. New balance ${naira(balanceAfterKobo)}.`,
      'topup',
    );
  } catch (error) {
    logger.error('notify.topup.sms_failed', { rfidTag, error: String(error) });
  }
}
