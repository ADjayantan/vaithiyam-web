/**
 * apps/web/lib/payments/razorpay.ts
 *
 * Vaithiyam — Razorpay Integration Core Library
 * Next.js 14 compatible · TypeScript strict · Tamil-first error messages
 *
 * ─── Responsibilities ──────────────────────────────────────────────────────────
 *   1. Load Razorpay checkout.js (idempotent, cached, 15 s timeout)
 *   2. TypeScript type declarations for the entire Razorpay Checkout SDK
 *   3. createRazorpayOrder()    → POST /api/payments/razorpay/order
 *   4. openRazorpayCheckout()   → opens the Razorpay modal
 *   5. verifyRazorpayPayment()  → POST /api/payments/razorpay/verify
 *
 * ─── Payment methods supported ────────────────────────────────────────────────
 *   UPI (Google Pay · PhonePe · Paytm · BHIM · all VPA apps)
 *   Cards (Visa · Mastercard · RuPay · Amex · Diners)
 *   Net Banking (SBI · HDFC · ICICI · Axis · 50+ banks)
 *   Wallets (Paytm · PhonePe · MobiKwik · Freecharge · JioMoney)
 *
 * ─── DO NOT generate ──────────────────────────────────────────────────────────
 *   Order success page · Order failure page · Authentication
 */

// ─── Razorpay CDN ─────────────────────────────────────────────────────────────

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js' as const;

// ─── Supported payment method keys (Razorpay SDK vocabulary) ─────────────────

export type RazorpayMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'emi';

// ─── Razorpay Checkout SDK types ──────────────────────────────────────────────

export interface RazorpayPrefill {
  name?:    string;
  email?:   string;
  contact?: string;
  /** UPI Virtual Payment Address, e.g. "name@paytm" */
  vpa?:     string;
  method?:  RazorpayMethod;
}

export interface RazorpayTheme {
  /** Hex colour applied to the Razorpay modal header */
  color?:          string;
  backdrop_color?: string;
  hide_topbar?:    boolean;
}

export interface RazorpayModalConfig {
  backdropclose?: boolean;
  escape?:        boolean;
  handleback?:    boolean;
  confirm_close?: boolean;
  animation?:     boolean;
  ondismiss?:     () => void;
}

/** Full Razorpay Checkout options object */
export interface RazorpayOptions {
  key:        string;
  /** Amount in **paise** (INR × 100) */
  amount:     number;
  currency?:  string;
  name?:      string;
  description?: string;
  image?:     string;
  order_id:   string;
  prefill?:   RazorpayPrefill;
  notes?:     Record<string, string>;
  theme?:     RazorpayTheme;
  modal?:     RazorpayModalConfig;
  method?:    Partial<Record<RazorpayMethod, boolean>>;
  retry?:     { enabled?: boolean; max_count?: number };
  timeout?:   number;
  remember_customer?: boolean;
  readonly?:  { contact?: boolean; email?: boolean };
  handler?:   (response: RazorpayPaymentResponse) => void;
}

/** Response received inside the Razorpay success handler */
export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id:   string;
  razorpay_signature:  string;
}

/** Shape of the error emitted on the "payment.failed" event */
export interface RazorpayPaymentError {
  error: {
    code:        string;
    description: string;
    source?:     string;
    step?:       string;
    reason?:     string;
    metadata?: {
      order_id?:   string;
      payment_id?: string;
    };
  };
}

/** Razorpay Checkout instance returned by new window.Razorpay() */
export interface RazorpayInstance {
  open:  () => void;
  close: () => void;
  on:    (event: 'payment.failed', handler: (res: RazorpayPaymentError) => void) => void;
}

// Augment Window so TypeScript knows Razorpay can exist on it
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

// ─── Backend API contract types ───────────────────────────────────────────────
//
// Expected routes (implement in apps/web/app/api/payments/razorpay/):
//   POST /api/payments/razorpay/order  → CreateOrderResponse
//   POST /api/payments/razorpay/verify → VerifyPaymentResponse

export interface CreateOrderRequest {
  /** Internal Vaithiyam order ID */
  orderId:   string;
  /** Amount in INR (backend converts to paise before calling Razorpay) */
  amount:    number;
  currency?: string;
  notes?:    Record<string, string>;
}

