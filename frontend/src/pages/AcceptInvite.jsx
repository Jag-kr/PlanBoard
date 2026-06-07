import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { isLoggedIn } from "../utils/auth";
import { login } from "../utils/auth";
import { fetchAndCacheWorkspaces } from "../utils/workspace";
import { acceptInvitation } from "../api/members";
import { toastSuccess } from "../utils/toast";

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState("loading"); // loading | login | accepting | done | error
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  // If already authenticated, skip straight to accepting
  useEffect(() => {
    if (isLoggedIn()) {
      acceptAndRedirect();
    } else {
      setPhase("login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const acceptAndRedirect = async () => {
    setPhase("accepting");
    try {
      const res = await acceptInvitation(token);
      const workspaceName = res.data.workspace?.name;
      await fetchAndCacheWorkspaces();
      toastSuccess(
        `Joined${workspaceName ? ` "${workspaceName}"` : " workspace"}!`,
      );
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        "This invitation link is invalid or has expired.";
      setErrorMsg(msg);
      setPhase("error");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      await acceptAndRedirect();
    } catch (err) {
      // Login errors are distinct from invite errors
      if (err.response?.status === 401 || err.response?.status === 400) {
        setLoginError(
          err.response?.data?.error || "Invalid email or password.",
        );
        setPhase("login");
      } else {
        setLoginError("Something went wrong. Please try again.");
        setPhase("login");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render states ────────────────────────────────────────────────────────

  if (phase === "loading" || phase === "accepting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-bounce">📋</div>
          <p className="text-gray-500 text-sm font-medium">
            {phase === "accepting" ? "Joining workspace…" : "Loading…"}
          </p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="text-5xl">😕</div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Invitation unavailable
            </h1>
            <p className="text-gray-500 text-sm mt-2">{errorMsg}</p>
          </div>
          <Link
            to="/dashboard"
            className="inline-block bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  // phase === "login"
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand + invite context */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📋</div>
          <h1 className="text-2xl font-bold text-gray-900">
            You've been invited!
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Sign in to accept your workspace invitation.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            {/* Inline error */}
            {loginError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-3.5 py-3 text-sm text-red-700"
              >
                <ExclamationCircleIcon className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="inv-email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="inv-email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                value={form.email}
                onChange={(e) => {
                  setLoginError("");
                  setForm({ ...form, email: e.target.value });
                }}
                placeholder="you@example.com"
                className={[
                  "w-full rounded-xl border px-4 py-2.5 text-sm transition",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  loginError
                    ? "border-red-300 bg-red-50/40"
                    : "border-gray-300",
                ].join(" ")}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="inv-password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="inv-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(e) => {
                  setLoginError("");
                  setForm({ ...form, password: e.target.value });
                }}
                placeholder="••••••••"
                className={[
                  "w-full rounded-xl border px-4 py-2.5 text-sm transition",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  loginError
                    ? "border-red-300 bg-red-50/40"
                    : "border-gray-300",
                ].join(" ")}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl disabled:opacity-60 text-sm"
            >
              {submitting ? "Signing in…" : "Sign in & accept invite"}
            </button>
          </form>

          {/* New user path — preserve invite token */}
          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                to={`/signup?invite=${token}`}
                className="text-blue-600 underline font-medium"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
