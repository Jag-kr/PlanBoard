import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { login, isLoggedIn } from "../utils/auth";
import { getActiveWorkspace, fetchAndCacheWorkspaces } from "../utils/workspace";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect already-authenticated users (in an effect, not during render)
  useEffect(() => {
    if (isLoggedIn()) {
      navigate(getActiveWorkspace() ? "/dashboard" : "/onboarding", {
        replace: true,
      });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      const { active } = await fetchAndCacheWorkspaces();
      navigate(active ? "/dashboard" : "/onboarding");
    } catch (err) {
      setError(
        err.response?.data?.error || "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📋</div>
          <h1 className="text-2xl font-bold text-gray-900">PlanBoard</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your workspace</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Inline error banner */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-3.5 py-3 text-sm text-red-700"
              >
                <ExclamationCircleIcon className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={[
                  "w-full rounded-xl border px-4 py-2.5 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  error ? "border-red-300 bg-red-50/40" : "border-gray-300",
                ].join(" ")}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={[
                  "w-full rounded-xl border px-4 py-2.5 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  error ? "border-red-300 bg-red-50/40" : "border-gray-300",
                ].join(" ")}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50 text-sm mt-2"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-blue-600 underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
