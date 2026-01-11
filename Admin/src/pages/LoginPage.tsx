import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import ActionButton from "../components/ActionButton";
import { apiFetch } from "../lib/api";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const authCode = searchParams.get("authCode");
  const errorCode = searchParams.get("error");
  const errorDescription =
    searchParams.get("errorDescription") || searchParams.get("error_description");

  const redirectTarget = useMemo(() => {
    if (location.state && typeof location.state === "object") {
      const state = location.state as { from?: { pathname?: string } };
      if (state.from?.pathname) {
        return state.from.pathname;
      }
    }
    return "/overview";
  }, [location.state]);

  const showApple = Boolean(import.meta.env.VITE_APPLE_CLIENT_ID);

  const startOAuth = async (provider: "google" | "apple") => {
    setError("");
    setStatus("Redirecting to provider...");
    setBusy(true);
    const successRedirect = `${window.location.origin}/login`;
    const failureRedirect = successRedirect;
    const redirectUri = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/auth/oauth/${provider}/callback`;
    try {
      const response = await apiFetch<{ authorizeUrl: string }>(
        `/auth/oauth/${provider}/start?successRedirect=${encodeURIComponent(
          successRedirect
        )}&failureRedirect=${encodeURIComponent(
          failureRedirect
        )}&redirectUri=${encodeURIComponent(redirectUri)}`
      );
      window.location.assign(response.authorizeUrl);
    } catch (err) {
      setBusy(false);
      setStatus("");
      setError(err instanceof Error ? err.message : "Unable to start login.");
    }
  };

  useEffect(() => {
    if (errorCode) {
      setError(errorDescription || "Login failed. Try again.");
    }
  }, [errorCode, errorDescription]);

  useEffect(() => {
    if (!authCode) {
      return;
    }
    let cancelled = false;
    const exchange = async () => {
      setBusy(true);
      setStatus("Signing you in...");
      setError("");
      try {
        const payload = await apiFetch<{ session: { accessToken: string; refreshToken: string; expiresIn: number } }>(
          "/auth/oauth/exchange",
          {
            method: "POST",
            body: JSON.stringify({ authCode }),
          }
        );
        if (cancelled) {
          return;
        }
        localStorage.setItem("accessToken", payload.session.accessToken);
        localStorage.setItem("refreshToken", payload.session.refreshToken);
        navigate(redirectTarget, { replace: true });
      } catch (err) {
        if (!cancelled) {
          setBusy(false);
          setStatus("");
          setError(err instanceof Error ? err.message : "Login failed.");
        }
      }
    };
    void exchange();
    return () => {
      cancelled = true;
    };
  }, [authCode, navigate, redirectTarget]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-sand text-ink">
      <div className="pointer-events-none absolute -top-20 right-10 h-72 w-72 rounded-full bg-mist/70 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 -translate-x-1/2 rounded-full bg-coral/20 blur-3xl" />

      <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-[32px] border border-ink/10 bg-white/80 p-8 shadow-float backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-sand">
              E
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-ink/50">
                Einstore
              </p>
              <p className="text-lg font-display text-ink">Admin</p>
            </div>
          </div>

          <h1 className="mt-6 text-3xl font-display text-ink">Sign in</h1>
          <p className="mt-2 text-sm text-ink/60">
            Use Google or Apple. If you don’t have an account yet, one will be created on login. We only request your email.
          </p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => startOAuth("google")}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-2xl border border-ink/20 bg-white text-sm font-semibold text-ink transition hover:border-ink disabled:opacity-60"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/10 text-xs font-semibold">
                G
              </span>
              Continue with Google
            </button>
            {showApple ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => startOAuth("apple")}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-2xl border border-ink/20 bg-white text-sm font-semibold text-ink transition hover:border-ink disabled:opacity-60"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/10 text-xs font-semibold">
                  A
                </span>
                Continue with Apple
              </button>
            ) : null}
          </div>

          {status ? (
            <div className="mt-4 rounded-2xl border border-ink/10 bg-sand/80 p-3 text-xs text-ink/70" aria-live="polite">
              {status}
            </div>
          ) : null}
          {error ? (
            <div className="mt-3 rounded-2xl border border-coral/40 bg-coral/10 p-3 text-xs text-coral" aria-live="polite">
              {error}
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-ink/10 bg-sand/70 p-4 text-xs text-ink/60">
            Need access? Contact your workspace admin to be provisioned.
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
