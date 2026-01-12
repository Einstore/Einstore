export class CommentsClient {
  constructor({ baseUrl, getAccessToken, getTeamId } = {}) {
    this.baseUrl = baseUrl?.replace(/\/$/, "") || "";
    this.getAccessToken = getAccessToken;
    this.getTeamId = getTeamId;
  }

  async list({ parentId, category, page = 1, perPage = 25 }) {
    const params = new URLSearchParams({ parentId, category, page: String(page), perPage: String(perPage) });
    return this.#request(`/comments?${params.toString()}`);
  }

  async create({ parentId, category, text }) {
    return this.#request(`/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId, category, text }),
    });
  }

  async #request(path, init = {}) {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    const token = this.getAccessToken?.();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const teamId = this.getTeamId?.();
    if (teamId) headers.set("x-team-id", teamId);
    const response = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      throw new Error(data?.error || data?.message || "Request failed");
    }
    return data;
  }
}

export const createCommentsClient = (options) => new CommentsClient(options);

export const defaultCategory = {
  build: "build",
  app: "app",
};

export const emptyPagination = { items: [], page: 1, perPage: 25, total: 0, totalPages: 1 };

export const mapCommentUser = (comment) => {
  if (!comment) return null;
  const user = comment.user || {};
  return {
    id: user.id ?? null,
    username: user.username ?? null,
    email: user.email ?? null,
    fullName: user.fullName ?? null,
  };
};

export const normalizeComment = (comment) => {
  if (!comment) return null;
  return {
    id: comment.id,
    parentId: comment.parentId,
    category: comment.category,
    text: comment.text,
    userId: comment.userId ?? null,
    user: mapCommentUser(comment),
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
};
