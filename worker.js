/**
 * Cloudflare Worker: meal-planner AI proxy.
 *
 * Accepts:  POST { "prompt": "..." }
 * Returns:  { "text": "..." }
 *
 * Required Worker secret:
 *   ANTHROPIC_API_KEY   (set with: wrangler secret put ANTHROPIC_API_KEY)
 *
 * Optional Worker variable:
 *   ALLOWED_ORIGIN      e.g. "https://your-username.github.io"
 *                       Defaults to "*" if unset (any site can call your worker).
 *                       Lock this down once your Pages URL is live.
 */

export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || '*';

    const corsHeaders = {
      'access-control-allow-origin': allowedOrigin,
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '86400',
    };

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, corsHeaders);
    }

    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: 'Server is missing ANTHROPIC_API_KEY. Set it with `wrangler secret put ANTHROPIC_API_KEY`.' }, 500, corsHeaders);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Body must be valid JSON.' }, 400, corsHeaders);
    }

    const prompt = (body && typeof body.prompt === 'string') ? body.prompt : '';
    if (!prompt) {
      return json({ error: 'Missing "prompt" string in body.' }, 400, corsHeaders);
    }
    if (prompt.length > 8000) {
      return json({ error: 'Prompt is too long (max 8000 chars).' }, 413, corsHeaders);
    }

    // Call Anthropic
    let resp;
    try {
      resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
    } catch (e) {
      return json({ error: 'Network error calling Anthropic: ' + (e?.message || 'unknown') }, 502, corsHeaders);
    }

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      return json({ error: 'Anthropic API error', status: resp.status, body: errText.slice(0, 500) }, 502, corsHeaders);
    }

    const data = await resp.json();
    const text = (data?.content || [])
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')
      .trim();

    return json({ text }, 200, corsHeaders);
  },
};

function json(payload, status, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
  });
}
