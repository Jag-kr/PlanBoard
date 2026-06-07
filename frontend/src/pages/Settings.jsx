import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getActiveWorkspace, updateCachedWorkspace } from "../utils/workspace";
import { updateWorkspace } from "../api/workspaces";
import { toastError, toastSuccess } from "../utils/toast";
import { hasRole } from "../utils/helpers";

export default function Settings() {
  const activeWorkspace = getActiveWorkspace();
  const navigate = useNavigate();
  const isAdmin = hasRole(activeWorkspace?.role, "ADMIN");

  const [name, setName] = useState(activeWorkspace?.name || "");
  const [saving, setSaving] = useState(false);

  // Page-level guard — redirect non-Admins away
  useEffect(() => {
    if (activeWorkspace && !isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [activeWorkspace?.role]);

  // Sync if workspace changes
  if (activeWorkspace && name !== activeWorkspace.name && !saving) {
    // Only reset if user hasn't started typing
  }

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === activeWorkspace?.name) return;
    setSaving(true);
    try {
      const res = await updateWorkspace(activeWorkspace.id, {
        name: name.trim(),
      });
      updateCachedWorkspace(res.data.workspace);
      toastSuccess("Workspace name updated.");
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to update workspace.");
    } finally {
      setSaving(false);
    }
  };

  if (!activeWorkspace) return null;

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Settings
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage workspace settings
        </p>
      </div>

      {/* Workspace name */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Workspace
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workspace name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isAdmin}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
            {!isAdmin && (
              <p className="text-xs text-gray-400 mt-1">
                Only ADMINs can change the workspace name.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your role
            </label>
            <input
              value={activeWorkspace.role}
              readOnly
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
          {isAdmin && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={
                  saving || !name.trim() || name === activeWorkspace.name
                }
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Danger zone */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
          <h2 className="text-base font-semibold text-red-600 mb-2">
            Danger Zone
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Deleting a workspace permanently removes all projects, tasks, and
            members. This action cannot be undone.
          </p>
          <button
            disabled
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl opacity-50 cursor-not-allowed"
            title="Contact support to delete a workspace"
          >
            Delete workspace
          </button>
          <p className="text-xs text-gray-400 mt-2">
            Contact support to delete a workspace.
          </p>
        </div>
      )}
    </div>
  );
}
