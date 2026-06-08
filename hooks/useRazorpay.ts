'use client';

/**
 * apps/web/hooks/useRazorpay.ts
 *
 * Vaithiyam — useRazorpay React Hook
 * Next.js 14 · TypeScript strict · Tamil-first
 *
 * ─── Responsibilities ──────────────────────────────────────────────────────────
 *   Orchestrates the complete Razorpay payment lifecycle:
 *
 *   1. Pre-loads checkout.js on mount (eliminates cold-start latency)
 *   2. initiatePayment() runs the full flow in one async call:
 *        a) Ensure script loaded
 *        b) POST /api/payments/razorpay/order   → Razorpay order_id
 *        c) Open Razorpay Checkout modal
 *        d) POST /api/payments/razorpay/verify  → signature check
 *        e) Invoke success / dismiss / failure callbacks
 *   3. Exposes granular state: isScriptLoading · isProcessing · isLoading · error
 *
 * ─── Usage ────────────────────────────────────────────────────────────────────
 *   const { initiatePayment, isLoading, error, resetError } = useRazorpay();
 *
 *   await initiatePayment({
 *     vaithiyamOrderId: 'ord_xxx',
 *     amount:           499,
 *     preferredMethod:  'upi',
 *     prefill:          { name: 'Karthik', contact: '9876543210', vpa: 'karthik@oksbi' },
 *     onSuccess:        (orderId) => router.push(`/orders/${orderId}/success`),
 *     onDismiss:        () => toast.info('கட்டணம் ரத்து செய்யப்பட்டது.'),
 *     onFailure:        (msg)     => toast.error(msg),
 *   });
 */

import { useState, useEffect, useRef, useCallback } from 'react';

import {
  loadRazorpayScript,
  createRazorpayOrder,
  openRazorpayCheckout,
  verifyRazorpayPayment,
  inrToPaise,
  uiMethodToRazorpay,
  mapRazorpayErrorToTamil,
  RazorpayIntegrationError,
  RAZORPAY_ERRORS,
  type RazorpayPaymentResponse,
  type RazorpayPaymentError,
} from '../lib/payments/razorpay';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface InitiatePaymentParams {
  /**
   * Internal Vaithiyam order ID — returned by placeOrder().
   * Sent to the backend so it can create/fetch the Razorpay order.
   */
  vaithiyamOrderId:  string;
  /** Grand total in **INR** (not paise). Hook converts internally. */
  amount:            number;
  /** Pre-fill customer details in the Razorpay modal. */
  prefill?: {
    name?:    string;
    email?:   string;
    contact?: string;
    /** UPI VPA to pre-fill, e.g. "name@paytm" */
    vpa?:     string;
  };
  /**
   * UI payment method string from PaymentMethodSelector:
   * 'upi' | 'debit_card' | 'credit_card' | 'net_banking' | 'wallet' | 'cod'
   * Mapped to a Razorpay method key and used to pre-select the correct tab.
   */
  preferredMethod?: string;
  /** Extra notes visible in the Razorpay dashboard. */
  notes?: Record<string, string>;
  /**
   * Called after payment AND backend verification succeed.
   * Receives the Vaithiyam orderId — navigate to success page from here.
   */
  onSuccess:  (orderId: string) => void;
  /** Called when the user closes the modal without paying. Not an error. */
  onDismiss?: () => void;
  /** Called with a Tamil error message on payment failure. */
  onFailure?: (tamilErrorMessage: string) => void;
}

