type CodeBlockProps = {
  code: string;
  className?: string;
};

const CodeBlock = ({ code, className = "" }: CodeBlockProps) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(code);
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
