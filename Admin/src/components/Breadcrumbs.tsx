type Breadcrumb = {
  label: string;
};

type BreadcrumbsProps = {
  items: Breadcrumb[];
};

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink/40">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-2">
          <span>{item.label}</span>
          {index < items.length - 1 ? <span>/</span> : null}
        </span>
      ))}
    </div>
  );
};

export default Breadcrumbs;
