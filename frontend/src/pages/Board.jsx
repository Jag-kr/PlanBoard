import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTasks, createTask, updateTask, deleteTask } from "../api/tasks";
import { getMembers } from "../api/members";
import { useWorkspace } from "../context/WorkspaceContext";
import KanbanBoard from "../components/KanbanBoard";
import TaskDrawer from "../components/TaskDrawer";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import { PRIORITY_LIST } from "../utils/constants";
import { toastError, toastSuccess } from "../utils/toast";
import { hasRole } from "../utils/helpers";

export default function Board() {
  const { id: projectId } = useParams();
  const { activeWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const canManage = hasRole(activeWorkspace?.role, "MANAGER");

  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    assignee_id: "",
    due_date: "",
  });
  const [creating, setCreating] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const res = await getTasks(projectId, params);
      setTasks(res.data.tasks || []);
    } catch {
      toastError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [projectId, search]);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeWorkspace || !canManage) return;
    getMembers(activeWorkspace.id)
      .then((r) => setMembers(r.data.members || []))
      .catch(() => {});
  }, [activeWorkspace, activeWorkspace?.id, canManage]);

  const handleStatusChange = async (task, newStatus) => {
    try {
      const res = await updateTask(task.id, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? res.data.task : t)),
      );
    } catch {
      toastError("Failed to update task status.");
    }
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    );
    setSelectedTask(updatedTask);
  };

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

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setSelectedTask(null);
      toastSuccess("Task deleted.");
    } catch {
      toastError("Failed to delete task.");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-4 flex-shrink-0">
        <button
          onClick={() => navigate("/projects")}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← Projects
        </button>
        <h1 className="text-base font-semibold text-gray-900 flex-1 truncate">
          Board
        </h1>

        {/* Search */}
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
          />
          <svg
            className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400"
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
        </div>

        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <span>＋</span> Add task
          </button>
        )}
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-auto p-4">
        <KanbanBoard
          tasks={tasks}
          onTaskClick={setSelectedTask}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Task drawer */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
        />
      )}

      {/* Create task modal */}
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
                    {p}
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
    </div>
  );
}
