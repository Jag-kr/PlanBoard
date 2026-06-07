import { useState, useEffect } from "react";

import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import TaskDrawer from "../components/TaskDrawer";
import LoadingSpinner from "../components/LoadingSpinner";
import { PriorityBadge, StatusBadge } from "../components/Badge";

import { toastError } from "../utils/toast";
import { getActiveWorkspace } from "../utils/workspace";
import { formatDate, isOverdue, timeAgo } from "../utils/helpers";

import { getWorkspaceStats } from "../api/workspaces";

export default function Dashboard() {
  const activeWorkspace = getActiveWorkspace();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchStats = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const res = await getWorkspaceStats(activeWorkspace.id);
      setStats(res.data);
    } catch {
      toastError("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspace?.id]);

  if (!activeWorkspace)
    return (
      <div className="flex items-center justify-center h-64">
        <EmptyState
          icon="🏢"
          title="No workspace"
          description="Create a workspace to get started."
        />
      </div>
    );

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );

  const statCards = [
    {
      label: "Total Projects",
      value: stats?.totalProjects ?? 0,
      icon: "📁",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Open Tasks",
      value: stats?.openTasks ?? 0,
      icon: "📝",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Overdue",
      value: stats?.overdueTasks ?? 0,
      icon: "⚠️",
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Completed",
      value: stats?.completedTasks ?? 0,
      icon: "✅",
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  const handleTaskUpdated = (updated) => {
    setStats((prev) => {
      if (!prev) return prev;
      const myTasks = prev.myTasks.map((t) =>
        t.id === updated.id ? updated : t,
      );
      const recentActivity = prev.recentActivity.map((t) =>
        t.id === updated.id ? updated : t,
      );
      return { ...prev, myTasks, recentActivity };
    });
    setSelectedTask(updated);
  };

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-7xl mx-auto space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {activeWorkspace.name}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Dashboard overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
          >
            <div
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.bg} text-xl mb-3`}
            >
              {card.icon}
            </div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* My tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            My Tasks
          </h2>
          {stats?.myTasks?.length === 0 ? (
            <EmptyState
              icon="🎉"
              title="All caught up!"
              description="No tasks assigned to you."
            />
          ) : (
            <div className="space-y-2">
              {stats?.myTasks?.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 w-full min-w-0"
                >
                  <div className="flex-shrink-0">
                    <PriorityBadge priority={task.priority} />
                  </div>

                  <span className="text-sm font-medium text-gray-800 flex-1 truncate min-w-0 text-left">
                    {task.title}
                  </span>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                    <StatusBadge status={task.status} />
                    {task.due_date && (
                      <span
                        className={`text-xs whitespace-nowrap ${
                          isOverdue(task.due_date)
                            ? "text-red-600 font-semibold"
                            : "text-gray-400"
                        }`}
                      >
                        {formatDate(task.due_date)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Recent Activity
          </h2>
          {stats?.recentActivity?.length === 0 ? (
            <EmptyState
              icon="📭"
              title="No activity yet"
              description="Start creating tasks to see activity here."
            />
          ) : (
            <div className="space-y-2">
              {stats?.recentActivity?.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                >
                  {task.assignee && (
                    <Avatar name={task.assignee.name} size="sm" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {task.Project?.name}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <StatusBadge status={task.status} />
                    <p className="text-xs text-gray-400 mt-0.5">
                      {timeAgo(task.updatedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Drawer */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
        />
      )}
    </div>
  );
}
