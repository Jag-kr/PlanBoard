import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeftIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  TrashIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { getTasks, createTask, deleteTask } from "../api/tasks";
import { getMembers } from "../api/members";
import { getActiveWorkspace } from "../utils/workspace";
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

// Sort indicator icon
function SortIcon({ col, sortKey, sortAsc }) {
  if (sortKey !== col)
    return <ChevronUpDownIcon className="h-3 w-3 text-gray-300 ml-1 inline" />;
  return sortAsc ? (
    <ChevronUpIcon className="h-3 w-3 text-blue-500 ml-1 inline" />
  ) : (
    <ChevronDownIcon className="h-3 w-3 text-blue-500 ml-1 inline" />
  );
}

// ── component ──────────────────────────────────────────────────────────────────
export default function Tasks() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const activeWorkspace = getActiveWorkspace();
  const canManage = hasRole(activeWorkspace?.role, "MANAGER");

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
  const [sortKey, setSortKey] = useState("created");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeWorkspace) return;
    getMembers(activeWorkspace.id)
      .then((r) => setMembers(r.data.members || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspace?.id]);

  // ── client-side filter + sort ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...tasks];

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (filterStatus) list = list.filter((t) => t.status === filterStatus);
    if (filterPriority)
      list = list.filter((t) => t.priority === filterPriority);
    if (filterAssignee) {
      if (filterAssignee === "__unassigned__")
        list = list.filter((t) => !t.assignee_id);
      else list = list.filter((t) => t.assignee_id === filterAssignee);
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "title") cmp = a.title.localeCompare(b.title);
      else if (sortKey === "priority")
        cmp =
          (PRIORITY_ORDER[a.priority] ?? 99) -
          (PRIORITY_ORDER[b.priority] ?? 99);
      else if (sortKey === "status")
        cmp = STATUS_LIST.indexOf(a.status) - STATUS_LIST.indexOf(b.status);
      else if (sortKey === "due_date") {
        const da = a.due_date ? new Date(a.due_date) : new Date("9999-12-31");
        const db = b.due_date ? new Date(b.due_date) : new Date("9999-12-31");
        cmp = da - db;
      } else {
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
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
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
        {/* Row 1: back + title + add */}
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate("/projects")}
            className="text-gray-600 flex-shrink-0 flex items-center gap-1 text-sm"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Projects</span>
          </button>
          <h1 className="text-base font-semibold text-gray-900 flex-1 truncate">
            Tasks
          </h1>
          {canManage && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-lg flex-shrink-0"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Add task</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>

        {/* Row 2: search + filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <MagnifyingGlassIcon className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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

          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 flex items-center gap-1"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
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
                    className="text-sm text-blue-600 underline"
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
                <th className="hidden md:table-cell w-12 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  #
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none text-gray-700 w-auto"
                  onClick={() => toggleSort("title")}
                >
                  Title{" "}
                  <SortIcon col="title" sortKey={sortKey} sortAsc={sortAsc} />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none text-gray-700 w-32"
                  onClick={() => toggleSort("status")}
                >
                  Status{" "}
                  <SortIcon col="status" sortKey={sortKey} sortAsc={sortAsc} />
                </th>
                <th
                  className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none text-gray-700 w-28"
                  onClick={() => toggleSort("priority")}
                >
                  Priority{" "}
                  <SortIcon
                    col="priority"
                    sortKey={sortKey}
                    sortAsc={sortAsc}
                  />
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">
                  Assignee
                </th>
                <th
                  className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none text-gray-700 w-28"
                  onClick={() => toggleSort("due_date")}
                >
                  Due{" "}
                  <SortIcon
                    col="due_date"
                    sortKey={sortKey}
                    sortAsc={sortAsc}
                  />
                </th>
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
                  className="bg-white cursor-pointer group"
                >
                  <td className="hidden md:table-cell px-4 py-3 text-xs text-gray-400 font-mono">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                    {task.assignee && (
                      <p className="md:hidden text-xs text-gray-400 mt-0.5 truncate">
                        {task.assignee.name}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="hidden md:table-cell px-4 py-3">
                    <PriorityBadge priority={task.priority} />
                  </td>
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
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
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
                  {canManage && (
                    <td className="hidden md:table-cell px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(task);
                        }}
                        className="opacity-100 text-red-600"
                        title="Delete task"
                      >
                        <TrashIcon className="h-4 w-4" />
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
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !newTask.title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-50"
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
