import { useMemo, useState } from "react";
import Icon from "./Icon";

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  disabled?: boolean;
};

const cleanTag = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

const TagInput = ({ value, onChange, suggestions = [], placeholder, disabled }: TagInputProps) => {
  const [input, setInput] = useState("");

  const normalized = useMemo(() => value.map((tag) => tag.toLowerCase()), [value]);

  const addTag = (raw: string) => {
    const cleaned = cleanTag(raw);
    if (!cleaned) return;
    if (normalized.includes(cleaned.toLowerCase())) {
      setInput("");
      return;
    }
    onChange([...value, cleaned]);
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((item) => item !== tag));
  };

  const availableSuggestions = useMemo(
    () =>
      suggestions
        .filter((item) => !normalized.includes(item.toLowerCase()))
        .filter((item) => (input ? item.toLowerCase().includes(input.toLowerCase()) : true))
        .slice(0, 6),
    [suggestions, normalized, input]
  );

  return (
    <div className="space-y-2">
      <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/40 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800">
        {value.map((tag) => (
          <span
            key={tag}
            className="group inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-100"
          >
            {tag}
            <button
              type="button"
              className="text-indigo-500 transition-colors hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:text-indigo-200"
              onClick={() => removeTag(tag)}
              aria-label={`Remove tag ${tag}`}
              disabled={disabled}
            >
              <Icon name="close" className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "," || event.key === "Tab") {
              event.preventDefault();
              addTag(input);
            } else if (event.key === "Backspace" && !input && value.length) {
              removeTag(value[value.length - 1]);
            }
          }}
          className="h-8 flex-1 min-w-[140px] bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-100 dark:placeholder:text-slate-500"
          placeholder={placeholder ?? "Add a tag and press Enter"}
          disabled={disabled}
        />
      </div>
      {availableSuggestions.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Suggestions
          </span>
          {availableSuggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              className="h-8 rounded-full border border-slate-200 px-3 text-xs font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-slate-700 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-200"
              onClick={() => addTag(tag)}
              disabled={disabled}
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default TagInput;
