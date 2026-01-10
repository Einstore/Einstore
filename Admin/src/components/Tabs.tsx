import type { ReactNode } from "react";

export type TabItem = {
  id: string;
  label: string;
  content: ReactNode;
};

type TabsProps = {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
};

const Tabs = ({ items, activeId, onChange }: TabsProps) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`h-11 rounded-full px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 ${
              activeId === item.id
                ? "bg-ink text-sand"
                : "border border-ink/15 text-ink/70 hover:border-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div>{items.find((item) => item.id === activeId)?.content}</div>
    </div>
  );
};

export default Tabs;
