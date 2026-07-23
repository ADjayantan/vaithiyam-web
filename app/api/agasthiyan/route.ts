import { NextResponse } from 'next/server';
import { listProducts } from '@/lib/db/products';
import {
  ChatRequestError,
  GroqServiceError,
  MAX_REQUEST_CHARS,
  buildAgasthiyanInstructions,
  buildCatalogueContext,
  consumeRateLimit,
  createAnonymousIdentifier,
  getDeterministicSafetyReply,
  parseChatRequestBody,
  requestGroqReply,
  type RateLimitRecord,
} from '@/lib/agasthiyan';

export const runtime = 'nodejs';

const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_RATE_LIMIT_KEYS = 5_000;

type GlobalWithAgasthiyanRateLimit = typeof globalThis & {
  __agasthiyanRateLimit?: Map<string, RateLimitRecord>;
};

const globalRateLimit = globalThis as GlobalWithAgasthiyanRateLimit;
const rateLimitStore =
  globalRateLimit.__agasthiyanRateLimit
  ?? (globalRateLimit.__agasthiyanRateLimit = new Map<string, RateLimitRecord>());

function json(
  body: Record<string, unknown>,
  status = 200,
  headers?: Record<string, string>,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

function pruneRateLimitStore(now: number) {
  if (rateLimitStore.size < MAX_RATE_LIMIT_KEYS) return;
  for (const [key, value] of rateLimitStore) {
    if (now >= value.resetAt) rateLimitStore.delete(key);
  }
  if (rateLimitStore.size >= MAX_RATE_LIMIT_KEYS) {
    rateLimitStore.delete(rateLimitStore.keys().next().value as string);
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_CHARS) {
      throw new ChatRequestError('Request body is too large.', 413);
    }
    body = JSON.parse(rawBody);
  } catch (error) {
    if (error instanceof ChatRequestError) {
      return json({ error: error.message, code: 'INVALID_REQUEST' }, error.status);
    }
    return json({ error: 'Request body must be valid JSON.', code: 'INVALID_REQUEST' }, 400);
  }

  let parsed;
  try {
    parsed = parseChatRequestBody(body);
  } catch (error) {
    if (error instanceof ChatRequestError) {
      return json({ error: error.message, code: 'INVALID_REQUEST' }, error.status);
    }
    return json({ error: 'Request is invalid.', code: 'INVALID_REQUEST' }, 400);
  }

  const safetyReply = getDeterministicSafetyReply(parsed.message, parsed.language);
  if (safetyReply) {
    return json({ reply: safetyReply, safetyRedirect: true });
  }

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return json(
      {
        error: parsed.language === 'ta'
          ? 'AI உதவியாளர் தற்போது அமைக்கப்படவில்லை.'
          : 'The AI assistant is not configured yet.',
        code: 'AI_NOT_CONFIGURED',
      },
      503,
    );
  }

  const forwardedFor = (
    request.headers.get('x-vercel-forwarded-for')
    ?? request.headers.get('x-forwarded-for')
  )?.split(',')[0]?.trim();
  const rawIdentifier = forwardedFor
    ?? parsed.sessionId
    ?? request.headers.get('user-agent')
    ?? 'anonymous';
  const anonymousIdentifier = createAnonymousIdentifier(
    rawIdentifier,
    process.env.AI_RATE_LIMIT_SALT?.trim() || apiKey,
  );

  const now = Date.now();
  pruneRateLimitStore(now);
  const rateLimit = consumeRateLimit(
    rateLimitStore,
    anonymousIdentifier,
    now,
    RATE_LIMIT,
    RATE_LIMIT_WINDOW_MS,
  );
  if (!rateLimit.allowed) {
    return json(
      {
        error: parsed.language === 'ta'
          ? 'சற்று அதிகமான கேள்விகள் அனுப்பப்பட்டுள்ளன. ஒரு நிமிடம் கழித்து முயலவும்.'
          : 'Too many messages were sent. Please try again in a minute.',
        code: 'RATE_LIMITED',
      },
      429,
      { 'Retry-After': String(rateLimit.retryAfterSeconds) },
    );
  }

  try {
    const products = await listProducts();
    const catalogueContext = buildCatalogueContext(products, parsed.message);
    const instructions = buildAgasthiyanInstructions(catalogueContext, parsed.language);
    const reply = await requestGroqReply({
      apiKey,
      model: process.env.GROQ_MODEL?.trim() || undefined,
      instructions,
      message: parsed.message,
      history: parsed.history,
    });

    return json({ reply });
  } catch (error) {
    if (error instanceof GroqServiceError) {
      console.error('Agasthiyan Groq request failed.', {
        code: error.code,
        upstreamStatus: error.upstreamStatus,
      });
      if (error.code === 'rate_limited') {
        const retryAfterSeconds = error.retryAfterSeconds ?? 60;
        return json(
          {
            error: parsed.language === 'ta'
              ? 'இலவச AI பயன்பாட்டு வரம்பு தற்போது எட்டப்பட்டுள்ளது. சிறிது நேரம் கழித்து முயலவும்.'
              : 'The free AI usage limit has been reached. Please try again shortly.',
            code: 'RATE_LIMITED',
          },
          429,
          { 'Retry-After': String(retryAfterSeconds) },
        );
      }
    } else {
      console.error('Agasthiyan catalogue or server error.');
    }

    return json(
      {
        error: parsed.language === 'ta'
          ? 'AI உதவியாளர் தற்போது பதிலளிக்க முடியவில்லை. சிறிது நேரம் கழித்து முயலவும்.'
          : 'The AI assistant cannot respond right now. Please try again later.',
        code: 'AI_UNAVAILABLE',
      },
      502,
    );
  }
}
