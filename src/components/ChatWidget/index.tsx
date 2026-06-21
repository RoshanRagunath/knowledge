import React, {useState, useRef, useEffect, useCallback} from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './styles.module.css';

type Role = 'user' | 'assistant';
interface Message {
  role: Role;
  content: string;
}

const GREETING =
  "Hi! Ask me anything about the notes in this knowledge base — Claude Code, n8n, Betty Blocks.";

export default function ChatWidget(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({top: listRef.current.scrollHeight});
  }, [messages, open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;

    const history = [...messages, {role: 'user' as Role, content: text}];
    setMessages([...history, {role: 'assistant', content: ''}]);
    setInput('');
    setBusy(true);

    const appendToLast = (chunk: string) =>
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: 'assistant',
          content: next[next.length - 1].content + chunk,
        };
        return next;
      });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({messages: history}),
      });

      if (!res.ok || !res.body) {
        appendToLast('Sorry — the assistant is unavailable right now.');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Parse the SSE stream: events are separated by a blank line.
      for (;;) {
        const {done, value} = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, {stream: true});

        let sep: number;
        while ((sep = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          const line = rawEvent.replace(/^data: /, '');
          if (line === '[DONE]') continue;
          try {
            const {text} = JSON.parse(line) as {text?: string};
            if (text) appendToLast(text);
          } catch {
            /* ignore malformed chunk */
          }
        }
      }
    } catch {
      appendToLast('Sorry — something went wrong.');
    } finally {
      setBusy(false);
    }
  }, [input, busy, messages]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.fab}
        aria-label={open ? 'Close chat' : 'Ask the knowledge base'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}>
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Knowledge base assistant">
          <div className={styles.header}>Ask the knowledge base</div>

          <div className={styles.messages} ref={listRef}>
            {messages.length === 0 && <div className={styles.greeting}>{GREETING}</div>}
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === 'user' ? styles.user : styles.assistant}>
                {m.role === 'assistant' ? (
                  m.content ? (
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  ) : (
                    <span className={styles.typing}>…</span>
                  )
                ) : (
                  m.content
                )}
              </div>
            ))}
          </div>

          <div className={styles.inputRow}>
            <textarea
              className={styles.input}
              value={input}
              placeholder="Ask a question…"
              rows={1}
              maxLength={2000}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button
              type="button"
              className={styles.send}
              onClick={() => void send()}
              disabled={busy || !input.trim()}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
