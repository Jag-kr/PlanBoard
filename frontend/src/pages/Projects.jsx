import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getActiveWorkspace } from "../utils/workspace";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../api/projects";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import { ProjectStatusBadge } from "../components/Badge";
import { toastError, toastSuccess } from "../utils/toast";
import { hasRole } from "../utils/helpers";
import { PROJECT_STATUS_LIST } from "../utils/constants";

const STATUS_OPTIONS = PROJECT_STATUS_LIST;

export default function Projects() {
  const activeWorkspace = getActiveWorkspace();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // project being status-edited
  const [editStatus, setEditStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const userRole = activeWorkspace?.role;
  const canCreate = hasRole(userRole, "MANAGER"); // MANAGER + ADMIN can create
  const canUpdate = hasRole(userRole, "MANAGER"); // MANAGER + ADMIN can update status
  const canDelete = hasRole(userRole, "ADMIN"); // Only ADMIN can delete

  const fetchProjects = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const res = await getProjects(activeWorkspace.id);
      setProjects(res.data.projects || []);
    } catch {
      toastError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeWorkspace) return;
    fetchProjects();
  }, [activeWorkspace?.id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await createProject(activeWorkspace.id, form);
      setProjects((p) => [res.data.project, ...p]);
      setShowModal(false);
      setForm({ name: "", description: "" });
      toastSuccess("Project created!");
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to create project.");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setUpdatingStatus(true);
    try {
      const res = await updateProject(editTarget.id, { status: editStatus });
      setProjects((p) =>
        p.map((pr) =>
          pr.id === editTarget.id
            ? { ...pr, status: res.data.project.status }
            : pr,
        ),
      );
      setEditTarget(null);
      toastSuccess("Project status updated.");
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to update project.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      setProjects((p) => p.filter((pr) => pr.id !== deleteTarget.id));
      setDeleteTarget(null);
      toastSuccess("Project deleted.");
    } catch {
      toastError("Failed to delete project.");
    } finally {
      setDeleting(false);
    }
  };

  if (!activeWorkspace) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <span className="text-base">＋</span> New project
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner size="lg" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon="📁"
          title="No projects yet"
          description={
            canCreate
              ? "Create your first project to get started."
              : "Ask an admin or manager to create a project."
          }
          action={
            canCreate && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                Create project
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 p-5 cursor-pointer transition-all group"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-bold">
                  {project.name[0].toUpperCase()}
                </div>
                <ProjectStatusBadge status={project.status} />
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                <span className="text-xs text-gray-400">
                  {project.taskCount ?? 0} task
                  {project.taskCount !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Update status — MANAGER+ */}
                  {canUpdate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditTarget(project);
                        setEditStatus(project.status);
                      }}
                      className="text-xs text-blue-500 hover:text-blue-700"
                    >
                      Edit status
                    </button>
                  )}
                  {/* Delete — ADMIN only */}
                  {canDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(project);
                      }}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="New project"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project name *
            </label>
            <input
              autoFocus
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Website Redesign"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Optional description"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !form.name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create project"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit status modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Update status — ${editTarget?.name}`}
        size="sm"
      >
        <form onSubmit={handleStatusUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project status
            </label>
            <div className="flex flex-col gap-2">
              {STATUS_OPTIONS.map((s) => (
                <label
                  key={s}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    editStatus === s
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={editStatus === s}
                    onChange={() => setEditStatus(s)}
                    className="accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{s}</p>
                    <p className="text-xs text-gray-500">
                      {s === "ACTIVE"
                        ? "Project is active and accepting tasks"
                        : "Project is archived and read-only"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setEditTarget(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatingStatus || editStatus === editTarget?.status}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {updatingStatus ? "Saving…" : "Update status"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All tasks and comments will be permanently deleted.`}
      />
    </div>
  );
}
