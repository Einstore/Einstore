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
    <div className="min-h-screen bg-sand text-ink">
      <main className="mx-auto flex min-h-screen max-w-[420px] flex-col items-center justify-center px-6 py-16">
        <div className="w-full rounded-2xl bg-white p-8 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint text-ink">
              E
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                Einstore
              </p>
              <p className="text-base font-semibold text-ink">Admin</p>
            </div>
          </div>

          <h1 className="mt-6 text-2xl font-semibold text-ink">Sign in</h1>
          <p className="mt-2 text-sm text-ink/60">
            Use Google or Apple. If you don’t have an account yet, one will be
            created on login. We only request your email.
          </p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => startOAuth("google")}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-full bg-white text-sm font-semibold text-ink shadow-card transition-all duration-200 ease-out hover:-translate-y-0.5 disabled:opacity-60"
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
                className="flex h-11 w-full items-center justify-center gap-3 rounded-full bg-white text-sm font-semibold text-ink shadow-card transition-all duration-200 ease-out hover:-translate-y-0.5 disabled:opacity-60"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/10 text-xs font-semibold">
                  A
                </span>
                Continue with Apple
              </button>
            ) : null}
          </div>

          {status ? (
            <div className="mt-4 rounded-xl bg-sand p-3 text-xs text-ink/70" aria-live="polite">
              {status}
            </div>
          ) : null}
          {error ? (
            <div className="mt-3 rounded-xl bg-coral/10 p-3 text-xs text-coral" aria-live="polite">
              {error}
            </div>
          ) : null}

          <div className="mt-6 rounded-xl bg-sand p-4 text-xs text-ink/60">
            Need access? Contact your workspace admin to be provisioned.
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
