import {
  AppleOAuthProvider,
  AuthService,
  BcryptPasswordHasher,
  GoogleOAuthProvider,
  buildAuthConfigFromEnv,
  createAppleClientSecret,
  type OAuthProvider,
} from "@unlikeother/auth";
import { PrismaAuthStore } from "./store.js";

const store = new PrismaAuthStore();

const buildOAuthProviders = async () => {
  const providers: Partial<Record<"google" | "apple", OAuthProvider>> = {};
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.google = new GoogleOAuthProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    });
  }

  if (
    process.env.APPLE_CLIENT_ID &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_KEY_ID &&
    process.env.APPLE_PRIVATE_KEY_PEM
  ) {
    try {
      const clientSecret = await createAppleClientSecret({
        clientId: process.env.APPLE_CLIENT_ID,
        teamId: process.env.APPLE_TEAM_ID,
        keyId: process.env.APPLE_KEY_ID,
        privateKeyPem: process.env.APPLE_PRIVATE_KEY_PEM,
      });
      providers.apple = new AppleOAuthProvider({
        clientId: process.env.APPLE_CLIENT_ID,
        clientSecret,
        redirectUri: process.env.APPLE_REDIRECT_URI,
      });
    } catch (error) {
      console.error("Apple OAuth disabled: invalid APPLE_PRIVATE_KEY_PEM.", error);
    }
  }

  return providers;
};

const resolveUsername = async (email: string) => {
  const base = email.split("@")[0]?.replace(/[^a-z0-9_.-]/gi, "") || "user";
  let candidate = base;
  let attempt = 0;
  while (attempt < 10) {
    const existing = await store.findUserByIdentifier(candidate);
    if (!existing) {
      return candidate;
    }
    attempt += 1;
    candidate = `${base}-${Math.floor(Math.random() * 9000) + 1000}`;
  }
  return `${base}-${Date.now()}`;
};

export const authService = new AuthService({
  config: buildAuthConfigFromEnv(process.env),
  store,
  passwordHasher: new BcryptPasswordHasher(10),
  oauthProviders: await buildOAuthProviders(),
  oauthUserResolver: async (profile) => {
    if (!profile.email) {
      throw new Error("OAuth profile missing email.");
    }
    const existing = await store.findUserByEmail(profile.email);
    if (existing) {
      return existing;
    }
    const username = await resolveUsername(profile.email);
    return store.createUser({
      username,
      email: profile.email,
      fullName: profile.fullName ?? null,
      avatarUrl: profile.avatarUrl ?? null,
      now: new Date(),
    });
  },
});
