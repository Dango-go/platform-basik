import React, { useRef } from 'react';

interface YamlCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  minHeight?: string;
  className?: string;
}

export const YamlCodeEditor: React.FC<YamlCodeEditorProps> = ({
  value,
  onChange,
  placeholder = "apiVersion: v1\nkind: ...",
  minHeight = "280px",
  className = ""
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const highlightYamlLine = (line: string, lineIndex: number): React.ReactNode => {
    if (line === '') {
      return <span key={lineIndex} className="block">&#8203;</span>;
    }

    // 1. Full line comment
    const trimmed = line.trimStart();
    if (trimmed.startsWith('#')) {
      const leadingSpaces = line.substring(0, line.length - trimmed.length);
      return (
        <span key={lineIndex} className="block">
          <span>{leadingSpaces}</span>
          <span className="text-slate-500 italic">{trimmed}</span>
        </span>
      );
    }

    // 2. Inline comment extraction
    let codePart = line;
    let commentPart = '';
    const commentIdx = line.indexOf(' #');
    if (commentIdx !== -1) {
      codePart = line.substring(0, commentIdx);
      commentPart = line.substring(commentIdx);
    }

    // 3. Parse key: value
    // Matches: [indent][- ][key]: [value]
    const keyValMatch = codePart.match(/^(\s*(?:-\s+)?)([\w\.\-\/]+)(\s*:\s*)(.*)$/);
    if (keyValMatch) {
      const [, prefix, key, colon, val] = keyValMatch;
      return (
        <span key={lineIndex} className="block">
          <span className="text-slate-400">{prefix}</span>
          <span className="text-sky-300 font-bold">{key}</span>
          <span className="text-slate-400 font-normal">{colon}</span>
          {formatYamlValue(val)}
          {commentPart && <span className="text-slate-500 italic">{commentPart}</span>}
        </span>
      );
    }

    // 4. List item without explicit key-value (e.g., - value)
    const listMatch = codePart.match(/^(\s*-\s+)(.*)$/);
    if (listMatch) {
      const [, prefix, val] = listMatch;
      return (
        <span key={lineIndex} className="block">
          <span className="text-sky-400 font-bold">{prefix}</span>
          {formatYamlValue(val)}
          {commentPart && <span className="text-slate-500 italic">{commentPart}</span>}
        </span>
      );
    }

    // Default line formatting
    return (
      <span key={lineIndex} className="block">
        {formatYamlValue(codePart)}
        {commentPart && <span className="text-slate-500 italic">{commentPart}</span>}
      </span>
    );
  };

  const formatYamlValue = (val: string): React.ReactNode => {
    if (!val) return null;
    const trimmed = val.trim();

    // Quoted strings: "...", '...'
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return <span className="text-amber-300 font-medium">{val}</span>;
    }

    // Booleans / null
    if (['true', 'false', 'null', 'yes', 'no'].includes(trimmed.toLowerCase())) {
      return <span className="text-purple-400 font-bold">{val}</span>;
    }

    // Numbers
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return <span className="text-amber-400 font-semibold">{val}</span>;
    }

    // Default string / identifier value
    return <span className="text-emerald-300">{val}</span>;
  };

  const lines = value.split('\n');

  return (
    <div className={`relative rounded-xl border border-slate-800 bg-brand-dark/95 overflow-hidden shadow-inner focus-within:ring-2 focus-within:ring-brand-sky focus-within:border-brand-sky ${className}`}>
      {/* Underlying Syntax Highlighted Pre/Code */}
      <pre
        ref={preRef}
        aria-hidden="true"
        style={{ minHeight }}
        className="absolute inset-0 p-4 font-mono text-xs leading-relaxed overflow-hidden pointer-events-none whitespace-pre m-0 select-none z-0 overflow-y-auto overflow-x-auto"
      >
        <code>
          {value ? (
            lines.map((line, idx) => highlightYamlLine(line, idx))
          ) : (
            <span className="text-slate-600 italic">{placeholder}</span>
          )}
        </code>
      </pre>

      {/* Overlaid Interactive Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        style={{ minHeight }}
        className="relative z-10 w-full h-full p-4 font-mono text-xs leading-relaxed bg-transparent text-transparent caret-brand-sky focus:outline-none resize-y selection:bg-brand-sky/40 selection:text-white font-semibold m-0"
      />
    </div>
  );
};
