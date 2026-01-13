type CodeBlockProps = {
  code: string;
  className?: string;
  onCopy?: () => void;
};

const CodeBlock = ({ code, className = "", onCopy }: CodeBlockProps) => {
  const normalizedCode = code.replace(/\n{2,}/g, "\n").trimEnd();
  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(normalizedCode);
      onCopy?.();
    } catch {
      // Ignore copy failures (permissions, unsupported browsers).
    }
  };

  return (
    <div className="relative">
      <pre
        className={`whitespace-pre overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100 ${className} cursor-pointer`}
        role="button"
        tabIndex={0}
        onClick={handleCopy}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleCopy();
          }
        }}
        aria-label="Copy code"
      >
        <code>{normalizedCode}</code>
      </pre>
      <button
        type="button"
        className="absolute right-2 top-2 rounded-md bg-slate-800/80 p-1 text-slate-200 transition-colors hover:bg-slate-700/80"
        onClick={(event) => {
          event.stopPropagation();
          handleCopy();
        }}
        aria-label="Copy code"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 448 512"
          className="h-3.5 w-3.5"
          fill="currentColor"
        >
          <path d="M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-35.3 28.7-64 64-64l112 0c8.8 0 16 7.2 16 16l0 48 48 0c8.8 0 16 7.2 16 16l0 240c0 8.8-7.2 16-16 16zM160 352l-48 0c-17.7 0-32-14.3-32-32l0-224-16 0c-35.3 0-64 28.7-64 64l0 288c0 35.3 28.7 64 64 64l224 0c35.3 0 64-28.7 64-64l0-16-176 0c-8.8 0-16-7.2-16-16zm64-320l0 256 160 0 0-184-48 0c-35.3 0-64-28.7-64-64l0-48-48 0z" />
        </svg>
      </button>
    </div>
  );
};

export default CodeBlock;
