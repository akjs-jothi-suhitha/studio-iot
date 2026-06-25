import React from 'react';
import Editor from '@monaco-editor/react';
import { Lock } from 'lucide-react';

interface SimulationCodePanelProps {
  code: string;
  boardName: string;
  isSimulating: boolean;
}

/** Read-only code view shown during circuit simulation */
export const SimulationCodePanel: React.FC<SimulationCodePanelProps> = ({
  code,
  boardName,
  isSimulating,
}) => {
  if (!isSimulating) return null;

  return (
    <div className="absolute right-4 top-16 z-30 flex w-80 flex-col overflow-hidden rounded-xl border border-slate-700 bg-[#1e1e1e] shadow-2xl">
      <div className="flex items-center gap-2 border-b border-slate-700 px-3 py-2">
        <Lock className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Running: {boardName}
        </span>
      </div>
      <div className="h-40">
        <Editor
          height="100%"
          language="cpp"
          value={code}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 11,
            lineNumbers: 'off',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 8 },
            domReadOnly: true,
          }}
        />
      </div>
    </div>
  );
};
