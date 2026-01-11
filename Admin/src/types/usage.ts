export type StorageUsageUser = {
  userId: string;
  username: string;
  email: string | null;
  fullName: string | null;
  buildCount: number;
  totalBytes: number;
};

export type StorageUsageResponse = {
  users: StorageUsageUser[];
};
