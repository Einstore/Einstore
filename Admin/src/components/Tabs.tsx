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
            className={`h-11 rounded-full px-5 text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 ${
              activeId === item.id
                ? "bg-mint text-ink shadow-card"
                : "bg-white text-ink/60 shadow-card"
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
