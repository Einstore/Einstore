const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const resolvePagination = ({ page, perPage, limit, offset, maxPerPage = 100, defaultPerPage = 25, }) => {
    const resolvedPerPage = clamp(perPage ?? limit ?? defaultPerPage, 1, maxPerPage);
    const resolvedOffset = Math.max(0, offset ?? 0);
    const resolvedPage = page && page > 0 ? page : Math.floor(resolvedOffset / resolvedPerPage) + 1;
    const safePage = Math.max(1, resolvedPage);
    const safeOffset = offset !== undefined ? resolvedOffset : (safePage - 1) * resolvedPerPage;
    return {
        page: safePage,
        perPage: resolvedPerPage,
        offset: safeOffset,
    };
};
export const buildPaginationMeta = ({ page, perPage, total, }) => {
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    return {
        page: Math.min(page, totalPages),
        perPage,
        total,
        totalPages,
    };
};