export interface CreateOrderResponse {
  /** Razorpay order_id (e.g. "order_Abc123") */
  razorpayOrderId: string;
  /** Amount in paise as returned by Razorpay */
  amount:          number;
  currency:        string;
  /** Razorpay publishable key (safe to expose to client) */
  keyId:           string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id:   string;
  razorpay_payment_id: string;
  razorpay_signature:  string;
  vaithiyamOrderId:    string;
}

export interface VerifyPaymentResponse {
  verified: boolean;
  orderId:  string;
}

// ─── Tamil error messages (displayed to the user) ─────────────────────────────

export const RAZORPAY_ERRORS = {
  SCRIPT_LOAD_FAILED:    'கட்டண சேவை ஏற்றுவதில் பிழை. இணைப்பை சரிபார்க்கவும்.',
  SCRIPT_TIMEOUT:        'கட்டண சேவை நேரம் முடிந்தது. பக்கத்தை புதுப்பித்து மீண்டும் முயற்சிக்கவும்.',
  ORDER_CREATE_FAILED:   'கட்டண ஆர்டர் உருவாக்குவதில் பிழை. சற்று நேரம் கழித்து முயற்சிக்கவும்.',
  PAYMENT_CANCELLED:     'கட்டணம் ரத்து செய்யப்பட்டது.',
  PAYMENT_FAILED:        'கட்டணம் தோல்வியடைந்தது. வேறு கட்டண முறை முயற்சிக்கவும்.',
  VERIFY_FAILED:         'கட்டண சரிபார்ப்பில் பிழை. ஆதரவை தொடர்பு கொள்ளவும்.',
  NETWORK_ERROR:         'இணைய இணைப்பில் பிழை. இணைப்பை சரிபார்த்து மீண்டும் முயற்சிக்கவும்.',
  INVALID_AMOUNT:        'தொகை சரியாக இல்லை. மீண்டும் முயற்சிக்கவும்.',
  ALREADY_PROCESSING:    'கட்டணம் செயலில் உள்ளது. சற்று நேரம் காத்திருங்கள்.',
  BROWSER_UNSUPPORTED:   'உங்கள் உலாவி ஆதரிக்கப்படவில்லை. Chrome அல்லது Firefox பயன்படுத்தவும்.',
  UNKNOWN_ERROR:         'தெரியாத பிழை ஏற்பட்டது. சற்று நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.',
} as const;

export type RazorpayErrorKey = keyof typeof RAZORPAY_ERRORS;

// ─── Custom error class ───────────────────────────────────────────────────────

export class RazorpayIntegrationError extends Error {
  public readonly key:    RazorpayErrorKey;
  /** Tamil message, safe to display directly to the user */
  public readonly tamizh: string;

  constructor(key: RazorpayErrorKey, technicalDetail?: string) {
    const tamilMessage = RAZORPAY_ERRORS[key];
    super(technicalDetail ? `${tamilMessage} [${technicalDetail}]` : tamilMessage);
    this.name   = 'RazorpayIntegrationError';
    this.key    = key;
    this.tamizh = tamilMessage;
  }
}

// ─── Script loader ────────────────────────────────────────────────────────────

/** Deduplication: a single Promise shared across concurrent callers */
let _scriptLoadPromise: Promise<void> | null = null;

/**
 * Loads checkout.js exactly once; subsequent calls return the cached Promise.
 * Safe to call from multiple places (hook mount, button click, etc.).
 *
 * @throws {RazorpayIntegrationError} SCRIPT_LOAD_FAILED | SCRIPT_TIMEOUT
 */
