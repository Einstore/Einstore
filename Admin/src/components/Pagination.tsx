import { useI18n } from "../lib/i18n";

type PaginationProps = {
  page: number;
  totalPages: number;
  perPage: number;
  perPageOptions?: number[];
  total?: number;
  onPageChange: (nextPage: number) => void;
  onPerPageChange: (nextPerPage: number) => void;
};

const buildPageList = (page: number, totalPages: number) => {
  const visible = new Set<number>();
  visible.add(1);
  visible.add(totalPages);
  visible.add(page);
  visible.add(page - 1);
  visible.add(page + 1);

  return Array.from(visible)
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
};

const Pagination = ({
  page,
  totalPages,
  perPage,
  perPageOptions = [25, 50, 100],
  total,
  onPageChange,
  onPerPageChange,
}: PaginationProps) => {
  const { t } = useI18n();
  const pages = buildPageList(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide">
          {t("pagination.rows", "Rows")}
        </span>
        <select
          value={perPage}
          onChange={(event) => onPerPageChange(Number(event.target.value))}
          className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          aria-label={t("pagination.rowsPerPage", "Rows per page")}
        >
          {perPageOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {typeof total === "number"
            ? t("pagination.total", "{count} total", { count: total })
            : null}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {t("pagination.page", "Page {page}/{total}", { page, total: totalPages })}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label={t("pagination.previous", "Previous page")}
          >
            ‹
          </button>
          {pages.map((pageNumber, index) => {
            const prev = pages[index - 1];
            const showEllipsis = prev !== undefined && pageNumber - prev > 1;
            return (
              <span key={pageNumber} className="flex items-center gap-2">
                {showEllipsis ? (
                  <span className="text-slate-400 dark:text-slate-500">…</span>
                ) : null}
                <button
                  type="button"
                  className={`flex h-11 w-11 items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
                    pageNumber === page
                      ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:border-indigo-400/60 dark:bg-indigo-500/20 dark:text-indigo-300"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                  onClick={() => onPageChange(pageNumber)}
                  aria-label={t("pagination.pageLabel", "Page {page}", { page: pageNumber })}
                  aria-current={pageNumber === page ? "page" : undefined}
                >
                  {pageNumber}
                </button>
              </span>
            );
          })}
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label={t("pagination.next", "Next page")}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
