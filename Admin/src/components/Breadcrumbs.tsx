type Breadcrumb = {
  label: string;
};

type BreadcrumbsProps = {
  items: Breadcrumb[];
};

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
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
