import React, { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface CodePanelProps {
  code: string;
  onChangeCode: (code: string) => void;
  serialLogs: string[];
  onClearSerial: () => void;
  onLoadTemplate: (templateKey: string) => void;
  onClose: () => void;
  isSimulating: boolean;
}

const TEMPLATES = [
  { key: 'blink', label: 'Blink — LED on pin 13' },
  { key: 'gas_alarm', label: 'Gas alarm (Tinkercad)' },
  { key: 'gas_alarm_iot', label: 'Gas alarm + HiveMQ (ESP32)' },
  { key: 'light_control', label: 'Light control with LDR' },
];

export const CodePanel: React.FC<CodePanelProps> = ({
  code,
  onChangeCode,
  serialLogs,
  onClearSerial,
  onLoadTemplate,
  onClose,
  isSimulating,
}) => {
  const [templateKey, setTemplateKey] = useState<string>('blink');
  const [activeTab, setActiveTab] = useState<'code' | 'serial'>('code');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const handleTemplateChange = (key: string) => {
    setTemplateKey(key);
    onLoadTemplate(key);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'sketch.ino';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (activeTab === 'serial' && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialLogs, activeTab]);

  return (
    <div className="flex h-full w-[min(480px,38vw)] min-w-[320px] shrink-0 flex-col border-l border-[#aeb4bc] bg-[#f4f6f8] shadow-2xl shadow-black/60">
      <div className="flex items-center justify-between border-b border-[#aeb4bc] bg-[#dfe3e8] px-3 py-2.5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Arduino</div>
          <h2 className="text-sm font-semibold text-slate-100">Code & Serial</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1.5 text-slate-500 transition hover:bg-[#15181e] hover:text-slate-100"
          title="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-[#aeb4bc] bg-[#15181e] px-3 py-2">
        <select
          value={templateKey}
          onChange={(event) => handleTemplateChange(event.target.value)}
          disabled={isSimulating}
          className="min-w-0 flex-1 rounded border border-[#323844] bg-[#15181e] px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500 disabled:opacity-50"
        >
          {TEMPLATES.map((template) => (
            <option key={template.key} value={template.key}>
              {template.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded border border-[#323844] bg-[#15181e] p-1.5 text-slate-300 transition hover:bg-[#1e222a]"
          title="Download sketch"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      <div className="flex border-b border-[#aeb4bc] bg-[#eef1f4]">
        <button
          type="button"
          onClick={() => setActiveTab('code')}
          className={`flex-1 py-2 text-xs font-semibold transition ${
            activeTab === 'code'
              ? 'border-b-2 border-sky-600 bg-[#15181e] text-sky-700'
              : 'text-slate-500 hover:text-slate-200'
          }`}
        >
          Code
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('serial')}
          className={`flex-1 py-2 text-xs font-semibold transition ${
            activeTab === 'serial'
              ? 'border-b-2 border-sky-600 bg-[#15181e] text-sky-700'
              : 'text-slate-500 hover:text-slate-200'
          }`}
        >
          Serial Monitor
        </button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {activeTab === 'code' ? (
          <Editor
            height="100%"
            defaultLanguage="cpp"
            language="cpp"
            value={code}
            onChange={(value) => onChangeCode(value || '')}
            theme="vs-dark"
            options={{
              readOnly: isSimulating,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 12 },
            }}
          />
        ) : (
          <div className="flex h-full flex-col bg-[#1e1e1e] font-mono text-[12px] text-green-400">
            <div className="flex-1 overflow-y-auto p-3">
              {serialLogs.map((log, index) => (
                <div key={`${log}-${index}`} className="leading-5">
                  {log}
                </div>
              ))}
              {serialLogs.length === 0 && (
                <div className="italic text-slate-500">Run simulation to see serial output.</div>
              )}
              <div ref={logsEndRef} />
            </div>
            <div className="flex justify-end border-t border-slate-700 bg-[#252526] p-2">
              <button
                type="button"
                onClick={onClearSerial}
                className="rounded px-3 py-1 text-xs text-slate-300 transition hover:bg-slate-700"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