export function loadRazorpayScript(): Promise<void> {
  // Already on window — resolve immediately
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve();
  }

  // Return in-flight promise for concurrent callers
  if (_scriptLoadPromise) {
    return _scriptLoadPromise;
  }

  _scriptLoadPromise = new Promise<void>((resolve, reject) => {
    // Hard timeout: 15 s
    const timer = setTimeout(() => {
      _scriptLoadPromise = null;
      reject(new RazorpayIntegrationError('SCRIPT_TIMEOUT'));
    }, 15_000);

    const handleLoad = (): void => {
      clearTimeout(timer);
      resolve();
    };

    const handleError = (): void => {
      clearTimeout(timer);
      _scriptLoadPromise = null;
      reject(new RazorpayIntegrationError('SCRIPT_LOAD_FAILED'));
    };

    // Reuse an existing <script> tag (e.g. injected by next/head)
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`,
    );

    if (existing) {
      if (window.Razorpay) {
        clearTimeout(timer);
        resolve();
      } else {
        existing.addEventListener('load',  handleLoad,  { once: true });
        existing.addEventListener('error', handleError, { once: true });
      }
      return;
    }

    const script      = document.createElement('script');
    script.src        = RAZORPAY_SCRIPT_URL;
    script.async      = true;
    script.crossOrigin = 'anonymous';
    script.addEventListener('load',  handleLoad,  { once: true });
    script.addEventListener('error', handleError, { once: true });
    document.body.appendChild(script);
  });

  return _scriptLoadPromise;
}

// ─── Backend helpers ──────────────────────────────────────────────────────────

/**
 * Calls the Vaithiyam backend to create a Razorpay order.
 *
 * Route: POST /api/payments/razorpay/order
 *
 * @throws {RazorpayIntegrationError} NETWORK_ERROR | ORDER_CREATE_FAILED
 */
export async function createRazorpayOrder(
  params: CreateOrderRequest,
): Promise<CreateOrderResponse> {
  let res: Response;

  try {
    res = await fetch('/api/payments/razorpay/order', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(params),
    });
  } catch {
    throw new RazorpayIntegrationError('NETWORK_ERROR');
  }

  if (!res.ok) {
    let detail: string | undefined;
    try {
      const body = (await res.json()) as { message?: string };
      detail     = body.message;
    } catch { /* ignore parse errors */ }
    throw new RazorpayIntegrationError('ORDER_CREATE_FAILED', detail);
  }

  return res.json() as Promise<CreateOrderResponse>;
}

/**
 * Verifies the Razorpay payment signature with the Vaithiyam backend.
 * The backend validates HMAC-SHA256 and marks the order as paid.
 *
 * Route: POST /api/payments/razorpay/verify
 *
 * @throws {RazorpayIntegrationError} NETWORK_ERROR | VERIFY_FAILED
 */
export async function verifyRazorpayPayment(
  params: VerifyPaymentRequest,
): Promise<VerifyPaymentResponse> {
  let res: Response;

  try {
    res = await fetch('/api/payments/razorpay/verify', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(params),
    });
  } catch {
    throw new RazorpayIntegrationError('NETWORK_ERROR');
  }

  if (!res.ok) {
    throw new RazorpayIntegrationError('VERIFY_FAILED');
  }

  const body = (await res.json()) as VerifyPaymentResponse;

  if (!body.verified) {
    throw new RazorpayIntegrationError('VERIFY_FAILED');
  }

  return body;
}

// ─── Checkout modal launcher ──────────────────────────────────────────────────

export interface OpenCheckoutParams {
  /** Razorpay order_id from createRazorpayOrder() */
  razorpayOrderId:  string;
  /** Razorpay publishable key from createRazorpayOrder() */
  keyId:            string;
  /** Amount in **paise** */
  amountPaise:      number;
  currency?:        string;
  prefill?:         RazorpayPrefill;
  /** Pre-open on this method tab */
  preferredMethod?: RazorpayMethod;
  notes?:           Record<string, string>;
  onSuccess:        (response: RazorpayPaymentResponse) => void;
  /** User closed modal without completing payment */
  onDismiss:        () => void;
  onFailure:        (error: RazorpayPaymentError) => void;
}

/**
 * Instantiates and opens the Razorpay Checkout modal.
 * Assumes loadRazorpayScript() has already resolved.
 * Returns the instance so the caller can close it programmatically if needed.
 *
 * @throws {RazorpayIntegrationError} SCRIPT_LOAD_FAILED | INVALID_AMOUNT
 */
export function openRazorpayCheckout(params: OpenCheckoutParams): RazorpayInstance {
  if (typeof window === 'undefined' || !window.Razorpay) {
    throw new RazorpayIntegrationError('SCRIPT_LOAD_FAILED');
  }

  if (!params.amountPaise || params.amountPaise <= 0) {
    throw new RazorpayIntegrationError('INVALID_AMOUNT');
  }

  const prefill: RazorpayPrefill = {
    ...params.prefill,
    // Pre-select the preferred method tab inside the modal
    ...(params.preferredMethod ? { method: params.preferredMethod } : {}),
  };

  const options: RazorpayOptions = {
    key:         params.keyId,
    amount:      params.amountPaise,
    currency:    params.currency ?? 'INR',
    order_id:    params.razorpayOrderId,
    name:        'Vaithiyam',
    description: 'இயற்கை மருத்துவ பொருட்கள் — வைத்தியம்',
    image:       '/images/logo-razorpay.png',  // 256 × 256 square logo
    prefill,
    notes:       params.notes,

    theme: {
      color: '#1A3A2A',   // T.forestPrimary — matches the brand header
    },

    // Enable all four gateways; Razorpay surfaces only those active for this account
    method: {
      upi:        true,
      card:       true,
      netbanking: true,
      wallet:     true,
      emi:        false,  // EMI not appropriate for OTC pharmacy products
    },

    modal: {
      backdropclose: false,   // require explicit close to prevent accidental dismissal
      escape:        true,
      handleback:    true,
      confirm_close: true,    // show "are you sure?" before closing
      animation:     true,
      ondismiss:     () => params.onDismiss(),
    },

    retry: {
      enabled:   true,
      max_count: 3,
    },

    remember_customer: false, // privacy-first; don't store card/UPI on Razorpay

    handler: (response: RazorpayPaymentResponse) => {
      params.onSuccess(response);
    },
  };

  const rzp = new window.Razorpay(options);

  rzp.on('payment.failed', (error: RazorpayPaymentError) => {
    params.onFailure(error);
  });

  rzp.open();
  return rzp;
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

/**
 * Convert INR to paise.
 * Razorpay requires amounts in the smallest currency unit.
 * Uses Math.round to avoid floating-point drift.
 */
export function inrToPaise(inr: number): number {
  return Math.round(inr * 100);
}

/**
 * Format an INR amount using Tamil locale conventions.
 * Examples: 1499 → "₹1,499"   /   52999.50 → "₹52,999.50"
 */
export function formatAmountTa(inr: number): string {
  return `₹${inr.toLocaleString('ta-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Map a Vaithiyam UI payment method string to its Razorpay SDK key.
 * Returns undefined for COD (handled outside Razorpay).
 *
 * UI values (from PaymentMethodSelector.tsx):
 *   'upi' | 'debit_card' | 'credit_card' | 'net_banking' | 'cod'
 */
export function uiMethodToRazorpay(uiMethod: string): RazorpayMethod | undefined {
  const map: Record<string, RazorpayMethod> = {
    upi:         'upi',
    debit_card:  'card',
    credit_card: 'card',
    net_banking: 'netbanking',
    wallet:      'wallet',
  };
  return map[uiMethod];
}

/**
 * Map a Razorpay English error description to a Tamil user-facing message.
 * Exported so the hook and button can share this logic.
 */
export function mapRazorpayErrorToTamil(description: string): string {
  const d = description.toLowerCase();

  if (d.includes('cancel') || d.includes('dismiss'))
    return RAZORPAY_ERRORS.PAYMENT_CANCELLED;

  if (d.includes('insufficient') || d.includes('balance') || d.includes('funds'))
    return 'கணக்கில் போதுமான தொகை இல்லை. வேறு கட்டண முறை முயற்சிக்கவும்.';

  if ((d.includes('invalid') || d.includes('incorrect')) && d.includes('card'))
    return 'கார்டு தகவல் தவறானது. மீண்டும் சரிபார்க்கவும்.';

  if (d.includes('expired'))
    return 'கார்டு காலாவதியானது. புதிய கார்டு பயன்படுத்தவும்.';

  if (d.includes('declined') || d.includes('reject'))
    return 'கட்டணம் நிராகரிக்கப்பட்டது. உங்கள் வங்கியை தொடர்பு கொள்ளவும்.';

  if (d.includes('timeout') || d.includes('timed out'))
    return 'கட்டண நேரம் முடிந்தது. மீண்டும் முயற்சிக்கவும்.';

  if (d.includes('network') || d.includes('connection'))
    return RAZORPAY_ERRORS.NETWORK_ERROR;

  if (d.includes('upi') && d.includes('invalid'))
    return 'UPI ID தவறானது. சரியான UPI ID உள்ளிடுங்கள்.';

  if (d.includes('upi') && d.includes('limit'))
    return 'UPI தினசரி வரம்பு மீறியது. நாளை மீண்டும் முயற்சிக்கவும்.';

  if (d.includes('blocked') || d.includes('fraud'))
    return 'கட்டணம் தடுக்கப்பட்டது. வங்கி ஆதரவை தொடர்பு கொள்ளவும்.';

  return RAZORPAY_ERRORS.PAYMENT_FAILED;
}
