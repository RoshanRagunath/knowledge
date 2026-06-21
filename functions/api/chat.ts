// Cloudflare Pages Function: POST /api/chat
//
// Answers questions grounded in the knowledge base. The entire KB is small
// enough (~6 docs) to inject into Claude's system prompt on every request, so
// there is no vector store or retrieval step — see buildContext() for the seam
// where retrieval would slot in once the KB outgrows the context window.
//
// The streamed answer goes straight back to the browser as SSE. A copy of each
// completed exchange is sent to an optional n8n webhook (fire-and-forget) for
// logging and "question not covered" alerts.

import Anthropic from '@anthropic-ai/sdk';
import { KB } from './kb-content';

interface Env {
  ANTHROPIC_API_KEY: string;
  N8N_WEBHOOK_URL?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const MODEL = 'claude-haiku-4-5';
const MAX_TOKENS = 1024;
const MAX_MESSAGES = 10;
const MAX_CHARS_PER_MESSAGE = 2000;

// Hidden marker Claude appends when a question isn't covered by the KB. Stripped
// from the user-facing reply; its presence drives the n8n gap alert.
const SENTINEL = '[[NOT_IN_KB]]';

const INSTRUCTIONS = `You are the assistant for Roshan Ragunath's knowledge base — a collection of lessons learned and best-practice notes about Claude Code, n8n, and Betty Blocks.

Rules:
- Answer ONLY from the knowledge base content provided below. Do not rely on outside knowledge.
- Be concise and practical. When relevant, point the reader to the specific doc by its path (e.g. "see docs/claude-code/cheatsheet.md").
- Format answers in Markdown. Use code blocks for commands and code.
- If the answer is not contained in the knowledge base, say so briefly, suggest checking the GitHub repo (https://github.com/RoshanRagunath/knowledge) or roshanragunath.com, and append the exact marker ${SENTINEL} on its own line at the very end of your reply. Append this marker ONLY when the knowledge base does not cover the question.`;

/**
 * Returns the context Claude should answer from. Today: the full KB.
 *
 * GROWTH SEAM — when the KB approaches ~100 docs / ~150K tokens, replace the
 * body with a retrieval call (Cloudflare Vectorize or AutoRAG) keyed off the
 * latest user message. Nothing else in this Function needs to change.
 */
function buildContext(_messages: ChatMessage[]): string {
  return KB;
}

function validate(body: unknown): ChatMessage[] | null {
  if (!body || typeof body !== 'object') return null;
  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) return null;
  if (messages.length > MAX_MESSAGES) return null;
  const out: ChatMessage[] = [];
  for (const m of messages) {
    if (!m || typeof m !== 'object') return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (role !== 'user' && role !== 'assistant') return null;
    if (typeof content !== 'string' || content.length === 0) return null;
    if (content.length > MAX_CHARS_PER_MESSAGE) return null;
    out.push({ role, content });
  }
  // First and last message must be from the user.
  if (out[0].role !== 'user' || out[out.length - 1].role !== 'user') return null;
  return out;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'Server not configured.' }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const messages = validate(body);
  if (!messages) {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let full = '';
      let pending = '';

      const send = (text: string) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
      const done = () => controller.enqueue(encoder.encode('data: [DONE]\n\n'));

      try {
        const claudeStream = client.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: [
            { type: 'text', text: INSTRUCTIONS },
            {
              type: 'text',
              text: `Knowledge base:\n\n${buildContext(messages)}`,
              // Cache the large KB prefix — repeated questions read it at ~0.1x cost.
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages,
        });

        for await (const event of claudeStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const delta = event.delta.text;
            full += delta;
            pending += delta;
            // Hold back a full sentinel's worth of trailing chars so an
            // end-of-stream sentinel never leaks to the client mid-stream.
            if (pending.length > SENTINEL.length) {
              const chunk = pending
                .slice(0, pending.length - SENTINEL.length)
                .split(SENTINEL)
                .join('');
              pending = pending.slice(pending.length - SENTINEL.length);
              if (chunk) send(chunk);
            }
          }
        }

        const finalChunk = pending.split(SENTINEL).join('');
        if (finalChunk) send(finalChunk);
        done();

        // Fire-and-forget side-channel: log every exchange, flag KB gaps.
        if (env.N8N_WEBHOOK_URL) {
          const notInKb = full.includes(SENTINEL);
          const payload = {
            question: messages[messages.length - 1].content,
            answer: full.split(SENTINEL).join('').trim(),
            notInKb,
            timestamp: new Date().toISOString(),
          };
          context.waitUntil(
            fetch(env.N8N_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(payload),
            }).catch(() => {
              /* never let logging break the chat */
            })
          );
        }
      } catch (err) {
        send(`\n\n_Sorry — something went wrong generating a response._`);
        done();
        // eslint-disable-next-line no-console
        console.error('chat error:', err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      connection: 'keep-alive',
    },
  });
};