export interface UseRazorpayReturn {
  /** true while checkout.js is being fetched (before first initiatePayment) */
  isScriptLoading: boolean;
  /** true while the order→modal→verify flow is running */
  isProcessing:    boolean;
  /** Convenience: isScriptLoading || isProcessing */
  isLoading:       boolean;
  /** Tamil error message from the most recent failure, or null */
  error:           string | null;
  /** Clear the error state (e.g. on retry) */
  resetError:      () => void;
  /** Start the full Razorpay payment flow */
  initiatePayment: (params: InitiatePaymentParams) => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRazorpay(): UseRazorpayReturn {
  const [isScriptLoading, setIsScriptLoading] = useState(false);
  const [isProcessing,    setIsProcessing]    = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  // Ref-based guard prevents double-firing on rapid clicks
  const isProcessingRef = useRef(false);

  // Pre-warm: start loading the script as soon as the hook mounts.
  // This eliminates cold-start latency when the user actually clicks Pay.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Silently pre-load; failures here are non-fatal (we retry in initiatePayment)
    setIsScriptLoading(true);
    loadRazorpayScript()
      .catch(() => { /* will retry inside initiatePayment */ })
      .finally(() => setIsScriptLoading(false));
  }, []);

  const resetError = useCallback(() => setError(null), []);

  const initiatePayment = useCallback(
    async (params: InitiatePaymentParams): Promise<void> => {
      // ── Guard: prevent double submission ────────────────────────────────
      if (isProcessingRef.current) {
        setError(RAZORPAY_ERRORS.ALREADY_PROCESSING);
        return;
      }

      if (!params.vaithiyamOrderId?.trim()) {
        setError(RAZORPAY_ERRORS.ORDER_CREATE_FAILED);
        return;
      }

      if (!params.amount || params.amount <= 0) {
        setError(RAZORPAY_ERRORS.INVALID_AMOUNT);
        return;
      }

      isProcessingRef.current = true;
      setIsProcessing(true);
      setError(null);

      try {
        // ── Step 1: Ensure checkout.js is ready ──────────────────────────
        setIsScriptLoading(true);
        await loadRazorpayScript();
        setIsScriptLoading(false);

        // ── Step 2: Create Razorpay order via Vaithiyam backend ──────────
        const orderData = await createRazorpayOrder({
          orderId:  params.vaithiyamOrderId,
          amount:   params.amount,
          currency: 'INR',
          notes:    params.notes,
        });

        // ── Step 3: Wrap callback-based SDK in a Promise ──────────────────
        await new Promise<void>((resolve, reject) => {
          openRazorpayCheckout({
            razorpayOrderId:  orderData.razorpayOrderId,
            keyId:            orderData.keyId,
            // Always convert to paise before sending to Razorpay
            amountPaise:      inrToPaise(params.amount),
            currency:         orderData.currency,
            prefill:          params.prefill,
            preferredMethod:  params.preferredMethod
              ? uiMethodToRazorpay(params.preferredMethod)
              : undefined,
            notes: params.notes,

            // ── Success: payment captured, now verify signature ───────────
            onSuccess: async (response: RazorpayPaymentResponse) => {
              try {
                // ── Step 4: Backend HMAC verification ────────────────────
                const verification = await verifyRazorpayPayment({
                  razorpay_order_id:   response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature:  response.razorpay_signature,
                  vaithiyamOrderId:    params.vaithiyamOrderId,
                });

                // ── Step 5: Hand off to caller ────────────────────────────
                params.onSuccess(verification.orderId);
                resolve();
              } catch (verifyErr) {
                const msg =
                  verifyErr instanceof RazorpayIntegrationError
                    ? verifyErr.tamizh
                    : RAZORPAY_ERRORS.VERIFY_FAILED;
                params.onFailure?.(msg);
                reject(new Error(msg));
              }
            },

            // ── Dismiss: user closed modal, not a hard error ──────────────
            onDismiss: () => {
              params.onDismiss?.();
              resolve(); // resolve (not reject) — dismissal is not a failure
            },

            // ── Failure: Razorpay returned a payment.failed event ─────────
            onFailure: (razorpayError: RazorpayPaymentError) => {
              const description =
                razorpayError.error?.description ?? '';
              const msg = mapRazorpayErrorToTamil(description);
              params.onFailure?.(msg);
              reject(new Error(msg));
            },
          });
        });

      } catch (err) {
        // Surface the error to the hook consumer
        const msg =
          err instanceof RazorpayIntegrationError
            ? err.tamizh
            : err instanceof Error
            ? err.message
            : RAZORPAY_ERRORS.UNKNOWN_ERROR;
        setError(msg);
        setIsScriptLoading(false);

      } finally {
        setIsProcessing(false);
        isProcessingRef.current = false;
      }
    },
    [], // no deps — all state is managed via refs / setters
  );

  return {
    isScriptLoading,
    isProcessing,
    isLoading: isScriptLoading || isProcessing,
    error,
    resetError,
    initiatePayment,
  };
}
