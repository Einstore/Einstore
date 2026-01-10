import { AuthService, BcryptPasswordHasher, buildAuthConfigFromEnv } from "@unlikeother/auth";
import { PrismaAuthStore } from "./store.js";
export const authService = new AuthService({
    config: buildAuthConfigFromEnv(process.env),
    store: new PrismaAuthStore(),
    passwordHasher: new BcryptPasswordHasher(10),
});
