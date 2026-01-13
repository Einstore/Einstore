type CodeBlockProps = {
  code: string;
  className?: string;
  onCopy?: () => void;
};

const CodeBlock = ({ code, className = "", onCopy }: CodeBlockProps) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(code);
      onCopy?.();
    } catch {
      // Ignore copy failures (permissions, unsupported browsers).
    }
  };

  return (
    <pre
      className={`whitespace-pre-wrap rounded-lg bg-slate-900 p-4 text-xs text-slate-100 ${className} cursor-pointer`}
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
      <code>{code}</code>
    </pre>
  );
};

export default CodeBlock;
