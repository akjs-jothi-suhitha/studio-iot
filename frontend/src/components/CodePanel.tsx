import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, X } from 'lucide-react';
import { CODE_PRESETS } from '../utils/codePresets';
import Editor from '@monaco-editor/react';

interface CodePanelProps {
  code: string;
  onChangeCode: (code: string) => void;
  serialLogs: string[];
  onClearSerial: () => void;
  onLoadTemplate: (templateKey: string) => void;
  isSimulating: boolean;
}

export const CodePanel: React.FC<CodePanelProps> = ({
  code,
  onChangeCode,
  serialLogs,
  onClearSerial,
  onLoadTemplate,
  isSimulating,
}) => {
  const [templateKey, setTemplateKey] = useState<string>('blink');
  const [activeTab, setActiveTab] = useState<'code' | 'serial'>('code');
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Handle template switch
  const handleTemplateChange = (key: string) => {
    setTemplateKey(key);
    onLoadTemplate(key);
  };

  // Scroll to bottom of serial monitor
  useEffect(() => {
    if (activeTab === 'serial' && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialLogs, activeTab]);

  return (
    <div className="w-[550px] border-l border-slate-200 bg-white flex flex-col h-full select-none z-10 shadow-lg">
      
      {/* 1. Header with Close Button */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-800">Code Editor</h2>
        <button className="text-slate-400 hover:text-slate-600 transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Top Toolbar */}
      <div className="flex items-center space-x-3 px-4 py-2 bg-white border-b border-slate-200">
        <select 
          className="border border-slate-300 rounded px-2 py-1.5 text-sm text-slate-700 focus:outline-none bg-white hover:bg-slate-50 cursor-pointer"
        >
          <option>Text</option>
          <option>Blocks</option>
          <option>Blocks + Text</option>
        </select>

        <button className="p-1.5 text-slate-500 hover:text-slate-700 transition" title="Download Code">
          <Download className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-slate-500 hover:text-slate-700 transition" title="Upload to Board">
          <Upload className="w-4 h-4" />
        </button>

        <select 
          className="border border-slate-300 rounded px-2 py-1.5 text-sm text-slate-700 focus:outline-none bg-white hover:bg-slate-50 cursor-pointer"
        >
          <option>A Medium</option>
          <option>A Small</option>
          <option>A Large</option>
        </select>

        <select 
          value={templateKey}
          onChange={(e) => handleTemplateChange(e.target.value)}
          disabled={isSimulating}
          className="border border-slate-300 rounded px-2 py-1.5 text-sm text-slate-700 focus:outline-none bg-white hover:bg-slate-50 flex-1 cursor-pointer"
        >
          <option value="blink">1 (Arduino Uno R3) - LED Verification Circuit</option>
          <option value="gas_alarm">1 (Arduino Uno R3) - Gas Alarm</option>
          <option value="light_control">1 (Arduino Uno R3) - Light Control</option>
        </select>
      </div>

      {/* 3. Tabs */}
      <div className="flex border-b border-slate-200 bg-white">
        <button
          onClick={() => setActiveTab('code')}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'code'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Code
        </button>
        <button
          onClick={() => setActiveTab('serial')}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'serial'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Serial Monitor
        </button>
      </div>

      {/* 4. Content Area */}
      <div className="flex-1 overflow-hidden relative bg-white">
        {activeTab === 'code' ? (
          <div className="w-full h-full">
            <Editor
              height="100%"
              defaultLanguage="cpp"
              language="cpp"
              value={code}
              onChange={(value) => onChangeCode(value || '')}
              theme="vs-light"
              options={{
                readOnly: false,
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col font-mono text-[13px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-1 text-slate-700 bg-slate-50">
              {serialLogs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
              {serialLogs.length === 0 && (
                <div className="text-slate-400 italic">No output logs.</div>
              )}
              <div ref={logsEndRef} />
            </div>
            <div className="p-3 border-t border-slate-200 bg-white flex justify-end">
              <button 
                onClick={onClearSerial}
                className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded hover:bg-slate-50 transition"
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
