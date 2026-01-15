import { useEffect, useMemo, useRef, useState } from "react";

import FormField from "./FormField";
import Icon, { type IconName } from "./Icon";
import { useI18n } from "../lib/i18n";

type IconSelectOption = {
  value: string;
  label: string;
  icon?: IconName;
};

type IconSelectFieldProps = {
  id: string;
  label: string;
  options: IconSelectOption[];
  value: string;
  hint?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

const IconSelectField = ({
  id,
  label,
  options,
  value,
  hint,
  disabled,
  onChange,
}: IconSelectFieldProps) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value]
  );

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <FormField label={label} htmlFor={id} hint={hint}>
      <div ref={containerRef} className="relative">
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          className="flex h-11 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-700"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2">
            {selected?.icon ? <Icon name={selected.icon} className="h-4 w-4" /> : null}
            {selected?.label ?? t("common.select", "Select")}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">▼</span>
        </button>
        {open ? (
          <div
            role="listbox"
            className="absolute z-20 mt-2 w-full rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            {options.map((option) => {
              const isActive = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {option.icon ? (
                    <Icon name={option.icon} className="h-4 w-4" />
                  ) : null}
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </FormField>
  );
};

export default IconSelectField;
