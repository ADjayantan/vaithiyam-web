import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/agasthiyan/route';

const originalGroqKey = process.env.GROQ_API_KEY;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  if (originalGroqKey === undefined) {
    delete process.env.GROQ_API_KEY;
  } else {
    process.env.GROQ_API_KEY = originalGroqKey;
  }
});

describe('POST /api/agasthiyan', () => {
  it('returns a bounded 400 response for malformed JSON', async () => {
    const response = await POST(new Request('http://localhost/api/agasthiyan', {
      method: 'POST',
      body: '{not-json',
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ code: 'INVALID_REQUEST' });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('returns 503 instead of unsafe mock medical advice when no key exists', async () => {
    delete process.env.GROQ_API_KEY;
    const response = await POST(new Request('http://localhost/api/agasthiyan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tell me about Triphala',
        history: [],
        language: 'en',
        sessionId: 'session_123456789',
      }),
    }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: 'The AI assistant is not configured yet.',
      code: 'AI_NOT_CONFIGURED',
    });
  });

  it('returns the emergency redirect even when the provider is unavailable', async () => {
    delete process.env.GROQ_API_KEY;
    const response = await POST(new Request('http://localhost/api/agasthiyan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'I have chest pain and cannot breathe',
        history: [],
        language: 'en',
        sessionId: 'session_123456789',
      }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      safetyRedirect: true,
      reply: expect.stringContaining('local emergency services'),
    });
  });

  it('passes a Groq free-tier retry interval through without exposing provider details', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ error: { message: 'private upstream detail' } }),
      { status: 429, headers: { 'Retry-After': '23' } },
    )));

    const response = await POST(new Request('http://localhost/api/agasthiyan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is the price of Triphala?',
        history: [],
        language: 'en',
        sessionId: 'session_rate_limit_123',
      }),
    }));

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('23');
    const body = await response.json();
    expect(body).toEqual({
      error: 'The free AI usage limit has been reached. Please try again shortly.',
      code: 'RATE_LIMITED',
    });
    expect(JSON.stringify(body)).not.toContain('private upstream detail');
    expect(consoleError).toHaveBeenCalledWith(
      'Agasthiyan Groq request failed.',
      { code: 'rate_limited', upstreamStatus: 429 },
    );
  });

  it('rate limits a trusted proxy address even when client session IDs rotate', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: 'Catalogue reply.' } }],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const sendRequest = (index: number) => POST(new Request(
      'http://localhost/api/agasthiyan',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-forwarded-for': '203.0.113.77',
        },
        body: JSON.stringify({
          message: 'What is the price of Triphala?',
          history: [],
          language: 'en',
          sessionId: `rotating_session_${String(index).padStart(3, '0')}`,
        }),
      },
    ));

    for (let index = 0; index < 10; index += 1) {
      const response = await sendRequest(index);
      expect(response.status).toBe(200);
    }

    const blockedResponse = await sendRequest(10);
    expect(blockedResponse.status).toBe(429);
    await expect(blockedResponse.json()).resolves.toMatchObject({ code: 'RATE_LIMITED' });
    expect(fetchMock).toHaveBeenCalledTimes(10);
  });
});
