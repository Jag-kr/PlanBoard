import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import { toastError } from "../utils/toast";

export default function Onboarding() {
  const { createWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createWorkspace(name.trim());
      navigate("/dashboard");
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to create workspace.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="text-5xl mb-4">🚀</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to PlanBoard!
        </h1>
        <p className="text-gray-500 mb-8">
          Let's create your first workspace to get started.
        </p>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-left">
              <label
                htmlFor="wsname"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Workspace name
              </label>
              <input
                id="wsname"
                type="text"
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Engineering, My Startup, Personal"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                This is the name your team will see. You can change it later.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "Creating workspace…" : "Create workspace →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
