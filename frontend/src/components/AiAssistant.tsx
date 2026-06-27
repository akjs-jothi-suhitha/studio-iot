import React, { useState } from 'react';
import { Bot, Send, Sparkles, X, Loader2 } from 'lucide-react';
import { api } from '../services/api';

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
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastGenerated, setLastGenerated] = useState('');

  const suggestions = [
    'Blink built-in LED every second',
    'Read DHT11 and print temperature to Serial',
    'Control servo with potentiometer on A0',
    'Connect to WiFi and send telemetry to cloud',
  ];

  const handleGenerate = async (text?: string) => {
    const userPrompt = (text || prompt).trim();
    if (!userPrompt) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.aiGenerate({
        prompt: userPrompt,
        boardType,
        existingCode: existingCode || undefined,
        components: componentNames,
      });
      setLastGenerated(result.code);
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-[#3c3c3c] bg-[#1a1a1a]">
      <div className="flex shrink-0 items-center justify-between border-b border-[#3c3c3c] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">AI Code Bot</div>
            <div className="text-[10px] text-slate-500">{boardType.replace(/_/g, ' ')}</div>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-[#2d2d2d] hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="mb-3 text-[11px] leading-relaxed text-slate-400">
          Describe what you want your sketch to do. The AI generates Arduino/ESP code based on your circuit components.
        </p>

        <div className="mb-3 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Quick prompts</div>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleGenerate(s)}
              disabled={loading}
              className="flex w-full items-start gap-1.5 rounded-md border border-[#333] bg-[#252526] px-2 py-1.5 text-left text-[10px] text-slate-300 transition hover:border-violet-600/50 hover:bg-[#2d2d2d] disabled:opacity-50"
            >
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-violet-400" />
              {s}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 px-2.5 py-2 text-[11px] text-red-300">
            {error}
          </div>
        )}

        {lastGenerated && (
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-emerald-400">Generated code</span>
              <button
                type="button"
                onClick={() => onApplyCode(lastGenerated)}
                className="rounded bg-emerald-700/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-200 hover:bg-emerald-700"
              >
                Insert into editor
              </button>
            </div>
            <pre className="max-h-48 overflow-auto rounded-md border border-[#333] bg-[#0d0d0d] p-2 font-mono text-[10px] leading-relaxed text-green-400">
              {lastGenerated.slice(0, 800)}{lastGenerated.length > 800 ? '…' : ''}
            </pre>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[#3c3c3c] p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your sketch…"
            disabled={loading}
            className="min-w-0 flex-1 rounded-md border border-[#3c3c3c] bg-[#252526] px-2.5 py-2 text-xs text-white outline-none focus:border-violet-500 disabled:opacity-50"
            onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
          />
          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={loading || !prompt.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-2 text-[9px] text-slate-600">Requires OPENAI_API_KEY in backend/.env</p>
      </div>
    </div>
  );
};
