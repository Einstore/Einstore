export type TeamRole = "owner" | "admin" | "member";

export type TeamSummary = {
  id: string;
  name: string;
  slug: string;
  inboxBase?: string | null;
  memberRole: TeamRole;
  logoUrl?: string | null;
};

export type TeamMember = {
  id: string;
  email: string | null;
  fullName: string | null;
  name: string | null;
  avatarUrl: string | null;
  username: string | null;
  role: TeamRole;
  createdAt: string | Date;
};

export const isTeamAdmin = (role?: TeamRole | null) => role === "owner" || role === "admin";
