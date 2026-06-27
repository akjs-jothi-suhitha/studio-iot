import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, X, Loader2, User, Copy } from 'lucide-react';
import { api } from '../services/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  code?: string | null;
}

interface AiAssistantProps {
  boardType: string;
  existingCode: string;
  componentNames: string[];
  onApplyCode: (code: string) => void;
  onClose: () => void;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  boardType,
  existingCode,
  componentNames,
  onApplyCode,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your IoT coding assistant. I can help with wiring, HiveMQ MQTT setup, and ${boardType.replace(/_/g, ' ')} sketches. What would you like to build?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    'Explain how to wire the gas sensor to ESP32',
    'Fix my compile error',
    'Add HiveMQ MQTT telemetry to my sketch',
    'Blink LED and read sensor every 5 seconds',
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: userText };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const contextMessages = nextMessages.map((m) => ({ role: m.role, content: m.content }));
      if (existingCode?.trim() && contextMessages.length <= 2) {
        contextMessages[contextMessages.length - 1].content += `\n\nCurrent sketch:\n${existingCode.slice(0, 1500)}`;
      }

      const result = await api.aiChat({
        messages: contextMessages,
        boardType,
        components: componentNames,
      });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.reply, code: result.code },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">AI Chat</div>
            <div className="text-[10px] text-slate-500">{boardType.replace(/_/g, ' ')}</div>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
              msg.role === 'user' ? 'bg-blue-600' : 'bg-violet-600'
            }`}>
              {msg.role === 'user' ? <User className="h-3 w-3 text-white" /> : <Bot className="h-3 w-3 text-white" />}
            </div>
            <div className={`max-w-[85%] rounded-lg px-2.5 py-2 text-[11px] leading-relaxed shadow-sm ${
              msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.code && (
                <div className="mt-2 border-t border-slate-200 pt-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase text-emerald-400">Code</span>
                    <button
                      type="button"
                      onClick={() => onApplyCode(msg.code!)}
                      className="flex items-center gap-1 rounded bg-emerald-700/60 px-1.5 py-0.5 text-[9px] text-emerald-200 hover:bg-emerald-700"
                    >
                      <Copy className="h-2.5 w-2.5" /> Insert
                    </button>
                  </div>
                  <pre className="max-h-32 overflow-auto rounded bg-slate-100 p-1.5 font-mono text-[9px] text-slate-800">
                    {msg.code.slice(0, 600)}{msg.code.length > 600 ? '...' : ''}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...
          </div>
        )}
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-2.5 py-2 text-[11px] text-red-300">
            {error}
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="shrink-0 border-t border-slate-200 bg-white px-3 py-2">
          <div className="mb-1.5 text-[9px] font-bold uppercase text-slate-500">Suggestions</div>
          <div className="flex flex-wrap gap-1">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => sendMessage(s)}
                disabled={loading}
                className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[9px] text-slate-600 hover:border-violet-300 hover:bg-violet-50"
              >
                <Sparkles className="h-2.5 w-2.5 text-violet-500" />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="shrink-0 border-t border-slate-200 bg-white p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your circuit or code..."
            disabled={loading}
            className="min-w-0 flex-1 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-violet-500 disabled:opacity-50"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          />
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
