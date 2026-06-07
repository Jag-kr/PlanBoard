import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTasks, createTask, deleteTask } from "../api/tasks";
import { getMembers } from "../api/members";
import { getActiveWorkspace } from "../utils/workspace";
import { getUser } from "../utils/auth";
import TaskDrawer from "../components/TaskDrawer";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { PriorityBadge, StatusBadge } from "../components/Badge";
import {
  PRIORITY_LIST,
  STATUS_LIST,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from "../utils/constants";
import { toastError, toastSuccess } from "../utils/toast";
import { hasRole, formatDate, isOverdue } from "../utils/helpers";

// ── helpers ────────────────────────────────────────────────────────────────────
const PRIORITY_ORDER = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── component ──────────────────────────────────────────────────────────────────
export default function Tasks() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const activeWorkspace = getActiveWorkspace();
  const currentUser = getUser();
  const canManage = hasRole(activeWorkspace?.role, "MANAGER");
  const canEditTask = (task) =>
    canManage || task.assignee_id === currentUser?.id;

  // ── state ──────────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    assignee_id: "",
    due_date: "",
  });

  // filters & sort
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [sortKey, setSortKey] = useState("created"); // created | title | priority | due_date | status
  const [sortAsc, setSortAsc] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // ── data fetch ─────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTasks(projectId, {});
      setTasks(res.data.tasks || []);
    } catch {
      toastError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!activeWorkspace) return;
    getMembers(activeWorkspace.id)
      .then((r) => setMembers(r.data.members || []))
      .catch(() => {});
  }, [activeWorkspace?.id]);

  // ── client-side filter + sort ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...tasks];

    // search
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }
    // status filter
    if (filterStatus) list = list.filter((t) => t.status === filterStatus);
    // priority filter
    if (filterPriority)
      list = list.filter((t) => t.priority === filterPriority);
    // assignee filter
    if (filterAssignee) {
      if (filterAssignee === "__unassigned__") {
        list = list.filter((t) => !t.assignee_id);
      } else {
        list = list.filter((t) => t.assignee_id === filterAssignee);
      }
    }

    // sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "title") {
        cmp = a.title.localeCompare(b.title);
      } else if (sortKey === "priority") {
        cmp =
          (PRIORITY_ORDER[a.priority] ?? 99) -
          (PRIORITY_ORDER[b.priority] ?? 99);
      } else if (sortKey === "status") {
        cmp =
          (STATUS_LIST.indexOf(a.status) ?? 0) -
          (STATUS_LIST.indexOf(b.status) ?? 0);
      } else if (sortKey === "due_date") {
        const da = a.due_date ? new Date(a.due_date) : new Date("9999-12-31");
        const db = b.due_date ? new Date(b.due_date) : new Date("9999-12-31");
        cmp = da - db;
      } else {
        // default: newest first (by createdAt)
        cmp = new Date(b.createdAt) - new Date(a.createdAt);
      }
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [
    tasks,
    debouncedSearch,
    filterStatus,
    filterPriority,
    filterAssignee,
    sortKey,
    sortAsc,
  ]);

  // ── sort toggle ────────────────────────────────────────────────────────────
  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col)
      return (
        <svg
          className="h-3 w-3 text-gray-300 ml-1 inline"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 9l4-4 4 4M8 15l4 4 4-4"
          />
        </svg>
      );
    return sortAsc ? (
      <svg
        className="h-3 w-3 text-blue-500 ml-1 inline"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg
        className="h-3 w-3 text-blue-500 ml-1 inline"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // ── create task ────────────────────────────────────────────────────────────
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        ...newTask,
        assignee_id: newTask.assignee_id || undefined,
        due_date: newTask.due_date || undefined,
      };
      const res = await createTask(projectId, payload);
      setTasks((prev) => [res.data.task, ...prev]);
      setShowCreate(false);
      setNewTask({
        title: "",
        description: "",
        priority: "MEDIUM",
        assignee_id: "",
        due_date: "",
      });
      toastSuccess("Task created!");
    } catch (err) {
      toastError(err.response?.data?.error || "Failed to create task.");
    } finally {
      setCreating(false);
    }
  };

  // ── delete task ────────────────────────────────────────────────────────────
  const handleDeleteTask = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTask(deleteTarget.id);
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      if (selectedTask?.id === deleteTarget.id) setSelectedTask(null);
      setDeleteTarget(null);
      toastSuccess("Task deleted.");
    } catch {
      toastError("Failed to delete task.");
    } finally {
      setDeleting(false);
    }
  };

  const handleTaskUpdated = (updated) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(updated);
  };

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("");
    setFilterPriority("");
    setFilterAssignee("");
  };

  const hasActiveFilter =
    search || filterStatus || filterPriority || filterAssignee;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ── */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-5 py-3 flex-shrink-0">
        {/* Row 1: back + title + add button */}
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate("/projects")}
            className="text-gray-400 hover:text-gray-600 text-sm flex-shrink-0 flex items-center gap-1"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="hidden sm:inline">Projects</span>
          </button>
          <h1 className="text-base font-semibold text-gray-900 flex-1 truncate">
            Tasks
          </h1>
          {canManage && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors flex-shrink-0"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="hidden sm:inline">Add task</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>

        {/* Row 2: search + filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <svg
              className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 bg-white"
          >
            <option value="">All statuses</option>
            {STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 bg-white"
          >
            <option value="">All priorities</option>
            {PRIORITY_LIST.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_CONFIG[p].label}
              </option>
            ))}
          </select>

          {/* Assignee filter */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 bg-white"
          >
            <option value="">All assignees</option>
            <option value="__unassigned__">Unassigned</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Clear filters */}
          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table area ── */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <EmptyState
              icon={hasActiveFilter ? "🔍" : "📝"}
              title={hasActiveFilter ? "No matching tasks" : "No tasks yet"}
              description={
                hasActiveFilter
                  ? "Try clearing some filters."
                  : canManage
                    ? "Create your first task to get started."
                    : "No tasks have been created yet."
              }
              action={
                hasActiveFilter ? (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Clear filters
                  </button>
                ) : null
              }
            />
          </div>
        ) : (
          <table className="w-full table-fixed border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="border-b border-gray-200">
                {/* # — desktop only */}
                <th className="hidden md:table-cell w-12 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  #
                </th>

                {/* Title */}
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 w-auto"
                  onClick={() => toggleSort("title")}
                >
                  Title <SortIcon col="title" />
                </th>

                {/* Status */}
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 w-32"
                  onClick={() => toggleSort("status")}
                >
                  Status <SortIcon col="status" />
                </th>

                {/* Priority — desktop only */}
                <th
                  className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 w-28"
                  onClick={() => toggleSort("priority")}
                >
                  Priority <SortIcon col="priority" />
                </th>

                {/* Assignee — desktop only */}
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">
                  Assignee
                </th>

                {/* Due date — desktop only */}
                <th
                  className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 w-28"
                  onClick={() => toggleSort("due_date")}
                >
                  Due <SortIcon col="due_date" />
                </th>

                {/* Actions — desktop only */}
                {canManage && (
                  <th className="hidden md:table-cell w-16 px-4 py-3" />
                )}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.map((task, idx) => (
                <tr
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                >
                  {/* # */}
                  <td className="hidden md:table-cell px-4 py-3 text-xs text-gray-400 font-mono">
                    {idx + 1}
                  </td>

                  {/* Title */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                      {task.title}
                    </p>
                    {/* Mobile: show assignee name below title */}
                    {task.assignee && (
                      <p className="md:hidden text-xs text-gray-400 mt-0.5 truncate">
                        {task.assignee.name}
                      </p>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={task.status} />
                  </td>

                  {/* Priority — desktop only */}
                  <td className="hidden md:table-cell px-4 py-3">
                    <PriorityBadge priority={task.priority} />
                  </td>

                  {/* Assignee — desktop only */}
                  <td className="hidden md:table-cell px-4 py-3">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {task.assignee.name[0].toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-700 truncate">
                          {task.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>

                  {/* Due date — desktop only */}
                  <td className="hidden md:table-cell px-4 py-3">
                    {task.due_date ? (
                      <span
                        className={`text-xs font-medium ${
                          isOverdue(task.due_date) && task.status !== "DONE"
                            ? "text-red-600"
                            : "text-gray-500"
                        }`}
                      >
                        {formatDate(task.due_date)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {/* Actions — desktop only */}
                  {canManage && (
                    <td className="hidden md:table-cell px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(task);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 transition-all"
                        title="Delete task"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Result count */}
      {!loading && filtered.length > 0 && (
        <div className="bg-white border-t border-gray-100 px-4 sm:px-5 py-2 flex-shrink-0">
          <p className="text-xs text-gray-400">
            {filtered.length} of {tasks.length} task
            {tasks.length !== 1 ? "s" : ""}
            {hasActiveFilter ? " (filtered)" : ""}
          </p>
        </div>
      )}

      {/* Task Drawer */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDelete={
            canManage
              ? (id) => {
                  setDeleteTarget({ id });
                  setSelectedTask(null);
                }
              : undefined
          }
        />
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="New task"
        size="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              required
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
              }
              placeholder="Task title"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={newTask.priority}
                onChange={(e) =>
                  setNewTask({ ...newTask, priority: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRIORITY_LIST.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_CONFIG[p].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assignee
              </label>
              <select
                value={newTask.assignee_id}
                onChange={(e) =>
                  setNewTask({ ...newTask, assignee_id: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due date
            </label>
            <input
              type="date"
              value={newTask.due_date}
              onChange={(e) =>
                setNewTask({ ...newTask, due_date: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !newTask.title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create task"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTask}
        loading={deleting}
        title="Delete task"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
