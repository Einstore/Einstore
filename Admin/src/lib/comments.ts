export type ApiCommentUser = {
  id?: string | null;
  username?: string | null;
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
};

export type ApiComment = {
  id: string;
  parentId: string;
  category: string;
  text: string;
  userId?: string | null;
  user?: ApiCommentUser | null;
  createdAt: string;
  updatedAt: string;
};

export type CommentCreateInput = {
  parentId: string;
  category: string;
  text: string;
};

export type CommentListResponse = {
  items: ApiComment[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};
