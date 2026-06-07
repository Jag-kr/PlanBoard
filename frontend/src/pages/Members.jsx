import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import { useAuth } from "../context/AuthContext";
import {
  getMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
} from "../api/members";
import Avatar from "../components/Avatar";
import { RoleBadge } from "../components/Badge";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { toastError, toastSuccess } from "../utils/toast";
import { hasRole } from "../utils/helpers";

const ROLES = ["ADMIN", "MANAGER", "MEMBER"];

export default function Members() {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "MEMBER" });
  const [inviting, setInviting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  const myRole = activeWorkspace?.role;
  const canAdmin = hasRole(myRole, "ADMIN");
  const canInvite = hasRole(myRole, "MANAGER");

  // Page-level guard — redirect if insufficient role
  useEffect(() => {
    if (activeWorkspace && !hasRole(activeWorkspace.role, "MANAGER")) {
      navigate("/dashboard", { replace: true });
    }
  }, [activeWorkspace?.role]);

  const fetchMembers = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const res = await getMembers(activeWorkspace.id);
      setMembers(res.data.members || []);
    } catch {
      toastError("Failed to load members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeWorkspace) return;
    fetchMembers();
  }, [activeWorkspace?.id]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await inviteMember(activeWorkspace.id, inviteForm);
      toastSuccess(`Invitation sent to ${inviteForm.email}`);
      setShowInvite(false);
      setInviteForm({ email: "", role: "MEMBER" });
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId, userId, newRole) => {
    try {
      await updateMemberRole(activeWorkspace.id, userId, { role: newRole });
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
      );
      toastSuccess("Role updated.");
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to update role.");
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await removeMember(activeWorkspace.id, removeTarget.userId);
      setMembers((prev) => prev.filter((m) => m.id !== removeTarget.id));
      setRemoveTarget(null);
      toastSuccess("Member removed.");
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to remove member.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canInvite && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            ✉ Invite member
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No members"
            description="Invite your team to get started."
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">
                  Member
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">
                  Role
                </th>
                {canAdmin && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} size="md" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {m.name}{" "}
                          {m.userId === user?.id && (
                            <span className="text-xs text-gray-400">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {canAdmin && m.userId !== user?.id ? (
                      <select
                        value={m.role}
                        onChange={(e) =>
                          handleRoleChange(m.id, m.userId, e.target.value)
                        }
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <RoleBadge role={m.role} />
                    )}
                  </td>
                  {canAdmin && (
                    <td className="px-5 py-3 text-right">
                      {m.userId !== user?.id && (
                        <button
                          onClick={() => setRemoveTarget(m)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite modal */}
      <Modal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        title="Invite member"
        size="sm"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address *
            </label>
            <input
              autoFocus
              required
              type="email"
              value={inviteForm.email}
              onChange={(e) =>
                setInviteForm({ ...inviteForm, email: e.target.value })
              }
              placeholder="teammate@example.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={inviteForm.role}
              onChange={(e) =>
                setInviteForm({ ...inviteForm, role: e.target.value })
              }
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setShowInvite(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviting || !inviteForm.email.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {inviting ? "Sending…" : "Send invite"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        loading={removing}
        title="Remove member"
        message={`Remove ${removeTarget?.name} from this workspace?`}
        confirmLabel="Remove"
      />
    </div>
  );
}
