type CodeBlockProps = {
  code: string;
  className?: string;
};

const CodeBlock = ({ code, className = "" }: CodeBlockProps) => {
  return (
    <pre
      className={`whitespace-pre-wrap rounded-lg bg-slate-900 p-4 text-xs text-slate-100 ${className}`}
    >
      <code>{code}</code>
    </pre>
  );
};

export default CodeBlock;
