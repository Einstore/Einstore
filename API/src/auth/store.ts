import type {
  AuthStore,
  AuthProviderId,
  AuthUserRecord,
  AuthCredentialRecord,
  AuthSessionRecord,
  AuthOAuthAccountRecord,
  AuthCodeRecord,
  PasswordResetTokenRecord,
} from "@unlikeother/auth";
import { prisma } from "../lib/prisma.js";

const mapUser = (user: {
  id: string;
  username: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  status: "active" | "disabled";
  isSuperUser: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AuthUserRecord => ({
  id: user.id,
  username: user.username,
  email: user.email ?? null,
  fullName: user.fullName ?? null,
  avatarUrl: user.avatarUrl ?? null,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export class PrismaAuthStore implements AuthStore {
  async createUser(input: {
    username: string;
    email?: string | null;
    fullName?: string | null;
    avatarUrl?: string | null;
    status?: "active" | "disabled";
    isSuperUser?: boolean;
    now: Date;
  }): Promise<AuthUserRecord> {
    const shouldBeSuperUser =
      input.isSuperUser ?? ((await prisma.user.count()) === 0);
    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email ?? null,
        fullName: input.fullName ?? null,
        avatarUrl: input.avatarUrl ?? null,
        status: input.status ?? "active",
        isSuperUser: shouldBeSuperUser,
        createdAt: input.now,
        updatedAt: input.now,
      },
    });
    return mapUser(user);
  }

  async createUserWithCredential(input: {
    username: string;
    email?: string | null;
    fullName?: string | null;
    avatarUrl?: string | null;
    status?: "active" | "disabled";
    isSuperUser?: boolean;
    passwordHash: string;
    passwordAlgo: string;
    now: Date;
  }): Promise<AuthUserRecord> {
    const shouldBeSuperUser =
      input.isSuperUser ?? ((await prisma.user.count()) === 0);
    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email ?? null,
        fullName: input.fullName ?? null,
        avatarUrl: input.avatarUrl ?? null,
        status: input.status ?? "active",
        isSuperUser: shouldBeSuperUser,
        createdAt: input.now,
        updatedAt: input.now,
        credential: {
          create: {
            passwordHash: input.passwordHash,
            passwordAlgo: input.passwordAlgo,
            createdAt: input.now,
            updatedAt: input.now,
            lastChangedAt: input.now,
          },
        },
      },
    });
    return mapUser(user);
  }

  async findUserByIdentifier(identifier: string): Promise<AuthUserRecord | null> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    });
    return user ? mapUser(user) : null;
  }

  async findUserById(userId: string): Promise<AuthUserRecord | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    return user ? mapUser(user) : null;
  }

  async findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user ? mapUser(user) : null;
  }

  async getUserCount(): Promise<number> {
    return prisma.user.count();
  }

  async getCredentialByUserId(userId: string): Promise<AuthCredentialRecord | null> {
    const credential = await prisma.credential.findUnique({
      where: { userId },
    });
    if (!credential) return null;
    return {
      id: credential.id,
      userId: credential.userId,
      passwordHash: credential.passwordHash,
      passwordAlgo: credential.passwordAlgo,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
      lastChangedAt: credential.lastChangedAt,
    };
  }

  async updateCredentialPassword(input: {
    userId: string;
    passwordHash: string;
    passwordAlgo: string;
    now: Date;
  }): Promise<AuthCredentialRecord> {
    const credential = await prisma.credential.update({
      where: { userId: input.userId },
      data: {
        passwordHash: input.passwordHash,
        passwordAlgo: input.passwordAlgo,
        updatedAt: input.now,
        lastChangedAt: input.now,
      },
    });
    return {
      id: credential.id,
      userId: credential.userId,
      passwordHash: credential.passwordHash,
      passwordAlgo: credential.passwordAlgo,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
      lastChangedAt: credential.lastChangedAt,
    };
  }

  async createSession(input: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    ip?: string | null;
    userAgent?: string | null;
    now: Date;
  }): Promise<AuthSessionRecord> {
    const session = await prisma.session.create({
      data: {
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        expiresAt: input.expiresAt,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        createdAt: input.now,
      },
    });
    return {
      id: session.id,
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      ip: session.ip ?? null,
      userAgent: session.userAgent ?? null,
      revokedAt: session.revokedAt ?? null,
    };
  }

  async getSessionByRefreshTokenHash(refreshTokenHash: string): Promise<AuthSessionRecord | null> {
    const session = await prisma.session.findUnique({
      where: { refreshTokenHash },
    });
    if (!session) return null;
    return {
      id: session.id,
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      ip: session.ip ?? null,
      userAgent: session.userAgent ?? null,
      revokedAt: session.revokedAt ?? null,
    };
  }

  async updateSessionRefreshToken(input: {
    sessionId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    now: Date;
  }): Promise<AuthSessionRecord> {
    const session = await prisma.session.update({
      where: { id: input.sessionId },
      data: {
        refreshTokenHash: input.refreshTokenHash,
        expiresAt: input.expiresAt,
      },
    });
    return {
      id: session.id,
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      ip: session.ip ?? null,
      userAgent: session.userAgent ?? null,
      revokedAt: session.revokedAt ?? null,
    };
  }

  async revokeSession(input: { sessionId: string; revokedAt: Date }): Promise<void> {
    await prisma.session.update({
      where: { id: input.sessionId },
      data: { revokedAt: input.revokedAt },
    });
  }

  async findOAuthAccount(
    provider: AuthProviderId,
    providerUserId: string
  ): Promise<AuthOAuthAccountRecord | null> {
    const account = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId,
        },
      },
    });
    if (!account) return null;
    return {
      id: account.id,
      userId: account.userId,
      provider: account.provider,
      providerUserId: account.providerUserId,
      email: account.email ?? null,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  async createOAuthAccount(input: {
    userId: string;
    provider: AuthProviderId;
    providerUserId: string;
    email?: string | null;
    now: Date;
  }): Promise<AuthOAuthAccountRecord> {
    const account = await prisma.oAuthAccount.create({
      data: {
        userId: input.userId,
        provider: input.provider,
        providerUserId: input.providerUserId,
        email: input.email ?? null,
        createdAt: input.now,
        updatedAt: input.now,
      },
    });
    return {
      id: account.id,
      userId: account.userId,
      provider: account.provider,
      providerUserId: account.providerUserId,
      email: account.email ?? null,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  async createAuthCode(input: {
    userId: string;
    sessionId?: string | null;
    codeHash: string;
    expiresAt: Date;
    now: Date;
  }): Promise<AuthCodeRecord> {
    const authCode = await prisma.authCode.create({
      data: {
        userId: input.userId,
        sessionId: input.sessionId ?? null,
        codeHash: input.codeHash,
        createdAt: input.now,
        expiresAt: input.expiresAt,
      },
    });
    return {
      id: authCode.id,
      userId: authCode.userId,
      sessionId: authCode.sessionId ?? null,
      codeHash: authCode.codeHash,
      createdAt: authCode.createdAt,
      expiresAt: authCode.expiresAt,
      usedAt: authCode.usedAt ?? null,
    };
  }

  async consumeAuthCode(codeHash: string, now: Date): Promise<AuthCodeRecord | null> {
    const authCode = await prisma.authCode.findUnique({
      where: { codeHash },
    });
    if (!authCode || authCode.usedAt) return null;
    const updated = await prisma.authCode.update({
      where: { id: authCode.id },
      data: { usedAt: now },
    });
    return {
      id: updated.id,
      userId: updated.userId,
      sessionId: updated.sessionId ?? null,
      codeHash: updated.codeHash,
      createdAt: updated.createdAt,
      expiresAt: updated.expiresAt,
      usedAt: updated.usedAt ?? null,
    };
  }

  async createPasswordResetToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    now: Date;
  }): Promise<PasswordResetTokenRecord> {
    const token = await prisma.passwordResetToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        createdAt: input.now,
        expiresAt: input.expiresAt,
      },
    });
    return {
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      usedAt: token.usedAt ?? null,
    };
  }

  async consumePasswordResetToken(
    tokenHash: string,
    now: Date
  ): Promise<PasswordResetTokenRecord | null> {
    const token = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    if (!token || token.usedAt) return null;
    const updated = await prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { usedAt: now },
    });
    return {
      id: updated.id,
      userId: updated.userId,
      tokenHash: updated.tokenHash,
      createdAt: updated.createdAt,
      expiresAt: updated.expiresAt,
      usedAt: updated.usedAt ?? null,
    };
  }
}
